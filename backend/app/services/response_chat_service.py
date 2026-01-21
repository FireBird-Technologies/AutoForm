"""
Response Chat Service
=====================

Service for AI-powered chat analysis of form responses using DuckDB.
Provides summarization, filtering, aggregation, sentiment analysis, and custom exports.
"""

import duckdb
import json
import logging
import os
import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from ..models import Form, FormQuestion, FormResponse, ResponseAnswer, ChatMessage, User

logger = logging.getLogger(__name__)


class ResponseChatService:
    """Service for analyzing form responses via chat interface using DuckDB."""
    
    def __init__(self):
        self.max_history_messages = 20
    
    def load_responses_to_duckdb(
        self,
        db: Session,
        form_id: int
    ) -> Tuple[duckdb.DuckDBPyConnection, List[str], Dict[int, str]]:
        """
        Load form responses into an in-memory DuckDB table.
        
        Returns:
            Tuple of (DuckDB connection, column names, question_id to column name mapping)
        """
        # Get form and questions
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        questions = db.query(FormQuestion).filter(
            FormQuestion.form_id == form_id
        ).order_by(FormQuestion.question_order).all()
        
        # Get responses
        responses = db.query(FormResponse).filter(
            FormResponse.form_id == form_id
        ).all()
        
        # Create column mapping from questions
        # Column names: response_id, submitted_at, status, q1_<sanitized_text>, q2_<sanitized_text>, ...
        question_id_to_col = {}
        columns = ["response_id", "submitted_at", "status"]
        
        for i, q in enumerate(questions):
            # Sanitize question text for column name
            sanitized = re.sub(r'[^a-zA-Z0-9]', '_', q.question_text[:30]).lower()
            col_name = f"q{i+1}_{sanitized}"
            columns.append(col_name)
            question_id_to_col[q.id] = col_name
        
        # Build data rows
        rows = []
        for response in responses:
            row = {
                "response_id": response.id,
                "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None,
                "status": response.status
            }
            
            # Get answers for this response
            answers = db.query(ResponseAnswer).filter(
                ResponseAnswer.form_response_id == response.id
            ).all()
            
            answer_map = {a.form_question_id: a.answer_value for a in answers}
            
            for q in questions:
                col_name = question_id_to_col[q.id]
                answer_value = answer_map.get(q.id)
                row[col_name] = self._extract_answer_text(answer_value, q.question_type.value)
            
            rows.append(row)
        
        # Create DuckDB connection and table
        conn = duckdb.connect(":memory:")
        
        if rows:
            # Create table from data
            conn.execute(f"""
                CREATE TABLE responses AS 
                SELECT * FROM (
                    VALUES {self._format_values(rows, columns)}
                ) AS t({', '.join([f'"{c}"' for c in columns])})
            """)
        else:
            # Create empty table with schema
            col_defs = ", ".join([f'"{c}" VARCHAR' for c in columns])
            conn.execute(f"CREATE TABLE responses ({col_defs})")
        
        return conn, columns, question_id_to_col
    
    def _extract_answer_text(self, answer_value: Any, question_type: str) -> str:
        """Extract readable text from answer value based on question type."""
        if answer_value is None:
            return ""
        
        if isinstance(answer_value, dict):
            # Handle different answer formats
            if "text" in answer_value:
                val = answer_value["text"]
                return str(val) if val is not None else ""
            if "number" in answer_value:
                val = answer_value["number"]
                return str(val) if val is not None else ""
            if "choices" in answer_value:
                choices = answer_value["choices"]
                if choices is None:
                    return ""
                if isinstance(choices, list):
                    return ", ".join(str(c) for c in choices if c is not None)
                return str(choices)
            if "date" in answer_value:
                val = answer_value["date"]
                return str(val) if val is not None else ""
            if "rating" in answer_value:
                val = answer_value["rating"]
                # Return numeric rating or empty string for NULL
                return str(val) if val is not None else ""
            if "files" in answer_value:
                files = answer_value["files"]
                if isinstance(files, list):
                    return f"{len(files)} file(s)"
                return "1 file"
            if "wallet_address" in answer_value:
                return str(answer_value["wallet_address"])
            if "matrix_answers" in answer_value:
                return json.dumps(answer_value["matrix_answers"])
            if "ranked_items" in answer_value:
                items = answer_value["ranked_items"]
                if isinstance(items, list):
                    return " > ".join(str(i) for i in items)
                return str(items)
            # Fallback for other dict types
            return json.dumps(answer_value)
        
        return str(answer_value)
    
    def _format_values(self, rows: List[Dict], columns: List[str]) -> str:
        """Format rows as SQL VALUES clause."""
        value_rows = []
        for row in rows:
            values = []
            for col in columns:
                val = row.get(col)
                if val is None:
                    values.append("NULL")
                else:
                    # Escape single quotes
                    escaped = str(val).replace("'", "''")
                    values.append(f"'{escaped}'")
            value_rows.append(f"({', '.join(values)})")
        return ", ".join(value_rows)
    
    def execute_query(
        self,
        conn: duckdb.DuckDBPyConnection,
        sql_query: str,
        max_retries: int = 2
    ) -> Tuple[List[Dict], List[str]]:
        """
        Execute a SQL query on the DuckDB connection with retry logic.
        
        Returns:
            Tuple of (list of result rows as dicts, column names)
        """
        last_error = None
        current_query = sql_query
        
        for attempt in range(max_retries + 1):
            try:
                result = conn.execute(current_query)
                columns = [desc[0] for desc in result.description]
                rows = result.fetchall()
                
                # Convert to list of dicts
                result_dicts = []
                for row in rows:
                    result_dicts.append(dict(zip(columns, row)))
                
                return result_dicts, columns
            except Exception as e:
                last_error = e
                logger.warning(f"DuckDB query attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries:
                    # Try to fix common query issues
                    current_query = self._fix_query(current_query, str(e))
                    logger.info(f"Retrying with fixed query: {current_query}")
        
        logger.error(f"DuckDB query failed after {max_retries + 1} attempts: {last_error}")
        raise ValueError(f"Query execution failed: {str(last_error)}")
    
    def _fix_query(self, query: str, error_msg: str) -> str:
        """Attempt to fix common query issues based on error message."""
        fixed_query = query
        
        # Fix: Conversion error for FLOAT - add WHERE clause to filter empty strings
        if "could not convert string" in error_msg.lower() and "float" in error_msg.lower():
            # Find the column causing the issue
            import re
            col_match = re.search(r"column (\w+)", error_msg, re.IGNORECASE)
            if col_match:
                col_name = col_match.group(1)
                # Add filter for non-empty strings if not already present
                if f'"{col_name}" != \'\'' not in fixed_query and f"{col_name} != ''" not in fixed_query:
                    if "WHERE" in fixed_query.upper():
                        # Add to existing WHERE clause
                        fixed_query = re.sub(
                            r'(WHERE\s+)',
                            f'\\1"{col_name}" != \'\' AND "{col_name}" IS NOT NULL AND ',
                            fixed_query,
                            flags=re.IGNORECASE
                        )
                    else:
                        # Add WHERE clause before GROUP BY, ORDER BY, or LIMIT
                        for clause in ['GROUP BY', 'ORDER BY', 'LIMIT']:
                            if clause in fixed_query.upper():
                                idx = fixed_query.upper().index(clause)
                                fixed_query = f'{fixed_query[:idx]} WHERE "{col_name}" != \'\' AND "{col_name}" IS NOT NULL {fixed_query[idx:]}'
                                break
                        else:
                            # No clause found, add at end
                            fixed_query = f'{fixed_query} WHERE "{col_name}" != \'\' AND "{col_name}" IS NOT NULL'
        
        # Fix: Column not found - try with double quotes
        elif "column" in error_msg.lower() and "not found" in error_msg.lower():
            col_match = re.search(r'column[:\s]+"?(\w+)"?', error_msg, re.IGNORECASE)
            if col_match:
                col_name = col_match.group(1)
                # Wrap column name in double quotes if not already
                if f'"{col_name}"' not in fixed_query:
                    fixed_query = re.sub(
                        rf'\b{col_name}\b(?!")',
                        f'"{col_name}"',
                        fixed_query
                    )
        
        # Fix: Syntax near CAST - ensure proper spacing
        elif "syntax" in error_msg.lower() and "cast" in error_msg.lower():
            fixed_query = re.sub(r'CAST\s*\(\s*', 'CAST(', fixed_query, flags=re.IGNORECASE)
            fixed_query = re.sub(r'\s*AS\s+', ' AS ', fixed_query, flags=re.IGNORECASE)
        
        return fixed_query
    
    def get_schema_description(
        self,
        columns: List[str],
        question_id_to_col: Dict[int, str],
        db: Session,
        form_id: int
    ) -> str:
        """Generate a human-readable schema description for the AI."""
        questions = db.query(FormQuestion).filter(
            FormQuestion.form_id == form_id
        ).order_by(FormQuestion.question_order).all()
        
        question_map = {q.id: q for q in questions}
        col_to_question = {v: k for k, v in question_id_to_col.items()}
        
        schema_lines = ["Table: responses", "Columns:"]
        schema_lines.append("  - response_id: Unique identifier for each response")
        schema_lines.append("  - submitted_at: Timestamp when response was submitted (ISO format)")
        schema_lines.append("  - status: Response status ('complete', 'partial', 'in_progress')")
        
        for col in columns:
            if col in col_to_question:
                q_id = col_to_question[col]
                q = question_map.get(q_id)
                if q:
                    q_type = q.question_type.value
                    # Add hints for different types
                    type_hint = q_type
                    if q_type == "rating":
                        type_hint = "rating (numeric 1-5, use CAST to INTEGER for counts/AVG)"
                    elif q_type == "number":
                        type_hint = "number (numeric, use CAST to FLOAT for aggregates)"
                    elif q_type in ("checkboxes", "multi_select"):
                        # Get available choices from settings
                        choices = []
                        if q.settings and isinstance(q.settings, dict):
                            choices = q.settings.get("choices", [])
                        if choices:
                            choices_str = ", ".join(f'"{c}"' for c in choices[:8])  # Limit to 8
                            type_hint = f"checkboxes (comma-separated values, options: {choices_str}). To count each option: use string_split and unnest, or COUNT with LIKE '%option%'"
                        else:
                            type_hint = "checkboxes (comma-separated values). To count each option: COUNT with LIKE '%option%'"
                    elif q_type in ("multiple_choice", "dropdown"):
                        # Get available choices from settings
                        choices = []
                        if q.settings and isinstance(q.settings, dict):
                            choices = q.settings.get("choices", [])
                        if choices:
                            choices_str = ", ".join(f'"{c}"' for c in choices[:8])
                            type_hint = f"single_choice (one value per response, options: {choices_str}). To count: GROUP BY this column"
                        else:
                            type_hint = "single_choice (one value per response). To count: GROUP BY this column"
                    elif q_type == "linear_scale":
                        type_hint = "linear_scale (numeric, use CAST to INTEGER for grouping/AVG)"
                    schema_lines.append(f"  - {col}: {q.question_text} (type: {type_hint})")
        
        return "\n".join(schema_lines)
    
    def get_response_summary(
        self,
        conn: duckdb.DuckDBPyConnection,
        columns: List[str]
    ) -> Dict[str, Any]:
        """Generate basic summary statistics for responses."""
        summary = {}
        
        # Total count
        result = conn.execute("SELECT COUNT(*) FROM responses").fetchone()
        summary["total_responses"] = result[0]
        
        # Status breakdown
        result = conn.execute("""
            SELECT status, COUNT(*) as count 
            FROM responses 
            GROUP BY status
        """).fetchall()
        summary["status_breakdown"] = {row[0]: row[1] for row in result}
        
        # For each question column, get value distribution (top 5)
        question_cols = [c for c in columns if c.startswith("q")]
        summary["question_summaries"] = {}
        
        for col in question_cols:
            try:
                result = conn.execute(f"""
                    SELECT "{col}", COUNT(*) as count 
                    FROM responses 
                    WHERE "{col}" IS NOT NULL AND "{col}" != ''
                    GROUP BY "{col}" 
                    ORDER BY count DESC 
                    LIMIT 5
                """).fetchall()
                
                if result:
                    summary["question_summaries"][col] = [
                        {"value": row[0], "count": row[1]} for row in result
                    ]
            except Exception as e:
                logger.warning(f"Could not summarize column {col}: {e}")
        
        return summary
    
    def analyze_sentiment(
        self,
        text_responses: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze sentiment of text responses using OpenAI.
        Returns sentiment breakdown and key themes.
        """
        import dspy
        
        if not text_responses:
            return {"error": "No text responses to analyze"}
        
        # Sample if too many responses
        sample_size = min(50, len(text_responses))
        sample = text_responses[:sample_size]
        
        try:
            # Use DSPy for sentiment analysis
            class SentimentAnalysisSignature(dspy.Signature):
                """Analyze sentiment of form responses."""
                responses = dspy.InputField(desc="List of text responses to analyze")
                analysis = dspy.OutputField(desc="JSON with: sentiment_breakdown (positive/neutral/negative counts), key_themes (list of main topics), summary (brief overall sentiment summary)")
            
            with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1000)):
                analyzer = dspy.Predict(SentimentAnalysisSignature)
                result = analyzer(responses=json.dumps(sample))
            
            # Parse the result
            try:
                analysis = json.loads(result.analysis)
                analysis["sample_size"] = sample_size
                analysis["total_responses"] = len(text_responses)
                return analysis
            except json.JSONDecodeError:
                return {
                    "summary": result.analysis,
                    "sample_size": sample_size,
                    "total_responses": len(text_responses)
                }
                
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {"error": f"Sentiment analysis failed: {str(e)}"}
    
    def save_chat_message(
        self,
        db: Session,
        form_id: int,
        user_id: int,
        role: str,
        content: str,
        chat_type: str = "response_analysis",
        query_type: Optional[str] = None,
        sql_query: Optional[str] = None,
        result_data: Optional[Dict] = None
    ) -> ChatMessage:
        """Save a chat message to the database."""
        message = ChatMessage(
            form_id=form_id,
            user_id=user_id,
            chat_type=chat_type,
            role=role,
            content=content,
            query_type=query_type,
            sql_query=sql_query,
            result_data=result_data
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    
    def get_chat_history(
        self,
        db: Session,
        form_id: int,
        user_id: int,
        chat_type: str = "response_analysis",
        limit: int = None
    ) -> List[ChatMessage]:
        """Get chat history for a form."""
        limit = limit or self.max_history_messages
        
        messages = db.query(ChatMessage).filter(
            ChatMessage.form_id == form_id,
            ChatMessage.user_id == user_id,
            ChatMessage.chat_type == chat_type
        ).order_by(ChatMessage.created_at.desc()).limit(limit).all()
        
        # Return in chronological order
        return list(reversed(messages))
    
    def format_history_for_context(
        self,
        history: List[ChatMessage]
    ) -> str:
        """Format chat history as context for the AI."""
        if not history:
            return "No previous conversation history."
        
        context_lines = ["Previous conversation:"]
        for msg in history[-10:]:  # Last 10 messages
            role = "User" if msg.role == "user" else "Assistant"
            content = msg.content[:500]  # Truncate long messages
            context_lines.append(f"{role}: {content}")
        
        return "\n".join(context_lines)
    
    def generate_export_csv(
        self,
        conn: duckdb.DuckDBPyConnection,
        sql_query: str
    ) -> str:
        """Generate CSV export from a SQL query result."""
        import io
        import csv
        
        results, columns = self.execute_query(conn, sql_query)
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerows(results)
        
        return output.getvalue()


# Singleton instance
response_chat_service = ResponseChatService()
