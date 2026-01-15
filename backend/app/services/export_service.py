"""
Export service for form responses (CSV, Excel, PDF)
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Dict, Any
from datetime import datetime
import io
import csv
import json
import logging

# Excel support
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.chart import BarChart, Reference

# PDF support
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

from ..models import Form, FormQuestion, FormResponse, ResponseAnswer

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting form responses in various formats"""
    
    async def export_csv(
        self,
        db: Session,
        form_id: int,
        include_incomplete: bool = False,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        anonymize_pii: bool = False
    ) -> io.StringIO:
        """
        Enhanced CSV export with filtering.
        
        Args:
            db: Database session
            form_id: ID of the form
            include_incomplete: Include incomplete submissions
            start_date: Optional start date filter
            end_date: Optional end date filter
            anonymize_pii: Anonymize personally identifiable information
        
        Returns:
            StringIO object with CSV data
        """
        # Get form
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        # Get questions
        questions = sorted(form.questions, key=lambda q: q.question_order)
        
        # Build query for responses
        query = db.query(FormResponse).filter(FormResponse.form_id == form_id)
        
        # Apply filters
        if not include_incomplete:
            query = query.filter(FormResponse.status == "complete")
        
        if start_date:
            query = query.filter(FormResponse.submitted_at >= start_date)
        
        if end_date:
            query = query.filter(FormResponse.submitted_at <= end_date)
        
        responses = query.order_by(desc(FormResponse.submitted_at)).all()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Build headers
        headers = [
            "Response ID",
            "Status",
            "Submitted At",
            "Started At",
            "Completion Time (minutes)",
            "IP Address" if not anonymize_pii else "IP Hash",
            "Country",
            "City",
            "UTM Source",
            "UTM Medium",
            "UTM Campaign"
        ]
        headers.extend([q.question_text for q in questions])
        writer.writerow(headers)
        
        # Write data rows
        for response in responses:
            # Calculate completion time
            completion_minutes = None
            if response.started_at and response.submitted_at:
                delta = response.submitted_at - response.started_at
                completion_minutes = round(delta.total_seconds() / 60, 2)
            
            row = [
                response.id,
                response.status,
                response.submitted_at.isoformat() if response.submitted_at else "",
                response.started_at.isoformat() if response.started_at else "",
                completion_minutes if completion_minutes else "",
                response.ip_address_hash if anonymize_pii else (response.ip_address or ""),
                response.country or "",
                response.city or "",
                response.utm_source or "",
                response.utm_medium or "",
                response.utm_campaign or ""
            ]
            
            # Create answer map
            answer_map = {
                answer.form_question_id: answer.answer_value
                for answer in response.answers
            }
            
            # Add answers in question order
            for question in questions:
                answer_value = answer_map.get(question.id, {})
                formatted_answer = self._format_answer_for_export(answer_value)
                row.append(formatted_answer)
            
            writer.writerow(row)
        
        output.seek(0)
        return output
    
    async def export_excel(
        self,
        db: Session,
        form_id: int,
        include_incomplete: bool = False
    ) -> io.BytesIO:
        """
        Export as Excel with multiple sheets.
        
        Sheets:
        1. Responses - All response data
        2. Summary - Statistics and charts
        3. Metadata - Form structure info
        
        Args:
            db: Database session
            form_id: ID of the form
            include_incomplete: Include incomplete submissions
        
        Returns:
            BytesIO object with Excel workbook
        """
        # Get form
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        # Create workbook
        wb = Workbook()
        
        # Sheet 1: Responses
        ws_responses = wb.active
        ws_responses.title = "Responses"
        
        # Get questions
        questions = sorted(form.questions, key=lambda q: q.question_order)
        
        # Headers
        headers = ["Response ID", "Status", "Submitted At", "Country", "City"]
        headers.extend([q.question_text for q in questions])
        ws_responses.append(headers)
        
        # Style headers
        header_fill = PatternFill(start_color="9333EA", end_color="9333EA", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)
        
        for cell in ws_responses[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
        
        # Get responses
        query = db.query(FormResponse).filter(FormResponse.form_id == form_id)
        if not include_incomplete:
            query = query.filter(FormResponse.status == "complete")
        
        responses = query.order_by(desc(FormResponse.submitted_at)).all()
        
        # Write data
        for response in responses:
            answer_map = {
                answer.form_question_id: answer.answer_value
                for answer in response.answers
            }
            
            row = [
                response.id,
                response.status,
                response.submitted_at.isoformat() if response.submitted_at else "",
                response.country or "",
                response.city or ""
            ]
            
            for question in questions:
                answer_value = answer_map.get(question.id, {})
                formatted_answer = self._format_answer_for_export(answer_value)
                row.append(formatted_answer)
            
            ws_responses.append(row)
        
        # Auto-size columns
        for column in ws_responses.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws_responses.column_dimensions[column_letter].width = adjusted_width
        
        # Sheet 2: Summary
        ws_summary = wb.create_sheet("Summary")
        ws_summary['A1'] = "Form Analytics Summary"
        ws_summary['A1'].font = Font(size=16, bold=True)
        
        ws_summary['A3'] = "Total Responses:"
        ws_summary['B3'] = len(responses)
        
        complete_count = sum(1 for r in responses if r.status == "complete")
        ws_summary['A4'] = "Complete Responses:"
        ws_summary['B4'] = complete_count
        
        ws_summary['A5'] = "Completion Rate:"
        ws_summary['B5'] = f"{(complete_count / len(responses) * 100):.1f}%" if responses else "0%"
        
        # Sheet 3: Metadata
        ws_meta = wb.create_sheet("Metadata")
        ws_meta['A1'] = "Form Metadata"
        ws_meta['A1'].font = Font(size=16, bold=True)
        
        ws_meta['A3'] = "Form Title:"
        ws_meta['B3'] = form.title
        
        ws_meta['A4'] = "Form ID:"
        ws_meta['B4'] = form.id
        
        ws_meta['A5'] = "Export Date:"
        ws_meta['B5'] = datetime.utcnow().isoformat()
        
        ws_meta['A6'] = "Total Questions:"
        ws_meta['B6'] = len(questions)
        
        ws_meta['A8'] = "Questions:"
        for idx, question in enumerate(questions, start=9):
            ws_meta[f'A{idx}'] = f"Q{question.question_order}:"
            ws_meta[f'B{idx}'] = question.question_text
            ws_meta[f'C{idx}'] = question.question_type.value
        
        # Save to BytesIO
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output
    
    async def export_pdf(
        self,
        db: Session,
        form_id: int,
        response_id: int
    ) -> io.BytesIO:
        """
        Export single response as formatted PDF.
        
        Args:
            db: Database session
            form_id: ID of the form
            response_id: ID of the response
        
        Returns:
            BytesIO object with PDF data
        """
        # Get form and response
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        response = db.query(FormResponse).filter(
            FormResponse.id == response_id,
            FormResponse.form_id == form_id
        ).first()
        
        if not response:
            raise ValueError(f"Response {response_id} not found")
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # Build content
        story = []
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#9333EA'),
            spaceAfter=30
        )
        
        # Add title
        story.append(Paragraph(form.title, title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        # Add metadata
        metadata_data = [
            ["Response ID:", str(response.id)],
            ["Submitted:", response.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if response.submitted_at else "N/A"],
            ["Status:", response.status.title()],
        ]
        
        if response.country:
            metadata_data.append(["Location:", f"{response.city}, {response.country}" if response.city else response.country])
        
        metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6B7280')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(metadata_table)
        story.append(Spacer(1, 0.4 * inch))
        
        # Add divider
        story.append(Paragraph("<hr width='100%'/>", styles['Normal']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Create answer map
        answer_map = {
            answer.form_question_id: answer.answer_value
            for answer in response.answers
        }
        
        # Add questions and answers
        question_style = ParagraphStyle(
            'Question',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=6
        )
        
        answer_style = ParagraphStyle(
            'Answer',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#4B5563'),
            leftIndent=20,
            spaceAfter=20
        )
        
        for idx, question in enumerate(sorted(form.questions, key=lambda q: q.question_order), 1):
            # Question text
            question_text = f"<b>{idx}. {question.question_text}</b>"
            if question.required:
                question_text += " <font color='red'>*</font>"
            
            story.append(Paragraph(question_text, question_style))
            
            # Answer
            answer_value = answer_map.get(question.id, {})
            formatted_answer = self._format_answer_for_pdf(answer_value)
            story.append(Paragraph(formatted_answer, answer_style))
        
        # Add footer
        story.append(Spacer(1, 0.5 * inch))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#9CA3AF'),
            alignment=1  # Center
        )
        story.append(Paragraph(
            f"Generated by AutoForm on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC",
            footer_style
        ))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return buffer
    
    def _format_answer_for_export(self, answer_value: Dict[str, Any]) -> str:
        """Format answer value for CSV/Excel export"""
        if not answer_value:
            return ""
        
        # Text answer
        if "text" in answer_value and answer_value["text"]:
            return str(answer_value["text"])
        
        # Number answer
        if "number" in answer_value and answer_value["number"] is not None:
            return str(answer_value["number"])
        
        # Choices (multiple choice, checkboxes)
        if "choices" in answer_value and answer_value["choices"]:
            return ", ".join(answer_value["choices"])
        
        # Date
        if "date" in answer_value and answer_value["date"]:
            return str(answer_value["date"])
        
        # Rating
        if "rating" in answer_value and answer_value["rating"] is not None:
            return str(answer_value["rating"])
        
        # Matrix answers
        if "matrix_answers" in answer_value and answer_value["matrix_answers"]:
            matrix_str = "; ".join([
                f"{row}: {col}" for row, col in answer_value["matrix_answers"].items()
            ])
            return matrix_str
        
        # Ranked items
        if "ranked_items" in answer_value and answer_value["ranked_items"]:
            return ", ".join(answer_value["ranked_items"])
        
        # File uploads
        if "files" in answer_value and answer_value["files"]:
            file_labels = []
            for file_item in answer_value["files"]:
                if not isinstance(file_item, dict):
                    file_labels.append(str(file_item))
                    continue
                file_labels.append(
                    file_item.get("filename")
                    or file_item.get("original_filename")
                    or file_item.get("s3_key")
                    or str(file_item.get("upload_id", ""))
                )
            return ", ".join([label for label in file_labels if label])
        
        # File upload
        if "file_url" in answer_value and answer_value["file_url"]:
            return answer_value["file_url"]
        
        # Wallet address
        if "wallet_address" in answer_value and answer_value["wallet_address"]:
            return answer_value["wallet_address"]
        
        # Signature
        if "signature" in answer_value and answer_value["signature"]:
            return "[Signature provided]"
        
        # Fallback: JSON dump
        return json.dumps(answer_value)
    
    def _format_answer_for_pdf(self, answer_value: Dict[str, Any]) -> str:
        """Format answer value for PDF display"""
        if not answer_value:
            return "<i>No answer provided</i>"
        
        formatted = self._format_answer_for_export(answer_value)
        
        if not formatted:
            return "<i>No answer provided</i>"
        
        # Escape HTML special characters for ReportLab
        formatted = formatted.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        
        return formatted


# Singleton instance
export_service = ExportService()
