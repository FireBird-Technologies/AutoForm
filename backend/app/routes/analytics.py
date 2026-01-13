"""
Analytics API Routes
====================

Routes for form analytics and tracking.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from ..core.db import get_db
from ..core.security import get_current_user
from ..models import User, Form, PublicForm
from ..services.analytics_service import analytics_service

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analytics"])


class TrackEventRequest(BaseModel):
    """Request model for tracking analytics events"""
    event_type: str
    session_id: str
    question_id: Optional[int] = None
    time_spent: Optional[int] = None


@router.post("/public/forms/{token}/track")
async def track_public_event(
    token: str,
    payload: TrackEventRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for client-side analytics tracking.
    No authentication required.
    """
    # Find public form by token
    public_form = db.query(PublicForm).filter(
        PublicForm.share_token == token,
        PublicForm.is_public == True
    ).first()
    
    if not public_form:
        # Silently fail for analytics - don't break form
        logger.warning(f"Analytics tracking: form not found for token {token}")
        return {"success": False, "message": "Form not found"}
    
    try:
        # Track event
        await analytics_service.track_event(
            db=db,
            event_type=payload.event_type,
            form_id=public_form.form_id,
            session_id=payload.session_id,
            request=request,
            question_id=payload.question_id,
            time_spent_seconds=payload.time_spent
        )
        
        return {"success": True, "message": "Event tracked"}
        
    except Exception as e:
        logger.error(f"Analytics tracking failed: {e}", exc_info=True)
        # Silently fail - analytics shouldn't break form
        return {"success": False, "message": "Tracking failed"}


@router.get("/forms/{form_id}/analytics/funnel")
async def get_form_funnel(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    question_ids: Optional[str] = None,
    countries: Optional[str] = None,
    utm_source: Optional[str] = None
):
    """
    Get funnel analytics for form owner with advanced filtering.
    Requires authentication.
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
    
    # Parse dates
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    # Parse question IDs
    question_id_list = [int(x) for x in question_ids.split(',')] if question_ids else None
    
    # Parse countries
    country_list = [x.strip() for x in countries.split(',')] if countries else None
    
    # Get funnel analytics
    funnel_data = await analytics_service.get_funnel_analytics(
        db=db,
        form_id=form_id,
        start_date=start_dt,
        end_date=end_dt,
        question_ids=question_id_list,
        countries=country_list,
        utm_source=utm_source
    )
    
    return funnel_data


@router.get("/forms/{form_id}/analytics/timeseries")
async def get_time_series(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    question_ids: Optional[str] = None,
    countries: Optional[str] = None,
    utm_source: Optional[str] = None
):
    """
    Get time-series data for views and submissions with filtering.
    Requires authentication.
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
    
    # Parse dates
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    # Parse question IDs
    question_id_list = [int(x) for x in question_ids.split(',')] if question_ids else None
    
    # Parse countries
    country_list = [x.strip() for x in countries.split(',')] if countries else None
    
    # Get time-series data
    time_series_data = await analytics_service.get_time_series_data(
        db=db,
        form_id=form_id,
        start_date=start_dt,
        end_date=end_dt,
        question_ids=question_id_list,
        countries=country_list,
        utm_source=utm_source
    )
    
    return time_series_data


@router.get("/forms/{form_id}/analytics/summary")
async def get_analytics_summary(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get high-level analytics summary.
    Requires authentication.
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
    
    # Get summary analytics
    summary_data = await analytics_service.get_summary_analytics(
        db=db,
        form_id=form_id
    )
    
    return summary_data
