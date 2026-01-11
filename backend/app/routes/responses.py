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
from ..models import User, Form, FormQuestion, FormResponse, ResponseAnswer, PublicForm
from ..schemas.form import (
    SubmissionCreate, SubmissionResponse,
    FormResponseDetail, FormResponsesList, ResponseAnswerDetail,
    PublicFormDetail, FormResponse as FormSchema
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["responses"])


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
        # Create form response
        form_response = FormResponse(
            form_id=form.id,
            ip_address=client_ip,
            submission_metadata=submission.metadata or {}
        )
        db.add(form_response)
        db.flush()
        
        # Create answers
        for answer_data in submission.answers:
            answer = ResponseAnswer(
                form_response_id=form_response.id,
                form_question_id=answer_data.question_id,
                answer_value=answer_data.answer_value.model_dump()
            )
            db.add(answer)
        
        db.commit()
        db.refresh(form_response)
        
        return SubmissionResponse(
            id=form_response.id,
            form_id=form.id,
            submitted_at=form_response.submitted_at,
            message=public_form.custom_thank_you_message or "Thank you for your submission!"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Form submission failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit form"
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
    
    # Build detailed response list
    response_details = []
    for response in responses:
        answers = []
        for answer in response.answers:
            question = db.query(FormQuestion).filter(
                FormQuestion.id == answer.form_question_id
            ).first()
            
            if question:
                answers.append(ResponseAnswerDetail(
                    question_id=question.id,
                    question_text=question.question_text,
                    question_type=question.question_type,
                    answer_value=answer.answer_value or {}
                ))
        
        response_details.append(FormResponseDetail(
            id=response.id,
            form_id=response.form_id,
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
    for answer in response.answers:
        question = db.query(FormQuestion).filter(
            FormQuestion.id == answer.form_question_id
        ).first()
        
        if question:
            answers.append(ResponseAnswerDetail(
                question_id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
                answer_value=answer.answer_value or {}
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
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    headers = ["Response ID", "Submitted At", "IP Address"]
    headers.extend([q.question_text for q in questions])
    writer.writerow(headers)
    
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
                else:
                    row.append(json.dumps(answer_value))
            else:
                row.append(str(answer_value))
        
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
                response_data["answers"].append({
                    "question_id": question.id,
                    "question_text": question.question_text,
                    "question_type": question.question_type.value,
                    "answer_value": answer.answer_value
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

