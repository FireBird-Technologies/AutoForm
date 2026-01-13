# Use Python 3.11 (Hugging Face supports 3.9+)
FROM python:3.11

# Create a non-root user (Hugging Face recommendation)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Install system dependencies as root, then switch back
USER root
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Switch back to user
USER user

# Copy requirements first for better caching
COPY --chown=user:user requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# Copy application code
COPY --chown=user:user app/ ./app/
COPY --chown=user:user images/ ./images/

# Create necessary directories
RUN mkdir -p /app/data

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Expose port (Hugging Face Spaces uses port 7860)
EXPOSE 7860

# Run the application on port 7860 (Hugging Face requirement)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
