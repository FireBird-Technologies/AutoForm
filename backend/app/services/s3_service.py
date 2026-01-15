import os
import re
from typing import Optional
import boto3


class S3Service:
    """S3 utility for presigned uploads/downloads and key generation."""

    def __init__(self):
        self.bucket = os.getenv("S3_BUCKET_NAME")

        region = os.getenv("AWS_REGION")
        access_key = os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        self.client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )

        app_env = os.getenv("APP_ENV", "dev")
        self.prefix = os.getenv("S3_PREFIX", f"autoform/{app_env}").strip("/")

    def build_key(self, form_id: int, form_title: str, upload_id: int, filename: str) -> str:
        form_slug = self._slugify(form_title)
        filename_safe = self._sanitize_filename(filename)

        folder = f"f{form_id}"
        if form_slug:
            folder = f"{folder}-{form_slug}"

        return f"{self.prefix}/{folder}/{upload_id}__{filename_safe}"

    def generate_presigned_upload_url(
        self,
        key: str,
        content_type: Optional[str],
        expires_in: int = 900
    ) -> str:
        if not self.bucket:
            raise ValueError("S3_BUCKET_NAME is not set")
        params = {
            "Bucket": self.bucket,
            "Key": key
        }

        if content_type:
            params["ContentType"] = content_type

        return self.client.generate_presigned_url(
            "put_object",
            Params=params,
            ExpiresIn=expires_in
        )

    def generate_presigned_download_url(
        self,
        key: str,
        filename: Optional[str],
        expires_in: int = 900
    ) -> str:
        if not self.bucket:
            raise ValueError("S3_BUCKET_NAME is not set")
        params = {
            "Bucket": self.bucket,
            "Key": key
        }

        if filename:
            safe_name = self._sanitize_filename(filename)
            params["ResponseContentDisposition"] = f'attachment; filename="{safe_name}"'

        return self.client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=expires_in
        )

    def _slugify(self, value: str) -> str:
        if not value:
            return ""

        value = value.lower()
        value = re.sub(r"[^a-z0-9]+", "-", value)
        value = value.strip("-")
        return value[:60]

    def _sanitize_filename(self, filename: str) -> str:
        base = os.path.basename(filename or "")
        base = base.replace(" ", "_")
        base = re.sub(r"[^A-Za-z0-9._-]", "", base)
        return base[:120] or "file"


s3_service = S3Service()
