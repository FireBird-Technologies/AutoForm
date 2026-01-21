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
import time
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from ..models import Form, FormQuestion, FormResponse, ResponseAnswer, ChatMessage, User

logger = logging.getLogger(__name__)


# Simple session cache for DuckDB connections (per form)
# Structure: {form_id: {'conn': connection, 'columns': [...], 'question_map': {...}, 'timestamp': float, 'count': int}}
_duckdb_sessions: Dict[int, Dict[str, Any]] = {}
_SESSION_TTL = 1200  # 20 minutes


def get_cached_duckdb(form_id: int) -> Optional[Dict[str, Any]]:
    """Get cached DuckDB session if still valid (< 5 mins old)."""
    if form_id not in _duckdb_sessions:
        return None
    
    session = _duckdb_sessions[form_id]
    age = time.time() - session['timestamp']
    
    if age > _SESSION_TTL:
        # Expired - remove it
        try:
            session['conn'].close()
        except:
            pass
        del _duckdb_sessions[form_id]
        logger.debug(f"DuckDB session expired for form {form_id} (age: {age:.0f}s)")
        return None
    
    # Verify connection is still valid
    try:
        session['conn'].execute("SELECT 1").fetchone()
        logger.debug(f"Using cached DuckDB session for form {form_id} (age: {age:.0f}s)")
        return session
    except Exception as e:
        logger.warning(f"DuckDB connection invalid for form {form_id}: {e}")
        try:
            session['conn'].close()
        except:
            pass
        del _duckdb_sessions[form_id]
        return None


def set_cached_duckdb(form_id: int, conn: duckdb.DuckDBPyConnection, 
                      columns: List[str], question_map: Dict[int, str], count: int) -> None:
    """Cache a DuckDB session for a form."""
    # Close old connection if exists
    if form_id in _duckdb_sessions:
        try:
            _duckdb_sessions[form_id]['conn'].close()
        except:
            pass
    
    _duckdb_sessions[form_id] = {
        'conn': conn,
        'columns': columns,
        'question_map': question_map,
        'count': count,
        'timestamp': time.time()
    }
    logger.debug(f"Cached DuckDB session for form {form_id} with {count} responses")


def invalidate_duckdb_cache(form_id: int) -> None:
    """Invalidate cached DuckDB session for a form."""
    if form_id in _duckdb_sessions:
        try:
            _duckdb_sessions[form_id]['conn'].close()
        except:
            pass
        del _duckdb_sessions[form_id]
        logger.debug(f"Invalidated DuckDB cache for form {form_id}")


