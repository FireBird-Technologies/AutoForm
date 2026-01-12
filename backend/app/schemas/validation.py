"""
Validation schemas for form submissions
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class FieldValidationError(BaseModel):
    """Individual field validation error"""
    question_id: int
    field: str
    message: str
    error_type: str  # "required", "invalid_format", "out_of_range", "invalid_choice", etc.


class ValidationResponse(BaseModel):
    """Structured validation response"""
    is_valid: bool
    errors: List[FieldValidationError] = []
    warnings: List[FieldValidationError] = []


class PartialSubmissionCreate(BaseModel):
    """Schema for auto-save partial submissions"""
    session_id: str = Field(..., min_length=1, max_length=64)
    form_version: Optional[int] = None
    answers: List[Dict[str, Any]]  # Flexible for partial data
    metadata: Optional[Dict[str, Any]] = None
    
    # UTM parameters
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None


class CompleteSubmissionCreate(BaseModel):
    """Schema for final submission (inherits from existing SubmissionCreate)"""
    session_id: str = Field(..., min_length=1, max_length=64)
    form_version: Optional[int] = None
    answers: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None
    honeypot: Optional[str] = None  # Should be empty
    
    # UTM parameters
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None


class ValidationContext(BaseModel):
    """Context for validation including anti-tampering token"""
    form_id: int
    session_id: str
    validation_token: str
    timestamp: datetime


class AutoSaveResponse(BaseModel):
    """Response from auto-save endpoint"""
    success: bool
    submission_id: Optional[int] = None
    validation: ValidationResponse
    message: str = "Auto-saved successfully"
