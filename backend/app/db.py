import os
import time
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")


class Base(DeclarativeBase):
    pass


if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,   # validate connections before use to avoid stale sockets
        pool_recycle=280,     # recycle before Neon's ~5 min idle timeout
        pool_size=5,
        max_overflow=10,
        connect_args={
            "connect_timeout": 10,  # Connection timeout in seconds
        }
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Database session dependency with retry logic for transient connection errors.
    Retries on DNS resolution failures and temporary network issues.
    """
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            yield db
            return
        except OperationalError as e:
            last_error = e
            error_msg = str(e).lower()
            
            # Only retry on transient network errors
            if any(x in error_msg for x in ['name resolution', 'connection refused', 'timeout', 'temporarily unavailable']):
                logger.warning(f"Database connection failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(1.0 * (attempt + 1))  # Exponential backoff
                    continue
            
            # Non-transient error, don't retry
            raise
        finally:
            if 'db' in locals():
                db.close()
    
    # All retries exhausted
    logger.error(f"Database connection failed after {max_retries} attempts")
    raise last_error


