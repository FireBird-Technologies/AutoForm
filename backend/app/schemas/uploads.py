from pydantic import BaseModel, Field
from typing import Optional


class UploadCreateRequest(BaseModel):
    question_id: int = Field(..., ge=1)
    filename: str = Field(..., min_length=1, max_length=512)
    content_type: Optional[str] = None
    size_bytes: Optional[int] = Field(default=None, ge=0)


class UploadCreateResponse(BaseModel):
    upload_id: int
    upload_url: str
    s3_key: str
    expires_in: int
    original_filename: str


class UploadCompleteRequest(BaseModel):
    content_type: Optional[str] = None
    size_bytes: Optional[int] = Field(default=None, ge=0)


class UploadCompleteResponse(BaseModel):
    success: bool
