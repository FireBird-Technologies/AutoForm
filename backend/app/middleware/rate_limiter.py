"""
Rate limiting and spam protection middleware
"""
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import json
import logging

from ..models import SubmissionRateLimit, Form

logger = logging.getLogger(__name__)


class SubmissionRateLimiter:
    """Rate limiting for form submissions"""
    
    def __init__(self):
        self.salt = "autoform_rate_limit_salt"
    
    def check_rate_limit(
        self,
        db: Session,
        form_id: int,
        identifier: str,
        window_minutes: int = 60,
        max_submissions: int = 5
    ) -> bool:
        """
        Check if submission rate limit exceeded.
        
        Rules:
        - Max 5 submissions per hour per IP for same form (configurable)
        - Sliding window implementation
        
        Args:
            db: Database session
            form_id: ID of the form
            identifier: IP hash or device fingerprint
            window_minutes: Time window in minutes
            max_submissions: Maximum submissions allowed in window
        
        Returns:
            True if rate limit is OK (allowed), False if exceeded
        """
        try:
            # Calculate window start time
            window_start = datetime.utcnow() - timedelta(minutes=window_minutes)
            
            # Check if there's an existing rate limit record
            rate_limit = db.query(SubmissionRateLimit).filter(
                SubmissionRateLimit.identifier == identifier,
                SubmissionRateLimit.form_id == form_id,
                SubmissionRateLimit.window_start >= window_start
            ).first()
            
            if rate_limit:
                # Check if blocked
                if rate_limit.is_blocked:
                    logger.warning(f"Rate limit blocked: {identifier} for form {form_id}")
                    return False
                
                # Check submission count
                if rate_limit.submission_count >= max_submissions:
                    # Block this identifier
                    rate_limit.is_blocked = True
                    db.commit()
                    logger.warning(f"Rate limit exceeded: {identifier} for form {form_id}")
                    return False
                
                # Increment count
                rate_limit.submission_count += 1
                db.commit()
                return True
            else:
                # Create new rate limit record
                new_rate_limit = SubmissionRateLimit(
                    identifier=identifier,
                    form_id=form_id,
                    submission_count=1,
                    window_start=datetime.utcnow(),
                    is_blocked=False
                )
                db.add(new_rate_limit)
                db.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            # On error, allow submission (fail open)
            return True
    
    def check_duplicate(
        self,
        db: Session,
        form_id: int,
        answers_hash: str,
        window_minutes: int = 5
    ) -> bool:
        """
        Check for duplicate submissions (same answers within time window).
        
        Args:
            db: Database session
            form_id: ID of the form
            answers_hash: SHA256 hash of sorted answers
            window_minutes: Time window to check for duplicates
        
        Returns:
            True if duplicate found, False otherwise
        """
        # TODO: Implement duplicate detection
        # Store hashes in rate_limits table or separate duplicate_submissions table
        # For now, return False (no duplicate)
        return False
    
    def hash_identifier(self, identifier: str) -> str:
        """Hash identifier (IP address) for storage"""
        if not identifier:
            return "unknown"
        
        salted = f"{identifier}{self.salt}"
        return hashlib.sha256(salted.encode()).hexdigest()
    
    def hash_answers(self, answers: list) -> str:
        """Hash answers for duplicate detection"""
        # Sort and serialize answers for consistent hashing
        sorted_answers = sorted(
            answers,
            key=lambda x: x.get('question_id', 0)
        )
        
        # Create string representation
        answer_str = json.dumps(sorted_answers, sort_keys=True)
        
        return hashlib.sha256(answer_str.encode()).hexdigest()
    
    def cleanup_old_records(
        self,
        db: Session,
        days_old: int = 7
    ):
        """
        Clean up old rate limit records.
        
        Args:
            db: Database session
            days_old: Delete records older than this many days
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            deleted_count = db.query(SubmissionRateLimit).filter(
                SubmissionRateLimit.window_start < cutoff_date
            ).delete()
            
            db.commit()
            
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old rate limit records")
                
        except Exception as e:
            logger.error(f"Error cleaning up rate limit records: {e}")
            db.rollback()


# Singleton instance
rate_limiter = SubmissionRateLimiter()
