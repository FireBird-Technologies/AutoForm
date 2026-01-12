"""
User Context API Routes
========================

Routes for user context and onboarding.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..core.db import get_db
from ..core.security import get_current_user
from ..models import User, Form, Subscription

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/me", tags=["users"])


@router.get("/context")
async def get_user_context(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user context for UI decisions.
    
    Returns information about user state, forms, and subscription.
    """
    # Count user's forms
    form_count = db.query(func.count(Form.id)).filter(
        Form.user_id == current_user.id
    ).scalar() or 0
    
    # Get last form
    last_form = db.query(Form).filter(
        Form.user_id == current_user.id
    ).order_by(desc(Form.created_at)).first()
    
    # Get subscription info
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).order_by(desc(Subscription.created_at)).first()
    
    has_active_subscription = False
    plan_name = "Free"
    
    if subscription and subscription.status == "active":
        has_active_subscription = True
        if subscription.plan:
            plan_name = subscription.plan.name
    
    return {
        "is_new_user": form_count == 0,
        "form_count": form_count,
        "last_form_id": last_form.id if last_form else None,
        "has_active_subscription": has_active_subscription,
        "plan_name": plan_name,
        "onboarding_completed": form_count > 0,  # User has created at least one form
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "picture": current_user.picture
        }
    }
