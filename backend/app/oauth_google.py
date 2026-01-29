import os
import logging
from urllib.parse import urlencode
from fastapi import APIRouter, Request, Depends
from authlib.integrations.starlette_client import OAuth
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from .db import get_db
from .models import User
from .security import create_access_token
from .services.subscription_service import subscription_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth/google", tags=["auth"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/login")
async def login(request: Request):
    redirect_uri = GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    try:
        # Let authlib handle the OAuth state validation
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo") or await oauth.google.parse_id_token(request, token)
        
        email = userinfo.get("email")
        if not email:
            logger.error("No email in Google OAuth response")
            return RedirectResponse(url=f"{FRONTEND_URL}/?error=missing_email", status_code=302)
        
        user = db.query(User).filter(User.email == email).first()
        is_new_user = not user
        
        if is_new_user:
            user = User(
                email=email,
                name=userinfo.get("name"),
                picture=userinfo.get("picture"),
                provider="google",
                provider_id=userinfo.get("sub")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Assign free tier (non-blocking)
            try:
                subscription_service.assign_free_tier(db, user)
            except Exception as e:
                logger.error(f"Failed to assign free tier to user {user.id}: {e}")
        
        jwt_token = create_access_token(str(user.id), {"email": user.email})
        return RedirectResponse(url=f"{FRONTEND_URL}/?{urlencode({'token': jwt_token})}", status_code=302)
    
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"OAuth callback error: {e}", exc_info=True)
        
        # Provide more specific error messages
        if "state" in error_msg or "mismatch" in error_msg or "missingstateerror" in error_msg:
            return RedirectResponse(url=f"{FRONTEND_URL}/?error=session_expired&message=Please try logging in again", status_code=302)
        elif "token" in error_msg:
            return RedirectResponse(url=f"{FRONTEND_URL}/?error=token_error&message=Authentication failed, please retry", status_code=302)
        else:
            return RedirectResponse(url=f"{FRONTEND_URL}/?error=login_failed&message=Login failed, please try again", status_code=302)


