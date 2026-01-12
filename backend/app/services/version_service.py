"""
Form versioning service for schema snapshots and validation
"""
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
import json

from ..models import Form, FormQuestion, FormVersion, ConditionalRule


class FormVersionService:
    """Service for managing form versions"""
    
    def create_version(
        self,
        db: Session,
        form_id: int
    ) -> FormVersion:
        """
        Create a snapshot of current form structure.
        
        Args:
            db: Database session
            form_id: ID of the form to snapshot
        
        Returns:
            FormVersion object
        """
        # Fetch form with all related data
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        # Get the next version number
        latest_version = db.query(FormVersion).filter(
            FormVersion.form_id == form_id
        ).order_by(FormVersion.version.desc()).first()
        
        next_version = (latest_version.version + 1) if latest_version else 1
        
        # Build schema snapshot
        schema_snapshot = {
            "form_id": form.id,
            "title": form.title,
            "description": form.description,
            "settings": form.settings,
            "questions": [],
            "conditional_rules": [],
            "snapshot_timestamp": datetime.utcnow().isoformat()
        }
        
        # Add questions
        for question in sorted(form.questions, key=lambda q: q.question_order):
            schema_snapshot["questions"].append({
                "id": question.id,
                "question_order": question.question_order,
                "question_type": question.question_type.value,
                "question_text": question.question_text,
                "description": question.description,
                "required": question.required,
                "settings": question.settings
            })
        
        # Add conditional rules
        for rule in form.conditional_rules:
            schema_snapshot["conditional_rules"].append({
                "id": rule.id,
                "trigger_question_id": rule.trigger_question_id,
                "target_question_id": rule.target_question_id,
                "condition_type": rule.condition_type.value,
                "condition_value": rule.condition_value,
                "action": rule.action
            })
        
        # Deactivate previous active versions
        db.query(FormVersion).filter(
            FormVersion.form_id == form_id,
            FormVersion.is_active == True
        ).update({"is_active": False})
        
        # Create new version
        new_version = FormVersion(
            form_id=form_id,
            version=next_version,
            schema_snapshot=schema_snapshot,
            is_active=True
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        
        return new_version
    
    def get_active_version(
        self,
        db: Session,
        form_id: int
    ) -> Optional[FormVersion]:
        """
        Get the current active version for validation.
        
        Args:
            db: Database session
            form_id: ID of the form
        
        Returns:
            FormVersion object or None
        """
        return db.query(FormVersion).filter(
            FormVersion.form_id == form_id,
            FormVersion.is_active == True
        ).first()
    
    def get_version_by_number(
        self,
        db: Session,
        form_id: int,
        version: int
    ) -> Optional[FormVersion]:
        """
        Get a specific version by number.
        
        Args:
            db: Database session
            form_id: ID of the form
            version: Version number
        
        Returns:
            FormVersion object or None
        """
        return db.query(FormVersion).filter(
            FormVersion.form_id == form_id,
            FormVersion.version == version
        ).first()
    
    def should_create_version(
        self,
        db: Session,
        form_id: int
    ) -> bool:
        """
        Check if a new version should be created.
        
        Creates version on:
        - Form first published (no versions exist)
        - Any question added/removed/reordered
        - Any question type or settings changed
        
        Args:
            db: Database session
            form_id: ID of the form
        
        Returns:
            True if new version should be created
        """
        # If no versions exist, should create
        version_count = db.query(FormVersion).filter(
            FormVersion.form_id == form_id
        ).count()
        
        if version_count == 0:
            return True
        
        # Get latest version and compare with current form
        latest_version = db.query(FormVersion).filter(
            FormVersion.form_id == form_id
        ).order_by(FormVersion.version.desc()).first()
        
        if not latest_version:
            return True
        
        # Get current form state
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            return False
        
        # Compare question counts
        current_question_count = len(form.questions)
        snapshot_question_count = len(latest_version.schema_snapshot.get("questions", []))
        
        if current_question_count != snapshot_question_count:
            return True
        
        # Compare question IDs and order (shallow check)
        snapshot_question_ids = [
            q["id"] for q in latest_version.schema_snapshot.get("questions", [])
        ]
        current_question_ids = [
            q.id for q in sorted(form.questions, key=lambda x: x.question_order)
        ]
        
        if snapshot_question_ids != current_question_ids:
            return True
        
        # If we get here, no significant changes detected
        return False


# Singleton instance
version_service = FormVersionService()
