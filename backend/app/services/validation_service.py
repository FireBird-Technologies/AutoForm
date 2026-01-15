"""
Validation service for form submissions
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import re
import hmac
import hashlib
import secrets
from datetime import datetime
from urllib.parse import urlparse

from ..models import FormQuestion, Form, QuestionType
from ..schemas.validation import FieldValidationError, ValidationResponse
from ..schemas.form import AnswerValue


class ValidationService:
    """Service for validating form submissions"""
    
    # Email regex pattern
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # Phone pattern (E.164 format)
    PHONE_PATTERN = re.compile(r'^\+?[1-9]\d{1,14}$')
    
    # URL pattern
    URL_PATTERN = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    
    def __init__(self):
        # Use environment variable or generate a secret for HMAC
        self.secret_key = secrets.token_hex(32)
    
    def validate_submission(
        self, 
        db: Session, 
        form_id: int, 
        answers: List[Dict[str, Any]], 
        is_complete: bool = False,
        form_version: Optional[int] = None
    ) -> ValidationResponse:
        """
        Validate submission against form schema.
        
        Args:
            db: Database session
            form_id: ID of the form
            answers: List of answer dictionaries
            is_complete: Whether to enforce required fields
            form_version: Optional version to validate against (future use)
        
        Returns:
            ValidationResponse with errors and warnings
        """
        errors = []
        warnings = []
        
        # Fetch form with questions
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            return ValidationResponse(
                is_valid=False,
                errors=[FieldValidationError(
                    question_id=0,
                    field="form",
                    message="Form not found",
                    error_type="not_found"
                )]
            )
        
        # Create answer map for quick lookup
        answer_map = {ans.get('question_id'): ans.get('answer_value', {}) for ans in answers}
        
        # Validate each question
        for question in form.questions:
            answer_value = answer_map.get(question.id)
            
            # Check required fields (only if is_complete)
            if is_complete and question.required and not self._has_value(answer_value):
                errors.append(FieldValidationError(
                    question_id=question.id,
                    field="value",
                    message=f"{question.question_text} is required",
                    error_type="required"
                ))
                continue
            
            # Skip validation if no answer provided (for partial submissions)
            if not self._has_value(answer_value):
                continue
            
            # Validate based on question type
            field_error = self.validate_field(question, answer_value)
            if field_error:
                errors.append(field_error)
        
        return ValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def validate_field(
        self, 
        question: FormQuestion, 
        answer_value: Dict[str, Any]
    ) -> Optional[FieldValidationError]:
        """
        Validate single field based on question type and settings.
        
        Args:
            question: FormQuestion object
            answer_value: Answer value dictionary
        
        Returns:
            FieldValidationError if validation fails, None otherwise
        """
        if not answer_value:
            return None
        
        question_type = question.question_type
        settings = question.settings or {}
        
        # EMAIL validation
        if question_type == QuestionType.EMAIL:
            email = answer_value.get('text', '')
            if email and not self.EMAIL_PATTERN.match(email):
                return FieldValidationError(
                    question_id=question.id,
                    field="text",
                    message="Invalid email format",
                    error_type="invalid_format"
                )
        
        # PHONE validation
        elif question_type == QuestionType.PHONE:
            phone = answer_value.get('text', '')
            if phone:
                # Remove spaces and dashes for validation
                cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
                if not self.PHONE_PATTERN.match(cleaned_phone):
                    return FieldValidationError(
                        question_id=question.id,
                        field="text",
                        message="Invalid phone number format",
                        error_type="invalid_format"
                    )
        
        # LINK validation
        elif question_type == QuestionType.LINK:
            url = answer_value.get('text', '')
            if url and not self.URL_PATTERN.match(url):
                return FieldValidationError(
                    question_id=question.id,
                    field="text",
                    message="Invalid URL format",
                    error_type="invalid_format"
                )
        
        # NUMBER validation
        elif question_type == QuestionType.NUMBER:
            number = answer_value.get('number')
            if number is not None:
                min_value = settings.get('min_value')
                max_value = settings.get('max_value')
                
                if min_value is not None and number < min_value:
                    return FieldValidationError(
                        question_id=question.id,
                        field="number",
                        message=f"Value must be at least {min_value}",
                        error_type="out_of_range"
                    )
                
                if max_value is not None and number > max_value:
                    return FieldValidationError(
                        question_id=question.id,
                        field="number",
                        message=f"Value must be at most {max_value}",
                        error_type="out_of_range"
                    )
        
        # SHORT_ANSWER / LONG_ANSWER length validation
        elif question_type in [QuestionType.SHORT_ANSWER, QuestionType.LONG_ANSWER]:
            text = answer_value.get('text', '')
            if text:
                min_length = settings.get('min_length')
                max_length = settings.get('max_length')
                
                if min_length and len(text) < min_length:
                    return FieldValidationError(
                        question_id=question.id,
                        field="text",
                        message=f"Must be at least {min_length} characters",
                        error_type="too_short"
                    )
                
                if max_length and len(text) > max_length:
                    return FieldValidationError(
                        question_id=question.id,
                        field="text",
                        message=f"Must be at most {max_length} characters",
                        error_type="too_long"
                    )
        
        # MULTIPLE_CHOICE / DROPDOWN validation
        elif question_type in [QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN]:
            choices = answer_value.get('choices', [])
            valid_choices = settings.get('choices', [])
            
            if choices and valid_choices:
                for choice in choices:
                    if choice not in valid_choices:
                        return FieldValidationError(
                            question_id=question.id,
                            field="choices",
                            message=f"Invalid choice: {choice}",
                            error_type="invalid_choice"
                        )
        
        # CHECKBOXES / MULTI_SELECT validation
        elif question_type in [QuestionType.CHECKBOXES, QuestionType.MULTI_SELECT]:
            choices = answer_value.get('choices', [])
            valid_choices = settings.get('choices', [])
            
            if choices and valid_choices:
                for choice in choices:
                    if choice not in valid_choices:
                        return FieldValidationError(
                            question_id=question.id,
                            field="choices",
                            message=f"Invalid choice: {choice}",
                            error_type="invalid_choice"
                        )
                
                # Check max selections if configured
                max_selections = settings.get('max_selections')
                if max_selections and len(choices) > max_selections:
                    return FieldValidationError(
                        question_id=question.id,
                        field="choices",
                        message=f"Maximum {max_selections} selections allowed",
                        error_type="too_many_selections"
                    )
        
        # DATE validation (ISO format)
        elif question_type == QuestionType.DATE:
            date_str = answer_value.get('date', '')
            if date_str:
                try:
                    datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    return FieldValidationError(
                        question_id=question.id,
                        field="date",
                        message="Invalid date format",
                        error_type="invalid_format"
                    )
        
        # TIME validation
        elif question_type == QuestionType.TIME:
            time_str = answer_value.get('date', '')  # Time is also stored in 'date' field
            if time_str:
                try:
                    # Validate HH:MM or HH:MM:SS format
                    datetime.strptime(time_str, '%H:%M:%S')
                except ValueError:
                    try:
                        datetime.strptime(time_str, '%H:%M')
                    except ValueError:
                        return FieldValidationError(
                            question_id=question.id,
                            field="date",
                            message="Invalid time format",
                            error_type="invalid_format"
                        )
        
        # LINEAR_SCALE validation
        elif question_type == QuestionType.LINEAR_SCALE:
            rating = answer_value.get('rating')
            if rating is not None:
                min_val = settings.get('min_value', 1)
                max_val = settings.get('max_value', 5)
                
                if rating < min_val or rating > max_val:
                    return FieldValidationError(
                        question_id=question.id,
                        field="rating",
                        message=f"Rating must be between {min_val} and {max_val}",
                        error_type="out_of_range"
                    )
        
        # RATING validation
        elif question_type == QuestionType.RATING:
            rating = answer_value.get('rating')
            if rating is not None:
                max_rating = settings.get('max_value', 5)
                if rating < 1 or rating > max_rating:
                    return FieldValidationError(
                        question_id=question.id,
                        field="rating",
                        message=f"Rating must be between 1 and {max_rating}",
                        error_type="out_of_range"
                    )
        
        return None
    
    def _has_value(self, answer_value: Optional[Dict[str, Any]]) -> bool:
        """Check if answer has a meaningful value"""
        if not answer_value:
            return False
        
        # Check all possible value fields
        text = answer_value.get('text', '').strip()
        number = answer_value.get('number')
        date = answer_value.get('date')
        choices = answer_value.get('choices', [])
        rating = answer_value.get('rating')
        files = answer_value.get('files', [])
        file_url = answer_value.get('file_url')
        
        return bool(text or number is not None or date or choices or rating is not None or files or file_url)
    
    def generate_validation_token(
        self, 
        form_id: int, 
        session_id: str
    ) -> str:
        """
        Generate HMAC token to prevent form tampering.
        
        Args:
            form_id: ID of the form
            session_id: Session ID
        
        Returns:
            HMAC token string
        """
        message = f"{form_id}:{session_id}:{datetime.utcnow().isoformat()}"
        return hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def verify_validation_token(
        self,
        token: str,
        form_id: int,
        session_id: str,
        max_age_seconds: int = 3600
    ) -> bool:
        """
        Verify validation token.
        
        Args:
            token: Token to verify
            form_id: Form ID
            session_id: Session ID
            max_age_seconds: Maximum age of token in seconds
        
        Returns:
            True if token is valid, False otherwise
        """
        # For now, just check if token is not empty
        # In production, implement proper HMAC verification with timestamp checking
        return bool(token)


# Singleton instance
validation_service = ValidationService()
