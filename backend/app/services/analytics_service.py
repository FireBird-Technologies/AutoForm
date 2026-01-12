"""
Analytics service for form tracking and insights
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import Request
import hashlib
import uuid
import logging

from ..models import FormAnalyticsEvent, Form, FormQuestion, FormResponse, AnalyticsEventType

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for tracking and analyzing form usage"""
    
    def __init__(self):
        self.ip_salt = "autoform_salt_2026"  # Use environment variable in production
    
    async def track_event(
        self,
        db: Session,
        event_type: str,
        form_id: int,
        session_id: str,
        request: Request,
        submission_id: Optional[int] = None,
        question_id: Optional[int] = None,
        time_spent_seconds: Optional[int] = None,
        metadata: Optional[Dict] = None
    ):
        """
        Track analytics event with automatic enrichment.
        
        Args:
            db: Database session
            event_type: Type of event (form_viewed, question_answered, etc.)
            form_id: ID of the form
            session_id: Session ID
            request: FastAPI Request object
            submission_id: Optional submission ID
            question_id: Optional question ID
            time_spent_seconds: Optional time spent
            metadata: Optional additional metadata
        """
        try:
            # Extract IP address
            client_ip = None
            if request.client:
                client_ip = request.client.host
            
            # Hash IP for privacy
            ip_hash = self._hash_ip(client_ip) if client_ip else "unknown"
            
            # Extract user agent
            user_agent = request.headers.get("user-agent")
            
            # Extract referrer
            referrer = request.headers.get("referer") or request.headers.get("referrer")
            
            # Extract UTM parameters from query params or referrer
            utm_source = None
            utm_medium = None
            utm_campaign = None
            
            if hasattr(request, 'query_params'):
                utm_source = request.query_params.get('utm_source')
                utm_medium = request.query_params.get('utm_medium')
                utm_campaign = request.query_params.get('utm_campaign')
            
            # Perform IP geolocation (basic - can be enhanced with MaxMind)
            country, city = await self._get_geo_location(client_ip)
            
            # Create event
            event = FormAnalyticsEvent(
                event_id=str(uuid.uuid4()),
                form_id=form_id,
                submission_id=submission_id,
                question_id=question_id,
                event_type=event_type,
                session_id=session_id,
                ip_address_hash=ip_hash,
                ip_address_raw=None,  # Only store if user opts in
                country=country,
                city=city,
                user_agent=user_agent,
                referrer=referrer,
                utm_source=utm_source,
                utm_medium=utm_medium,
                utm_campaign=utm_campaign,
                time_spent_seconds=time_spent_seconds,
                event_metadata=metadata or {}
            )
            
            db.add(event)
            db.commit()
            
            logger.info(f"Tracked event: {event_type} for form {form_id}, session {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to track analytics event: {e}")
            # Don't raise - analytics failures shouldn't break form submission
            db.rollback()
    
    async def get_funnel_analytics(
        self,
        db: Session,
        form_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate funnel analytics for a form.
        
        Args:
            db: Database session
            form_id: ID of the form
            start_date: Optional start date for filtering
            end_date: Optional end date for filtering
        
        Returns:
            Dictionary with funnel analytics data
        """
        # Default date range: last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Base query filter
        base_filter = and_(
            FormAnalyticsEvent.form_id == form_id,
            FormAnalyticsEvent.created_at >= start_date,
            FormAnalyticsEvent.created_at <= end_date
        )
        
        # Count events by type
        total_views = db.query(func.count(FormAnalyticsEvent.id)).filter(
            base_filter,
            FormAnalyticsEvent.event_type == AnalyticsEventType.FORM_VIEWED.value
        ).scalar() or 0
        
        total_starts = db.query(func.count(FormAnalyticsEvent.id)).filter(
            base_filter,
            FormAnalyticsEvent.event_type == AnalyticsEventType.FORM_STARTED.value
        ).scalar() or 0
        
        total_completes = db.query(func.count(FormAnalyticsEvent.id)).filter(
            base_filter,
            FormAnalyticsEvent.event_type == AnalyticsEventType.FORM_SUBMITTED_COMPLETE.value
        ).scalar() or 0
        
        # Calculate completion rate
        completion_rate = (total_completes / total_views * 100) if total_views > 0 else 0
        
        # Get form questions
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            return {}
        
        # Build question funnel
        question_funnel = []
        for question in sorted(form.questions, key=lambda q: q.question_order):
            viewed = db.query(func.count(FormAnalyticsEvent.id)).filter(
                base_filter,
                FormAnalyticsEvent.question_id == question.id,
                FormAnalyticsEvent.event_type == AnalyticsEventType.QUESTION_VIEWED.value
            ).scalar() or 0
            
            answered = db.query(func.count(FormAnalyticsEvent.id)).filter(
                base_filter,
                FormAnalyticsEvent.question_id == question.id,
                FormAnalyticsEvent.event_type == AnalyticsEventType.QUESTION_ANSWERED.value
            ).scalar() or 0
            
            skipped = db.query(func.count(FormAnalyticsEvent.id)).filter(
                base_filter,
                FormAnalyticsEvent.question_id == question.id,
                FormAnalyticsEvent.event_type == AnalyticsEventType.QUESTION_SKIPPED.value
            ).scalar() or 0
            
            # Calculate average time spent
            avg_time_result = db.query(
                func.avg(FormAnalyticsEvent.time_spent_seconds)
            ).filter(
                base_filter,
                FormAnalyticsEvent.question_id == question.id,
                FormAnalyticsEvent.time_spent_seconds.isnot(None)
            ).scalar()
            
            avg_time_spent = float(avg_time_result) if avg_time_result else 0.0
            
            # Calculate drop-off rate
            drop_off_rate = (skipped / viewed * 100) if viewed > 0 else 0
            
            question_funnel.append({
                "question_id": question.id,
                "question_text": question.question_text,
                "question_order": question.question_order,
                "viewed": viewed,
                "answered": answered,
                "skipped": skipped,
                "drop_off_rate": round(drop_off_rate, 2),
                "avg_time_spent": round(avg_time_spent, 2)
            })
        
        # Traffic sources analysis
        traffic_sources = {}
        utm_source_data = db.query(
            FormAnalyticsEvent.utm_source,
            func.count(FormAnalyticsEvent.id).label('count')
        ).filter(
            base_filter,
            FormAnalyticsEvent.utm_source.isnot(None)
        ).group_by(FormAnalyticsEvent.utm_source).all()
        
        for source, count in utm_source_data:
            # Calculate completion rate for this source
            source_completes = db.query(func.count(FormAnalyticsEvent.id)).filter(
                base_filter,
                FormAnalyticsEvent.utm_source == source,
                FormAnalyticsEvent.event_type == AnalyticsEventType.FORM_SUBMITTED_COMPLETE.value
            ).scalar() or 0
            
            completion_rate_source = (source_completes / count * 100) if count > 0 else 0
            
            traffic_sources[source] = {
                "count": count,
                "completion_rate": round(completion_rate_source, 2)
            }
        
        # Geographic distribution
        geographic_distribution = {}
        country_data = db.query(
            FormAnalyticsEvent.country,
            func.count(FormAnalyticsEvent.id).label('views')
        ).filter(
            base_filter,
            FormAnalyticsEvent.country.isnot(None)
        ).group_by(FormAnalyticsEvent.country).all()
        
        for country, views in country_data:
            country_completes = db.query(func.count(FormAnalyticsEvent.id)).filter(
                base_filter,
                FormAnalyticsEvent.country == country,
                FormAnalyticsEvent.event_type == AnalyticsEventType.FORM_SUBMITTED_COMPLETE.value
            ).scalar() or 0
            
            geographic_distribution[country] = {
                "views": views,
                "completes": country_completes
            }
        
        return {
            "total_views": total_views,
            "total_starts": total_starts,
            "total_completes": total_completes,
            "completion_rate": round(completion_rate, 2),
            "question_funnel": question_funnel,
            "traffic_sources": traffic_sources,
            "geographic_distribution": geographic_distribution,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }
    
    async def get_summary_analytics(
        self,
        db: Session,
        form_id: int
    ) -> Dict[str, Any]:
        """
        Get high-level analytics summary for a form.
        
        Args:
            db: Database session
            form_id: ID of the form
        
        Returns:
            Dictionary with summary analytics
        """
        # Total responses
        total_responses = db.query(func.count(FormResponse.id)).filter(
            FormResponse.form_id == form_id
        ).scalar() or 0
        
        # Complete vs partial
        complete_responses = db.query(func.count(FormResponse.id)).filter(
            FormResponse.form_id == form_id,
            FormResponse.status == "complete"
        ).scalar() or 0
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_responses = db.query(func.count(FormResponse.id)).filter(
            FormResponse.form_id == form_id,
            FormResponse.submitted_at >= seven_days_ago
        ).scalar() or 0
        
        # Average completion time (if tracked)
        avg_completion_seconds = db.query(
            func.avg(
                func.extract('epoch', FormResponse.submitted_at - FormResponse.started_at)
            )
        ).filter(
            FormResponse.form_id == form_id,
            FormResponse.started_at.isnot(None),
            FormResponse.status == "complete"
        ).scalar()
        
        avg_completion_minutes = (avg_completion_seconds / 60) if avg_completion_seconds else None
        
        return {
            "total_responses": total_responses,
            "complete_responses": complete_responses,
            "partial_responses": total_responses - complete_responses,
            "recent_responses_7d": recent_responses,
            "avg_completion_minutes": round(avg_completion_minutes, 2) if avg_completion_minutes else None
        }
    
    def _hash_ip(self, ip_address: str) -> str:
        """Hash IP address for privacy"""
        if not ip_address:
            return "unknown"
        
        # SHA256 hash with salt
        salted = f"{ip_address}{self.ip_salt}"
        return hashlib.sha256(salted.encode()).hexdigest()
    
    async def _get_geo_location(self, ip_address: Optional[str]) -> tuple:
        """
        Get geographic location from IP address.
        
        For now, returns None. In production:
        - Use MaxMind GeoLite2 database (free, local lookup)
        - Or use ipapi.co API (rate-limited)
        
        Args:
            ip_address: IP address to lookup
        
        Returns:
            Tuple of (country, city)
        """
        if not ip_address:
            return (None, None)
        
        # TODO: Implement with MaxMind GeoLite2 or ipapi.co
        # For localhost/development, return None
        if ip_address in ['127.0.0.1', 'localhost', '::1']:
            return ('Local', 'Development')
        
        # Placeholder - implement actual geolocation
        return (None, None)


# Singleton instance
analytics_service = AnalyticsService()