class ResponseChatService:
    """Service for analyzing form responses via chat interface using DuckDB."""
    
    def __init__(self):
        self.max_history_messages = 20
    
    def validate_duckdb_ready(
        self,
        conn: Optional[duckdb.DuckDBPyConnection],
        expected_columns: Optional[List[str]] = None
    ) -> Tuple[bool, str]:
        """
        Verify DuckDB connection is ready for queries.
        
        Returns:
            Tuple of (is_ready: bool, error_message: str)
        """
        if conn is None:
            return False, "DuckDB connection not established"
        
        try:
            # Test connection with simple query
            result = conn.execute("SELECT 1").fetchone()
            if result is None:
                return False, "DuckDB connection test failed"
            
            # Verify responses table exists
            tables = conn.execute("SHOW TABLES").fetchall()
            table_names = [t[0] for t in tables]
            if "responses" not in table_names:
                return False, "Responses table not found in DuckDB"
            
            # Verify columns if provided
            if expected_columns:
                result = conn.execute("PRAGMA table_info('responses')").fetchall()
                actual_columns = [row[1] for row in result]
                for col in expected_columns[:3]:  # Check first 3 required columns
                    if col not in actual_columns:
                        return False, f"Expected column '{col}' not found in responses table"
            
            return True, ""
        except Exception as e:
            return False, f"DuckDB validation error: {str(e)}"
    
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
        from sqlalchemy import func
        
        # Get current response count to check if cache is valid
        current_count = db.query(func.count(FormResponse.id)).filter(
            FormResponse.form_id == form_id,
            FormResponse.status.in_(["complete", "partial"])
        ).scalar() or 0
        
        # Check cache first
        cached = get_cached_duckdb(form_id)
        if cached is not None and cached['count'] == current_count:
            # Cache is valid and count matches
            return cached['conn'], cached['columns'], cached['question_map']
        
        # Cache miss or count changed - need to reload
        if cached is not None:
            logger.info(f"Response count changed for form {form_id}: {cached['count']} -> {current_count}, reloading")
            invalidate_duckdb_cache(form_id)
        
        # Get form and questions
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        questions = db.query(FormQuestion).filter(
            FormQuestion.form_id == form_id
        ).order_by(FormQuestion.question_order).all()
        
        # Get responses - only complete and partial
        responses = db.query(FormResponse).filter(
            FormResponse.form_id == form_id,
            FormResponse.status.in_(["complete", "partial"])
        ).all()
        
        logger.info(f"Loading {len(responses)} responses into DuckDB for form {form_id}")
        
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
        
        # Cache for reuse within session (5 min TTL)
        set_cached_duckdb(form_id, conn, columns, question_id_to_col, len(responses))
        
        return conn, columns, question_id_to_col
    
    def _extract_answer_text(self, answer_value: Any, question_type: str) -> str:
        """Extract readable text from answer value based on question type."""
        if answer_value is None:
            return ""
        
        # Handle plain numeric types directly (int, float)
        if isinstance(answer_value, (int, float)):
            return str(answer_value)
        
        if isinstance(answer_value, dict):
            # Empty dict - return empty string
            if not answer_value:
                return ""
            
            # IMPORTANT: Check if value exists AND is not None
            # Pydantic model_dump() includes all fields with None values
            
            # Rating (check early - common question type)
            if answer_value.get("rating") is not None:
                return str(answer_value["rating"])
            
            # Text inputs
            if answer_value.get("text") is not None:
                return str(answer_value["text"])
            
            # Number inputs
            if answer_value.get("number") is not None:
                return str(answer_value["number"])
            
            # Value key (common for sliders/scales)
            if answer_value.get("value") is not None:
                return str(answer_value["value"])
            
            # Scale key
            if answer_value.get("scale") is not None:
                return str(answer_value["scale"])
            
            # Choices (checkboxes, multiple choice)
            choices = answer_value.get("choices")
            if choices is not None:
                if isinstance(choices, list) and len(choices) > 0:
                    return ", ".join(str(c) for c in choices if c is not None)
                elif isinstance(choices, str):
                    return choices
            
            # Date/time
            if answer_value.get("date") is not None:
                return str(answer_value["date"])
            
            # Files
            files = answer_value.get("files")
            if files is not None and isinstance(files, list) and len(files) > 0:
                return f"{len(files)} file(s)"
            
            # Wallet address
            if answer_value.get("wallet_address") is not None:
                return str(answer_value["wallet_address"])
            
            # Matrix answers
            matrix = answer_value.get("matrix_answers")
            if matrix is not None and isinstance(matrix, dict) and len(matrix) > 0:
                return json.dumps(matrix)
            
            # Ranked items
            ranked = answer_value.get("ranked_items")
            if ranked is not None and isinstance(ranked, list) and len(ranked) > 0:
                return " > ".join(str(i) for i in ranked)
            
            # Signature
            if answer_value.get("signature") is not None:
                return "[signature]"
            
            # Check if ALL values are None - return empty
            all_none = all(v is None for v in answer_value.values())
            if all_none:
                return ""
            
            # Fallback for other dict types - log and dump
            logger.debug(f"Unknown answer format for {question_type}: {answer_value}")
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
    
    def get_responses_direct(
        self,
        db: Session,
        form_id: int,
        limit: int = 100
    ) -> Tuple[List[Dict], List[str], Dict[str, Any]]:
        """
        Get responses directly from database (fallback when DuckDB fails).
        
        Returns:
            Tuple of (rows, columns, summary_dict)
        """
        # Get form questions for column names
        questions = db.query(FormQuestion).filter(
            FormQuestion.form_id == form_id
        ).order_by(FormQuestion.question_order).all()
        
        # Get responses with status filter
        responses = db.query(FormResponse).filter(
            FormResponse.form_id == form_id,
            FormResponse.status.in_(["complete", "partial"])
        ).order_by(FormResponse.submitted_at.desc()).limit(limit).all()
        
        if not responses:
            return [], ["response_id", "submitted_at", "status"], {"total_responses": 0, "status_breakdown": {}}
        
        # Build column names
        columns = ["response_id", "submitted_at", "status"]
        question_id_to_col = {}
        for i, q in enumerate(questions):
            sanitized = re.sub(r'[^a-zA-Z0-9]', '_', q.question_text[:30]).lower()
            col_name = f"q{i+1}_{sanitized}"
            columns.append(col_name)
            question_id_to_col[q.id] = col_name
        
        # Build rows
        rows = []
        status_counts = {}
        for response in responses:
            # Get answers for this response
            answers = db.query(ResponseAnswer).filter(
                ResponseAnswer.form_response_id == response.id
            ).all()
            
            row = {
                "response_id": str(response.id),
                "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None,
                "status": response.status
            }
            
            status_counts[response.status] = status_counts.get(response.status, 0) + 1
            
            answer_map = {a.form_question_id: a.answer_value for a in answers}
            for q in questions:
                col_name = question_id_to_col[q.id]
                answer_value = answer_map.get(q.id)
                row[col_name] = self._extract_answer_text(answer_value, q.question_type.value)
            rows.append(row)
        
        summary = {
            "total_responses": len(responses),
            "status_breakdown": status_counts
        }
        
        return rows, columns, summary
    
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
        
        # Track shortcuts for q1, q2, etc.
        shortcuts = []
        
        for col in columns:
            if col in col_to_question:
                q_id = col_to_question[col]
                q = question_map.get(q_id)
                if q:
                    q_type = q.question_type.value
                    # Extract question number from column name (e.g., q1, q2)
                    q_num_match = re.match(r'^(q\d+)_', col)
                    if q_num_match:
                        q_shortcut = q_num_match.group(1)
                        shortcuts.append((q_shortcut, col, q.question_text))
                    
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
        
        # Add shortcuts section so AI knows q1 = full column name
        if shortcuts:
            schema_lines.append("")
            schema_lines.append("QUESTION SHORTCUTS (when user says q1, q2, etc., use the full column name):")
            for shortcut, full_col, question_text in shortcuts:
                schema_lines.append(f'  - {shortcut} → "{full_col}" ({question_text[:40]}...)')
        
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
