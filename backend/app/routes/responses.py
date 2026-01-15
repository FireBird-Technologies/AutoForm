"""
Form Responses API Routes
==========================

Routes for form submission and response management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List
import json
import csv
import io
from datetime import datetime

from ..core.db import get_db
from ..core.security import get_current_user
from ..models import User, Form, FormQuestion, FormResponse, ResponseAnswer, PublicForm, FormUpload, QuestionType
from ..schemas.form import (
    SubmissionCreate, SubmissionResponse,
    FormResponseDetail, FormResponsesList, ResponseAnswerDetail,
    PublicFormDetail, FormResponse as FormSchema
)
from ..schemas.validation import PartialSubmissionCreate, AutoSaveResponse
from ..services.validation_service import validation_service
from ..services.analytics_service import analytics_service
from ..services.webhook_service import webhook_service
from ..services.s3_service import s3_service
from ..middleware.rate_limiter import rate_limiter

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["responses"])


def _extract_upload_ids(answer_value: dict) -> List[int]:
    if not isinstance(answer_value, dict):
        return []
    files = answer_value.get("files") or []
    upload_ids = []
    for item in files:
        upload_id = None
        if isinstance(item, dict):
            upload_id = item.get("upload_id")
        elif isinstance(item, int):
            upload_id = item
        elif isinstance(item, str) and item.isdigit():
            upload_id = int(item)
        if isinstance(upload_id, int):
            upload_ids.append(upload_id)
    return upload_ids


def _attach_uploads(
    db: Session,
    upload_ids: List[int],
    form_id: int,
    response_id: int,
    question_id: int
) -> None:
    if not upload_ids:
        return
    if not question_id:
        return
    try:
        question_id = int(question_id)
    except (TypeError, ValueError):
        return
    uploads = db.query(FormUpload).filter(FormUpload.id.in_(upload_ids)).all()
    upload_map = {upload.id: upload for upload in uploads}
    
    for upload_id in upload_ids:
        upload = upload_map.get(upload_id)
        if not upload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid upload reference"
            )
        if upload.form_id != form_id or upload.form_question_id != question_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload does not match form or question"
            )
        if upload.status not in ["pending", "uploaded", "attached"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload is not ready"
            )
        
        upload.form_response_id = response_id
        upload.status = "attached"
        upload.attached_at = datetime.utcnow()


def _enrich_answer_files(
    answer_value: dict,
    upload_map: dict,
    include_download_url: bool = True
) -> dict:
    if not isinstance(answer_value, dict):
        return answer_value
    files = answer_value.get("files") or []
    if not files:
        return answer_value
    
    enriched = []
    for item in files:
        upload_id = None
        if isinstance(item, dict):
            upload_id = item.get("upload_id")
        elif isinstance(item, int):
            upload_id = item
        elif isinstance(item, str) and item.isdigit():
            upload_id = int(item)
        
        if not isinstance(upload_id, int):
            continue
        
        upload = upload_map.get(upload_id)
        if not upload:
            continue
        
        file_entry = {
            "upload_id": upload.id,
            "filename": upload.original_filename,
            "content_type": upload.content_type,
            "size_bytes": upload.size_bytes,
            "s3_key": upload.s3_key
        }
        
        if include_download_url:
            try:
                file_entry["download_url"] = s3_service.generate_presigned_download_url(
                    key=upload.s3_key,
                    filename=upload.original_filename
                )
            except Exception:
                pass
        
        enriched.append(file_entry)
    
    updated = dict(answer_value)
    updated["files"] = enriched
    return updated

@router.post("/public/forms/{token}/submit", response_model=SubmissionResponse)
async def submit_form(
    token: str,
    submission: SubmissionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for submitting a form response.
    No authentication required.
    """
    # Find public form by token
    public_form = db.query(PublicForm).filter(
        PublicForm.share_token == token,
        PublicForm.is_public == True
    ).first()
    
    if not public_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or no longer accepting responses"
        )
    
    # Check if expired
    if public_form.expires_at and public_form.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This form has expired"
        )
    
    # Get the form
    form = db.query(Form).filter(Form.id == public_form.form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get client IP
    client_ip = request.client.host if request.client else None
    
    try:
        # Try to reuse existing in-progress response for this session (if provided)
        form_response = None
        if submission.session_id:
            form_response = db.query(FormResponse).filter(
                FormResponse.form_id == form.id,
                FormResponse.session_id == submission.session_id,
                FormResponse.status.in_(["in_progress", "partial"])
            ).first()
        
        if form_response:
            form_response.last_updated_at = datetime.utcnow()
            form_response.submitted_at = datetime.utcnow()
            form_response.ip_address = client_ip
            form_response.utm_source = submission.utm_source
            form_response.utm_medium = submission.utm_medium
            form_response.utm_campaign = submission.utm_campaign
            if submission.metadata:
                form_response.submission_metadata = submission.metadata
        else:
            # Create new form response
            form_response = FormResponse(
                form_id=form.id,
                session_id=submission.session_id,
                status="complete",
                form_version=submission.form_version,
                started_at=datetime.utcnow(),
                submitted_at=datetime.utcnow(),
                ip_address=client_ip,
                utm_source=submission.utm_source,
                utm_medium=submission.utm_medium,
                utm_campaign=submission.utm_campaign,
                submission_metadata=submission.metadata or {}
            )
            db.add(form_response)
            db.flush()
        
        # Create/update answers
        for answer_data in submission.answers:
            answer_value = answer_data.answer_value.model_dump()
            upload_ids = _extract_upload_ids(answer_value)
            _attach_uploads(
                db=db,
                upload_ids=upload_ids,
                form_id=form.id,
                response_id=form_response.id,
                question_id=answer_data.question_id
            )
            
            existing_answer = db.query(ResponseAnswer).filter(
                ResponseAnswer.form_response_id == form_response.id,
                ResponseAnswer.form_question_id == answer_data.question_id
            ).first()
            
            if existing_answer:
                existing_answer.answer_value = answer_value
            else:
                answer = ResponseAnswer(
                    form_response_id=form_response.id,
                    form_question_id=answer_data.question_id,
                    answer_value=answer_value
                )
                db.add(answer)
        
        # Validate and set status based on whether all required fields are answered
        validation_result = validation_service.validate_submission(
            db=db,
            form_id=form.id,
            answers=[
                {"question_id": a.question_id, "answer_value": a.answer_value.model_dump()}
                for a in submission.answers
            ],
            is_complete=True,
            form_version=submission.form_version
        )
        
        # Set status: "complete" if all required fields answered, "partial" otherwise
        form_response.status = "complete" if validation_result.is_valid else "partial"
        
        db.commit()
        db.refresh(form_response)
        
        return SubmissionResponse(
            id=form_response.id,
            form_id=form.id,
            submitted_at=form_response.submitted_at,
            message=public_form.custom_thank_you_message or "Thank you for your submission!"
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Form submission failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit form"
        )


@router.post("/public/forms/{token}/autosave", response_model=AutoSaveResponse)
async def autosave_submission(
    token: str,
    submission: PartialSubmissionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Auto-save partial submission after each question.
    No authentication required.
    """
    # Find public form by token
    public_form = db.query(PublicForm).filter(
        PublicForm.share_token == token,
        PublicForm.is_public == True
    ).first()
    
    if not public_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get form
    form = db.query(Form).filter(Form.id == public_form.form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get client IP
    client_ip = request.client.host if request.client else None
    ip_hash = rate_limiter.hash_identifier(client_ip) if client_ip else "unknown"
    
    try:
        # Find existing in-progress submission for this session
        existing_response = db.query(FormResponse).filter(
            FormResponse.form_id == form.id,
            FormResponse.session_id == submission.session_id,
            FormResponse.status.in_(["in_progress", "partial"])
        ).first()
        
        if existing_response:
            # Update existing response
            existing_response.last_updated_at = datetime.utcnow()
            existing_response.status = "in_progress"
            
            # Update answers
            for answer_data in submission.answers:
                # Check if answer exists
                existing_answer = db.query(ResponseAnswer).filter(
                    ResponseAnswer.form_response_id == existing_response.id,
                    ResponseAnswer.form_question_id == answer_data.get('question_id')
                ).first()
                
                answer_value = answer_data.get('answer_value', {})
                upload_ids = _extract_upload_ids(answer_value)
                _attach_uploads(
                    db=db,
                    upload_ids=upload_ids,
                    form_id=form.id,
                    response_id=existing_response.id,
                    question_id=answer_data.get('question_id')
                )
                
                if existing_answer:
                    # Update existing answer
                    existing_answer.answer_value = answer_value
                else:
                    # Create new answer
                    new_answer = ResponseAnswer(
                        form_response_id=existing_response.id,
                        form_question_id=answer_data.get('question_id'),
                        answer_value=answer_value
                    )
                    db.add(new_answer)
            
            form_response = existing_response
        else:
            # Create new form response
            form_response = FormResponse(
                form_id=form.id,
                session_id=submission.session_id,
                status="in_progress",
                form_version=submission.form_version,
                started_at=datetime.utcnow(),
                last_updated_at=datetime.utcnow(),
                ip_address=client_ip,
                ip_address_hash=ip_hash,
                utm_source=submission.utm_source,
                utm_medium=submission.utm_medium,
                utm_campaign=submission.utm_campaign,
                submission_metadata=submission.metadata or {}
            )
            db.add(form_response)
            db.flush()
            
            # Create answers
            for answer_data in submission.answers:
                answer_value = answer_data.get('answer_value', {})
                upload_ids = _extract_upload_ids(answer_value)
                _attach_uploads(
                    db=db,
                    upload_ids=upload_ids,
                    form_id=form.id,
                    response_id=form_response.id,
                    question_id=answer_data.get('question_id')
                )
                answer = ResponseAnswer(
                    form_response_id=form_response.id,
                    form_question_id=answer_data.get('question_id'),
                    answer_value=answer_value
                )
                db.add(answer)
        
        db.commit()
        db.refresh(form_response)
        
        # Validate answers (non-blocking)
        validation_result = validation_service.validate_submission(
            db=db,
            form_id=form.id,
            answers=submission.answers,
            is_complete=False
        )
        
        return AutoSaveResponse(
            success=True,
            submission_id=form_response.id,
            validation=validation_result,
            message="Auto-saved successfully"
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Auto-save failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to auto-save"
        )


@router.get("/public/forms/{token}", response_model=PublicFormDetail)
async def get_public_form(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get public form structure for filling out.
    No authentication required.
    """
    public_form = db.query(PublicForm).filter(
        PublicForm.share_token == token,
        PublicForm.is_public == True
    ).first()
    
    if not public_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check if expired
    if public_form.expires_at and public_form.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This form has expired"
        )
    
    form = db.query(Form).filter(Form.id == public_form.form_id).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    return PublicFormDetail(
        form=FormSchema.model_validate(form),
        public_settings=public_form
    )


@router.get("/forms/{form_id}/responses", response_model=FormResponsesList)
async def get_form_responses(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    """
    Get all responses for a form.
    Requires authentication and form ownership.
    """
    # Verify form ownership
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get total count
    total_count = db.query(func.count(FormResponse.id)).filter(
        FormResponse.form_id == form_id
    ).scalar()
    
    # Get responses with answers
    responses = db.query(FormResponse).filter(
        FormResponse.form_id == form_id
    ).order_by(desc(FormResponse.submitted_at)).limit(limit).offset(offset).all()
    
    upload_ids = set()
    for response in responses:
        for answer in response.answers:
            upload_ids.update(_extract_upload_ids(answer.answer_value or {}))
    
    upload_map = {}
    if upload_ids:
        uploads = db.query(FormUpload).filter(FormUpload.id.in_(upload_ids)).all()
        upload_map = {upload.id: upload for upload in uploads}
    
    # Build detailed response list
    response_details = []
    for response in responses:
        answers = []
        for answer in response.answers:
            question = db.query(FormQuestion).filter(
                FormQuestion.id == answer.form_question_id
            ).first()
            
            if question:
                answer_value = _enrich_answer_files(
                    answer.answer_value or {},
                    upload_map,
                    include_download_url=True
                )
                answers.append(ResponseAnswerDetail(
                    question_id=question.id,
                    question_text=question.question_text,
                    question_type=question.question_type,
                    answer_value=answer_value
                ))
        
        response_details.append(FormResponseDetail(
            id=response.id,
            form_id=response.form_id,
            status=response.status,
            submitted_at=response.submitted_at,
            ip_address=response.ip_address,
            answers=answers
        ))
    
    return FormResponsesList(
        total_count=total_count,
        responses=response_details
    )


@router.get("/forms/{form_id}/responses/{response_id}", response_model=FormResponseDetail)
async def get_single_response(
    form_id: int,
    response_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single form response by ID"""
    # Verify form ownership
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    response = db.query(FormResponse).filter(
        FormResponse.id == response_id,
        FormResponse.form_id == form_id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found"
        )
    
    # Build answer details
    answers = []
    upload_ids = set()
    for answer in response.answers:
        upload_ids.update(_extract_upload_ids(answer.answer_value or {}))
    
    upload_map = {}
    if upload_ids:
        uploads = db.query(FormUpload).filter(FormUpload.id.in_(upload_ids)).all()
        upload_map = {upload.id: upload for upload in uploads}
    
    for answer in response.answers:
        question = db.query(FormQuestion).filter(
            FormQuestion.id == answer.form_question_id
        ).first()
        
        if question:
            answer_value = _enrich_answer_files(
                answer.answer_value or {},
                upload_map,
                include_download_url=True
            )
            answers.append(ResponseAnswerDetail(
                question_id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
                answer_value=answer_value
            ))
    
    return FormResponseDetail(
        id=response.id,
        form_id=response.form_id,
        submitted_at=response.submitted_at,
        ip_address=response.ip_address,
        answers=answers
    )


@router.get("/forms/{form_id}/responses/export/csv")
async def export_responses_csv(
    form_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export form responses as CSV"""
    from fastapi.responses import StreamingResponse
    
    # Verify form ownership
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get all questions for headers
    questions = db.query(FormQuestion).filter(
        FormQuestion.form_id == form_id
    ).order_by(FormQuestion.question_order).all()
    
    # Get all responses
    responses = db.query(FormResponse).filter(
        FormResponse.form_id == form_id
    ).order_by(desc(FormResponse.submitted_at)).all()
    
    upload_ids = set()
    for response in responses:
        for answer in response.answers:
            upload_ids.update(_extract_upload_ids(answer.answer_value or {}))
    
    upload_map = {}
    if upload_ids:
        uploads = db.query(FormUpload).filter(FormUpload.id.in_(upload_ids)).all()
        upload_map = {upload.id: upload for upload in uploads}
    
    upload_ids = set()
    for response in responses:
        for answer in response.answers:
            upload_ids.update(_extract_upload_ids(answer.answer_value or {}))
    
    upload_map = {}
    if upload_ids:
        uploads = db.query(FormUpload).filter(FormUpload.id.in_(upload_ids)).all()
        upload_map = {upload.id: upload for upload in uploads}
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    headers = ["Response ID", "Submitted At", "IP Address"]
    for question in questions:
        headers.append(question.question_text)
        if question.question_type == QuestionType.FILE_UPLOAD:
            headers.append(f"{question.question_text} (download_url)")
    writer.writerow(headers)
    
    base_url = str(request.base_url).rstrip("/")

    # Write data rows
    for response in responses:
        row = [
            response.id,
            response.submitted_at.isoformat(),
            response.ip_address or ""
        ]
        
        # Create answer map
        answer_map = {
            answer.form_question_id: answer.answer_value
            for answer in response.answers
        }
        
        # Add answers in question order
        for question in questions:
            answer_value = answer_map.get(question.id, {})
            if isinstance(answer_value, dict):
                answer_value = _enrich_answer_files(
                    answer_value,
                    upload_map,
                    include_download_url=True
                )
            
            # Format answer based on type
            if isinstance(answer_value, dict):
                # Extract the most relevant field
                if "text" in answer_value:
                    row.append(answer_value["text"])
                elif "number" in answer_value:
                    row.append(str(answer_value["number"]))
                elif "choices" in answer_value:
                    row.append(", ".join(answer_value["choices"]))
                elif "date" in answer_value:
                    row.append(answer_value["date"])
                elif "rating" in answer_value:
                    row.append(str(answer_value["rating"]))
                elif "files" in answer_value and answer_value["files"]:
                    file_labels = []
                    file_links = []
                    for file_item in answer_value["files"]:
                        if not isinstance(file_item, dict):
                            file_labels.append(str(file_item))
                            file_links.append(str(file_item))
                            continue
                        file_labels.append(
                            file_item.get("download_url")
                            or file_item.get("filename")
                            or file_item.get("original_filename")
                            or file_item.get("s3_key")
                            or str(file_item.get("upload_id", ""))
                        )
                        if file_item.get("download_url"):
                            file_links.append(file_item["download_url"])
                        elif file_item.get("upload_id"):
                            file_links.append(
                                f"{base_url}/api/forms/{form_id}/uploads/{file_item['upload_id']}/download"
                            )
                    row.append(", ".join([label for label in file_labels if label]))
                    if question.question_type == QuestionType.FILE_UPLOAD:
                        row.append(", ".join([link for link in file_links if link]))
                elif "file_url" in answer_value:
                    row.append(answer_value["file_url"])
                    if question.question_type == QuestionType.FILE_UPLOAD:
                        row.append(answer_value["file_url"])
                else:
                    row.append(json.dumps(answer_value))
                    if question.question_type == QuestionType.FILE_UPLOAD:
                        row.append("")
            else:
                row.append(str(answer_value))
                if question.question_type == QuestionType.FILE_UPLOAD:
                    row.append("")
        
        writer.writerow(row)
    
    # Prepare response
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=form_{form_id}_responses.csv"
        }
    )


@router.get("/forms/{form_id}/responses/export/json")
async def export_responses_json(
    form_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export form responses as JSON"""
    from fastapi.responses import JSONResponse
    
    # Verify form ownership
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get all responses
    responses = db.query(FormResponse).filter(
        FormResponse.form_id == form_id
    ).order_by(desc(FormResponse.submitted_at)).all()
    
    upload_ids = set()
    for response in responses:
        for answer in response.answers:
            upload_ids.update(_extract_upload_ids(answer.answer_value or {}))
    
    upload_map = {}
    if upload_ids:
        uploads = db.query(FormUpload).filter(FormUpload.id.in_(upload_ids)).all()
        upload_map = {upload.id: upload for upload in uploads}
    
    base_url = str(request.base_url).rstrip("/")

    # Build export data
    export_data = {
        "form_id": form_id,
        "form_title": form.title,
        "exported_at": datetime.utcnow().isoformat(),
        "total_responses": len(responses),
        "responses": []
    }
    
    for response in responses:
        response_data = {
            "id": response.id,
            "submitted_at": response.submitted_at.isoformat(),
            "ip_address": response.ip_address,
            "answers": []
        }
        
        for answer in response.answers:
            question = db.query(FormQuestion).filter(
                FormQuestion.id == answer.form_question_id
            ).first()
            
            if question:
                answer_value = _enrich_answer_files(
                    answer.answer_value or {},
                    upload_map,
                    include_download_url=True
                )
                if isinstance(answer_value, dict) and "files" in answer_value:
                    updated_files = []
                    for file_item in answer_value.get("files") or []:
                        if not isinstance(file_item, dict):
                            updated_files.append(file_item)
                            continue
                        if not file_item.get("download_url") and file_item.get("upload_id"):
                            file_item = dict(file_item)
                            file_item["download_url"] = (
                                f"{base_url}/api/forms/{form_id}/uploads/{file_item['upload_id']}/download"
                            )
                        updated_files.append(file_item)
                    answer_value = dict(answer_value)
                    answer_value["files"] = updated_files
                response_data["answers"].append({
                    "question_id": question.id,
                    "question_text": question.question_text,
                    "question_type": question.question_type.value,
                    "answer_value": answer_value
                })
        
        export_data["responses"].append(response_data)
    
    return JSONResponse(
        content=export_data,
        headers={
            "Content-Disposition": f"attachment; filename=form_{form_id}_responses.json"
        }
    )


@router.delete("/forms/{form_id}/responses/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_response(
    form_id: int,
    response_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific form response"""
    # Verify form ownership
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    response = db.query(FormResponse).filter(
        FormResponse.id == response_id,
        FormResponse.form_id == form_id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found"
        )
    
    db.delete(response)
    db.commit()
    
    return None
