"""
Webhook service for form submission notifications
"""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import hmac
import hashlib
import logging
import asyncio

try:
    import httpx
except ImportError:
    httpx = None

from ..models import WebhookConfig, Form

logger = logging.getLogger(__name__)


class WebhookService:
    """Service for sending webhooks"""
    
    def __init__(self):
        self.max_retries = 3
        self.retry_delays = [1, 5, 30]  # seconds
        self.timeout = 30  # seconds
    
    async def send_webhook(
        self,
        db: Session,
        form_id: int,
        event_type: str,
        payload: Dict[str, Any]
    ):
        """
        Send webhook to configured URL.
        
        Args:
            db: Database session
            form_id: ID of the form
            event_type: Type of event (e.g., 'form_submitted_complete')
            payload: Data to send
        """
        if not httpx:
            logger.error("httpx not installed, cannot send webhooks")
            return
        
        try:
            # Get webhook configuration
            webhook_config = db.query(WebhookConfig).filter(
                WebhookConfig.form_id == form_id,
                WebhookConfig.is_active == True
            ).first()
            
            if not webhook_config:
                logger.debug(f"No webhook configured for form {form_id}")
                return
            
            # Check if this event type is configured
            if event_type not in webhook_config.events:
                logger.debug(f"Event {event_type} not configured for form {form_id}")
                return
            
            # Sign payload
            signature = self._sign_payload(payload, webhook_config.secret)
            
            # Prepare headers
            headers = {
                "Content-Type": "application/json",
                "X-AutoForm-Signature": signature,
                "X-AutoForm-Event": event_type,
                "User-Agent": "AutoForm-Webhook/1.0"
            }
            
            # Send with retries
            await self._send_with_retries(
                webhook_config.webhook_url,
                payload,
                headers
            )
            
            logger.info(f"Webhook sent successfully for form {form_id}, event {event_type}")
            
        except Exception as e:
            logger.error(f"Failed to send webhook for form {form_id}: {e}")
    
    async def _send_with_retries(
        self,
        url: str,
        payload: Dict[str, Any],
        headers: Dict[str, str]
    ):
        """
        Send webhook with retry logic.
        
        Args:
            url: Webhook URL
            payload: Data to send
            headers: HTTP headers
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        url,
                        json=payload,
                        headers=headers
                    )
                    
                    # Check if successful
                    if 200 <= response.status_code < 300:
                        logger.info(f"Webhook delivered successfully to {url}")
                        return
                    else:
                        logger.warning(
                            f"Webhook attempt {attempt + 1} failed with status {response.status_code}: {response.text}"
                        )
                        
                except Exception as e:
                    logger.warning(f"Webhook attempt {attempt + 1} failed: {e}")
                
                # Wait before retry (except on last attempt)
                if attempt < self.max_retries - 1:
                    delay = self.retry_delays[attempt]
                    logger.info(f"Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
            
            # All retries failed
            logger.error(f"Webhook delivery failed after {self.max_retries} attempts to {url}")
    
    def _sign_payload(self, payload: Dict[str, Any], secret: str) -> str:
        """
        Sign payload with HMAC-SHA256.
        
        Args:
            payload: Data to sign
            secret: Secret key
        
        Returns:
            Hexadecimal signature string
        """
        import json
        
        # Serialize payload
        payload_str = json.dumps(payload, sort_keys=True)
        
        # Generate HMAC
        signature = hmac.new(
            secret.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def verify_signature(
        self,
        payload: Dict[str, Any],
        signature: str,
        secret: str
    ) -> bool:
        """
        Verify webhook signature.
        
        Args:
            payload: Payload that was signed
            signature: Signature to verify
            secret: Secret key
        
        Returns:
            True if signature is valid
        """
        expected_signature = self._sign_payload(payload, secret)
        return hmac.compare_digest(signature, expected_signature)


# Singleton instance
webhook_service = WebhookService()
