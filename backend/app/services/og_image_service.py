"""
OG Image Generation Service
============================

Generates custom Open Graph preview images for forms using their actual styling.
Images are saved to S3 for fast CDN delivery.
"""

import io
import os
import logging
import hashlib
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# Standard OG image dimensions (LinkedIn/Facebook recommended)
OG_WIDTH = 1200
OG_HEIGHT = 630


class OGImageService:
    """Service to generate and cache Open Graph images for forms."""
    
    def __init__(self):
        self.s3_service = None
        self._font_cache = {}
    
    def _get_s3_service(self):
        """Lazy load S3 service."""
        if self.s3_service is None:
            from .s3_service import s3_service
            self.s3_service = s3_service
        return self.s3_service
    
    def _get_font(self, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
        """Get a font, with caching. Falls back to default if custom fonts unavailable."""
        cache_key = f"{size}_{bold}"
        if cache_key in self._font_cache:
            return self._font_cache[cache_key]
        
        # Try common system fonts
        font_candidates = [
            # Windows
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
            # Linux
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            # macOS
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
        ]
        
        font = None
        for font_path in font_candidates:
            try:
                if os.path.exists(font_path):
                    font = ImageFont.truetype(font_path, size)
                    break
            except Exception:
                continue
        
        if font is None:
            # Fallback to default
            try:
                font = ImageFont.truetype("arial.ttf", size)
            except:
                font = ImageFont.load_default()
        
        self._font_cache[cache_key] = font
        return font
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        try:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except:
            return (255, 255, 255)  # Default white
    
    def _get_contrast_color(self, bg_color: Tuple[int, int, int]) -> Tuple[int, int, int]:
        """Get a contrasting text color (black or white) based on background luminance."""
        # Calculate relative luminance
        r, g, b = bg_color
        luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return (0, 0, 0) if luminance > 0.5 else (255, 255, 255)
    
    def _wrap_text(self, text: str, font: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.Draw) -> list:
        """Wrap text to fit within max_width."""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            width = bbox[2] - bbox[0]
            
            if width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def generate_og_image(
        self,
        title: str,
        description: Optional[str] = None,
        background_color: str = "#ffffff",
        accent_color: str = "#9333ea",
        text_color: Optional[str] = None,
        question_count: int = 0
    ) -> bytes:
        """
        Generate an OG image with the form's styling.
        
        Returns PNG image as bytes.
        """
        # Parse colors
        bg_rgb = self._hex_to_rgb(background_color)
        accent_rgb = self._hex_to_rgb(accent_color)
        
        # Auto-detect text color if not provided
        if text_color:
            text_rgb = self._hex_to_rgb(text_color)
        else:
            text_rgb = self._get_contrast_color(bg_rgb)
        
        # Create image
        img = Image.new('RGB', (OG_WIDTH, OG_HEIGHT), bg_rgb)
        draw = ImageDraw.Draw(img)
        
        # Draw accent bar at top
        draw.rectangle([(0, 0), (OG_WIDTH, 8)], fill=accent_rgb)
        
        # Draw accent circle/logo area
        circle_x, circle_y = 100, OG_HEIGHT // 2
        circle_radius = 40
        draw.ellipse(
            [(circle_x - circle_radius, circle_y - circle_radius),
             (circle_x + circle_radius, circle_y + circle_radius)],
            fill=accent_rgb
        )
        # Draw "AF" text in circle
        try:
            logo_font = self._get_font(28, bold=True)
            logo_color = self._get_contrast_color(accent_rgb)
            bbox = draw.textbbox((0, 0), "AF", font=logo_font)
            logo_w = bbox[2] - bbox[0]
            logo_h = bbox[3] - bbox[1]
            draw.text(
                (circle_x - logo_w // 2, circle_y - logo_h // 2 - 5),
                "AF",
                font=logo_font,
                fill=logo_color
            )
        except:
            pass
        
        # Content area starts after logo
        content_x = 180
        content_width = OG_WIDTH - content_x - 80
        
        # Draw title
        title_font = self._get_font(56, bold=True)
        title = title or "Untitled Form"
        title_lines = self._wrap_text(title, title_font, content_width, draw)[:2]  # Max 2 lines
        
        title_y = 180
        for line in title_lines:
            draw.text((content_x, title_y), line, font=title_font, fill=text_rgb)
            bbox = draw.textbbox((0, 0), line, font=title_font)
            title_y += bbox[3] - bbox[1] + 10
        
        # Draw description
        if description:
            desc_font = self._get_font(28)
            # Slightly muted description color
            desc_rgb = tuple(int(c * 0.7 + bg_rgb[i] * 0.3) for i, c in enumerate(text_rgb))
            desc_lines = self._wrap_text(description, desc_font, content_width, draw)[:3]  # Max 3 lines
            
            desc_y = title_y + 30
            for line in desc_lines:
                draw.text((content_x, desc_y), line, font=desc_font, fill=desc_rgb)
                bbox = draw.textbbox((0, 0), line, font=desc_font)
                desc_y += bbox[3] - bbox[1] + 8
        
        # Draw question count badge
        if question_count > 0:
            badge_text = f"{question_count} question{'s' if question_count != 1 else ''}"
            badge_font = self._get_font(20)
            bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
            badge_w = bbox[2] - bbox[0] + 24
            badge_h = bbox[3] - bbox[1] + 12
            badge_x = content_x
            badge_y = OG_HEIGHT - 100
            
            # Draw badge background
            draw.rounded_rectangle(
                [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
                radius=6,
                fill=accent_rgb
            )
            badge_text_color = self._get_contrast_color(accent_rgb)
            draw.text(
                (badge_x + 12, badge_y + 4),
                badge_text,
                font=badge_font,
                fill=badge_text_color
            )
        
        # Draw "AutoForm" branding at bottom right
        brand_font = self._get_font(24)
        brand_text = "AutoForm"
        bbox = draw.textbbox((0, 0), brand_text, font=brand_font)
        brand_w = bbox[2] - bbox[0]
        brand_rgb = tuple(int(c * 0.5 + bg_rgb[i] * 0.5) for i, c in enumerate(text_rgb))
        draw.text(
            (OG_WIDTH - brand_w - 60, OG_HEIGHT - 60),
            brand_text,
            font=brand_font,
            fill=brand_rgb
        )
        
        # Convert to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)
        return buffer.getvalue()
    
    def generate_and_upload(
        self,
        form_id: int,
        token: str,
        title: str,
        description: Optional[str] = None,
        background_color: str = "#ffffff",
        accent_color: str = "#9333ea",
        text_color: Optional[str] = None,
        question_count: int = 0
    ) -> Optional[str]:
        """
        Generate OG image and upload to S3.
        
        Returns the public URL of the uploaded image, or None if upload fails.
        """
        try:
            logger.warning(f"[OG] Starting generation for form {form_id}, title: {title}")
            
            # Generate image
            image_bytes = self.generate_og_image(
                title=title,
                description=description,
                background_color=background_color,
                accent_color=accent_color,
                text_color=text_color,
                question_count=question_count
            )
            logger.warning(f"[OG] Image generated, size: {len(image_bytes)} bytes")
            
            # Generate a deterministic filename based on form styling
            style_hash = hashlib.md5(
                f"{title}{description}{background_color}{accent_color}{text_color}{question_count}".encode()
            ).hexdigest()[:12]
            
            s3_key = f"og-images/form-{form_id}-{style_hash}.png"
            
            # Upload to S3
            s3 = self._get_s3_service()
            if not s3.bucket_name:
                logger.warning("[OG] S3 not configured (no bucket name)")
                return None
            
            logger.warning(f"[OG] Uploading to bucket: {s3.bucket_name}, key: {s3_key}")
            
            # Try upload - first with ACL, then without if that fails
            try:
                url = s3.put_object(
                    key=s3_key,
                    body=image_bytes,
                    content_type="image/png",
                    public=True
                )
            except Exception as acl_error:
                logger.warning(f"[OG] ACL upload failed ({acl_error}), trying without ACL")
                url = s3.put_object(
                    key=s3_key,
                    body=image_bytes,
                    content_type="image/png",
                    public=False
                )
            
            logger.warning(f"[OG] SUCCESS! Uploaded to: {url}")
            return url
            
        except Exception as e:
            import traceback
            logger.error(f"[OG] FAILED for form {form_id}: {e}")
            logger.error(f"[OG] Traceback: {traceback.format_exc()}")
            return None
    
    def get_or_generate_url(
        self,
        form_id: int,
        token: str,
        title: str,
        description: Optional[str] = None,
        settings: Optional[dict] = None,
        question_count: int = 0,
        force_regenerate: bool = False
    ) -> str:
        """
        Get the OG image URL for a form, generating if needed.
        
        Returns S3 URL if available, otherwise returns a fallback URL.
        """
        settings = settings or {}
        background_color = settings.get('background_color', '#ffffff')
        accent_color = settings.get('accent_color', '#9333ea')
        text_color = settings.get('text_color')
        
        # Try to upload to S3
        url = self.generate_and_upload(
            form_id=form_id,
            token=token,
            title=title,
            description=description,
            background_color=background_color,
            accent_color=accent_color,
            text_color=text_color,
            question_count=question_count
        )
        
        if url:
            return url
        
        # Fallback to default banner
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173').split(',')[0].strip()
        return f"{frontend_url}/banner.png"


# Singleton instance
og_image_service = OGImageService()
