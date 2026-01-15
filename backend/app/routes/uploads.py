"""
Uploads API Routes
==================

Presigned S3 uploads for public form submissions.
"""

import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.security import get_current_user
from ..models import Form, FormQuestion, FormUpload, PublicForm, QuestionType, User
from ..schemas.uploads import (
    UploadCreateRequest,
    UploadCreateResponse,
    UploadCompleteRequest,
    UploadCompleteResponse
)
from ..services.s3_service import s3_service

router = APIRouter(prefix="/api", tags=["uploads"])


@router.post("/public/forms/{token}/uploads", response_model=UploadCreateResponse)
async def create_public_upload(
    token: str,
    payload: UploadCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a presigned upload URL for a public form submission."""
    public_form = db.query(PublicForm).filter(
        PublicForm.share_token == token,
        PublicForm.is_public == True
    ).first()
    
    if not public_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or no longer accepting responses"
        )
    
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
    
    question = db.query(FormQuestion).filter(
        FormQuestion.id == payload.question_id,
        FormQuestion.form_id == form.id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    if question.question_type != QuestionType.FILE_UPLOAD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not accept file uploads"
        )
    
    settings = question.settings or {}
    max_size = settings.get("max_file_size")
    if max_size and payload.size_bytes and payload.size_bytes > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum allowed size"
        )
    
    allowed_types = settings.get("file_types") or []
    if allowed_types:
        ext = os.path.splitext(payload.filename)[1].lower()
        allowed = {t.lower() for t in allowed_types}
        if ext and ext not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed"
            )
    
    upload = FormUpload(
        user_id=public_form.user_id,
        form_id=form.id,
        form_question_id=question.id,
        original_filename=payload.filename,
        content_type=payload.content_type,
        size_bytes=payload.size_bytes,
        status="pending",
        s3_key=""
    )
    db.add(upload)
    db.flush()
    
    s3_key = s3_service.build_key(form.id, form.title, upload.id, payload.filename)
    upload.s3_key = s3_key
    db.commit()
    
    try:
        upload_url = s3_service.generate_presigned_upload_url(
            key=s3_key,
            content_type=payload.content_type
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="S3 upload is not configured"
        )
    
    return UploadCreateResponse(
        upload_id=upload.id,
        upload_url=upload_url,
        s3_key=s3_key,
        expires_in=900,
        original_filename=payload.filename
    )


@router.post("/public/forms/{token}/uploads/{upload_id}/complete", response_model=UploadCompleteResponse)
async def complete_public_upload(
    token: str,
    upload_id: int,
    payload: UploadCompleteRequest,
    db: Session = Depends(get_db)
):
    """Mark a public upload as completed."""
    public_form = db.query(PublicForm).filter(
        PublicForm.share_token == token,
        PublicForm.is_public == True
    ).first()
    
    if not public_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    upload = db.query(FormUpload).filter(
        FormUpload.id == upload_id,
        FormUpload.form_id == public_form.form_id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    if payload.content_type:
        upload.content_type = payload.content_type
    if payload.size_bytes is not None:
        upload.size_bytes = payload.size_bytes
    
    upload.status = "uploaded"
    upload.uploaded_at = datetime.utcnow()
    db.commit()
    
    return UploadCompleteResponse(success=True)


@router.get("/forms/{form_id}/uploads/{upload_id}/download")
async def download_upload(
    form_id: int,
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a presigned download URL for a file upload (owner only)."""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    upload = db.query(FormUpload).filter(
        FormUpload.id == upload_id,
        FormUpload.form_id == form_id
    ).first()
    
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload not found"
        )
    
    try:
        download_url = s3_service.generate_presigned_download_url(
            key=upload.s3_key,
            filename=upload.original_filename
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="S3 download is not configured"
        )
    
    return {"download_url": download_url}
