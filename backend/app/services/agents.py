"""
DSPy-based Form Generation System
==================================

This module uses DSPy to generate forms from natural language queries.
It includes a multi-stage pipeline:
1. Planner: Converts user query to form plan with components
2. Component Signature: Generates renderable form components with metadata
3. Conditional Logic: Defines relationships between components

FRONTEND TECH STACK:
- React with TypeScript
- Headless UI (@headlessui/react) for accessible dialogs, modals, and interactive components
- React Markdown (react-markdown) with remark-gfm for markdown rendering
- Tally-inspired minimal design with inline styles (no CSS frameworks)
- Purple accent color (#9333ea) throughout
- Clean, generous whitespace (48px between questions)
- Subtle borders and transitions
"""

import dspy
import json
import logging
import os
import warnings
from typing import Dict, Any, List, Optional

# Suppress Pydantic serialization warnings from DSPy/LiteLLM
warnings.filterwarnings("ignore", message="Pydantic serializer warnings")
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# Set up logger for the module
logger = logging.getLogger("dspy_forms")
logger.setLevel(logging.WARNING)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s][%(levelname)s] %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)


# ============================================================================
# FORM GENERATION SIGNATURES
# ============================================================================

class FormPlannerSignature(dspy.Signature):
    """
    You are an AI form designer that creates comprehensive form plans from user descriptions.
    
    TASK:
    Convert a natural language form request into a structured JSON form plan with component specifications.
    
    OUTPUT FORMAT (JSON):
    {
        "title": "Form Title",
        "description": "Brief description of form purpose",
        "submit_button_text": "Submit" or custom text,
        "components": [
            {
                "component_id": "comp_1",
                "type": "question_type",
                "brief": "Brief description of what this component captures",
                "required": true/false,
                "order": 0
            }
        ],
        "conditional_logic": [
            {
                "trigger_component_id": "comp_1",
                "target_component_id": "comp_3",
                "condition_type": "equals",
                "condition_value": "Yes",
                "action": "show"
            }
        ]
    }
    
    COMPONENT TYPES (use exact strings):
    - short_answer: Single line text
    - long_answer: Multi-line text
    - multiple_choice: Radio buttons (one selection)
    - checkboxes: Multiple selections
    - dropdown: Select dropdown
    - multi_select: Multi-select dropdown
    - number: Numeric input
    - email: Email validation
    - phone: Phone number
    - link: URL input
    - file_upload: File attachment
    - date: Date picker
    - time: Time picker
    - linear_scale: Scale (1-10)
    - matrix: Grid questions
    - rating: Star rating
    - payment: Payment field
    - signature: Digital signature
    - ranking: Rank items
    - wallet_connect: Web3 wallet
    - button: Custom action button
    
    CONDITIONAL LOGIC RULES:
    - condition_type: equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty
    - action: show, hide
    
    CRITICAL GUIDELINES:
    1. **FOLLOW USER'S EXACT SPECIFICATIONS** - If user says "Valima, Nikkah, Barat", use those EXACT terms, not substitutes
    2. **DO NOT SUBSTITUTE** terms - Use the exact names, labels, and options the user provides
    3. **USE DIVERSE QUESTION TYPES** - Mix short_answer, multiple_choice, checkboxes, dropdown, date, rating, etc.
    4. **USE CHECKBOXES for multiple selections** - When users can select multiple items (e.g., "Which events will you attend?")
    5. **USE MULTIPLE_CHOICE for single selection** - When users pick one option (e.g., "Are you attending? Yes/No")
    6. Choose appropriate component types based on the data being collected
    7. Mark essential components as required
    8. Order components logically (general to specific)
    9. **INCLUDE AT LEAST 5 COMPONENTS** - Forms should have a minimum of 5 questions/components. You can reuse the same component type multiple times if appropriate (e.g., multiple short_answer fields for different information)
    10. Add conditional logic where it makes sense (e.g., show follow-up based on previous answer)
    11. Generate component_ids like "comp_1", "comp_2", etc.
    12. **PREFER STRUCTURED INPUTS** over text when possible (use checkboxes, dropdowns, ratings instead of open text)
    13. **KEEP IT CONCISE** - Descriptions should be 1-2 sentences max. Option lists should have 3-8 items max, not exhaustive lists.
    
    **IMPORTANT: PRESERVE USER'S TERMINOLOGY**
    - If user mentions specific event names (Valima, Nikkah, Barat, etc.), use those EXACT names
    - If user mentions specific options or choices, use those EXACT options
    - Do NOT replace cultural, local, or specific terms with generic alternatives
    - Do NOT assume Western/US conventions unless specifically requested
    
    COMMON FORM PATTERNS (adapt to user's context):
    - Contact forms: name (short_answer), email, phone, message (long_answer)
    - Registration forms: name, email, password, interests (checkboxes), preferences (dropdown)
    - Feedback forms: name (optional), rating, satisfaction (linear_scale), comments (long_answer)
    - Applications: name, email, skills (checkboxes), experience level (dropdown)
    - Event registration: name, email, events attending (checkboxes), meal preference (dropdown), dietary restrictions (checkboxes)
    - Survey forms: demographics (dropdowns), agreement scales (linear_scale), multiple choice questions, open-ended responses (long_answer)
    - RSVP forms: attendance (multiple_choice: Yes/No), guest count (number), dietary needs (checkboxes)
    
    FORM TITLE BEST PRACTICES:
    - **ALWAYS wrap title in double asterisks** for bold formatting: "**Your Form Title**"
    - Be specific and clear (e.g., "**Customer Feedback Survey**" not "Form")
    - Use action words when appropriate (e.g., "**Submit Your Application**", "**Register for Event**")
    - Keep under 60 characters for readability
    - Match the tone to the form purpose (professional for applications, friendly for feedback)
    
    CRITICAL: The title field MUST always start and end with ** to render as bold markdown.
    Example: "title": "**Wedding RSVP**" NOT "title": "Wedding RSVP"
    
    Always include a meaningful form title and description that clearly explains the purpose.
    """
    user_query = dspy.InputField(desc="Natural language description of the form needed")
    form_plan = dspy.OutputField(desc="JSON form plan with title, description, components list, and conditional_logic")


class ComponentTypeDetectorSignature(dspy.Signature):
    """
    Detect the correct component type from a user's add request.
    
    COMPONENT TYPES (return EXACTLY one of these strings):
    - short_answer: Single line text (name, title, brief response)
    - long_answer: Multi-line text (description, feedback, detailed response)
    - multiple_choice: Radio buttons - ONE selection only (yes/no, single option)
    - checkboxes: Multiple selections allowed (select all that apply)
    - dropdown: Single select from dropdown list
    - multi_select: Multi-select dropdown
    - number: Numeric input (age, quantity, amount)
    - email: Email address input
    - phone: Phone number input
    - link: URL/website input
    - file_upload: File attachment (resume, document, image)
    - date: Date picker (birthday, event date)
    - time: Time picker (appointment time)
    - linear_scale: Scale/slider (1-5, 1-10 rating with labels)
    - matrix: Grid questions (rows x columns)
    - rating: Star rating (1-5 stars)
    - payment: Payment field
    - signature: Digital signature capture
    - ranking: Rank/order items by preference
    - wallet_connect: Web3 wallet connection
    - button: Custom action button
    
    DETECTION RULES:
    1. "checkbox" or "checkboxes" or "select multiple" → checkboxes
    2. "radio" or "single choice" or "choose one" → multiple_choice
    3. "dropdown" or "select" (single) → dropdown
    4. "rating" or "star" or "stars" → rating
    5. "scale" or "slider" or "1 to 10" or "rate from" → linear_scale
    6. "email" → email
    7. "phone" or "telephone" or "mobile" → phone
    8. "date" or "birthday" or "when" → date
    9. "time" or "what time" → time
    10. "file" or "upload" or "attachment" or "resume" or "document" → file_upload
    11. "signature" or "sign" → signature
    12. "rank" or "order" or "prioritize" → ranking
    13. "matrix" or "grid" → matrix
    14. "number" or "amount" or "quantity" or "age" or "how many" → number
    15. "website" or "url" or "link" → link
    16. "long" or "paragraph" or "describe" or "explain" or "feedback" → long_answer
    17. Default for text questions → short_answer
    """
    user_query = dspy.InputField(desc="User's add component request")
    component_type = dspy.OutputField(desc="Exact component type string from the list above")
    reasoning = dspy.OutputField(desc="Brief explanation of why this type was chosen")


class ComponentSignatureGenerator(dspy.Signature):
    """
    Generate detailed component specifications that the frontend can render.
    
    CRITICAL: Output ONLY valid JSON. NO comments (no // or /* */). NO trailing commas.
    
    FRONTEND CAPABILITIES:
    - Headless UI for modals and interactive components
    - Markdown support in question text and descriptions
    - Inline editing with QuestionEditor component
    - Tally-inspired minimal design with clean typography
    - Purple accent (#9333ea) for focused/selected states
    
    INPUT:
    - component_brief: Brief description from planner
    - component_type: Type of component
    - component_id: Unique identifier
    - form_context: Overall form context
    
    OUTPUT FORMAT (strict JSON, no comments):
    {
        "component_id": "comp_1",
        "question_type": "file_upload",
        "question_text": "Upload your resume/CV",
        "description": "Accepted formats: PDF, DOC, DOCX (max 10MB)",
        "required": true,
        "settings": {
            "file_types": [".pdf", ".doc", ".docx"],
            "max_file_size": 10485760
        }
    }
    
    SETTINGS BY TYPE (include ONLY relevant settings):
    - multiple_choice/checkboxes/dropdown: "choices": ["Option A", "Option B"]
    - number/linear_scale: "min_value": 1, "max_value": 10
    - text inputs: "placeholder": "Enter text here"
    - linear_scale: "scale_min_label": "Low", "scale_max_label": "High"
    - matrix: "rows": ["Row 1"], "columns": ["Col 1"]
    - file_upload: "file_types": [".pdf", ".doc"], "max_file_size": 5242880
    - ranking: "ranking_items": ["Item 1", "Item 2"]
    
    RULES:
    1. **USE USER'S EXACT TERMINOLOGY** - If the brief mentions specific terms (e.g., "Valima", "Nikkah", "Barat"), use those EXACT terms
    2. **DO NOT SUBSTITUTE** cultural, local, or specific terms with generic alternatives
    3. **MATCH COMPONENT TYPE TO DATA** - For multiple selections, use checkboxes; for single selection, use multiple_choice or dropdown
    4. Provide choices exactly as described by user (or 3-5 sensible options if not specified)
    5. Use descriptive labels for scales (e.g., "Not at all" to "Extremely")
    6. Set reasonable limits for numbers and file sizes
    7. Include helpful placeholder text for text inputs
    8. Add description for complex components (matrix, ranking, file uploads)
    9. Include validation rules where appropriate
    10. CRITICAL: rows, columns, and ranking_items MUST be arrays of strings, never integers
    11. Question text and descriptions support markdown (use **bold**, *italic*, lists, etc.)
    12. Keep text clear and conversational - the design is minimal and clean
    13. **KEEP OPTIONS SHORT** - Maximum 8 choices for dropdowns/checkboxes. Do NOT generate exhaustive lists.
    14. **DESCRIPTIONS BRIEF** - Keep descriptions to 1-2 short sentences max. No long explanations.
    13. **GENERATE COMPLETE CHOICES** - Always provide actual choice options, not placeholders like "Option 1", "Option 2"
    
    EXAMPLES OF PRESERVING USER TERMINOLOGY:
    - User says "Valima, Nikkah, Barat" → choices: ["Valima", "Nikkah", "Barat"] (NOT "Reception, Ceremony, etc.")
    - User says "yes/no" → choices: ["Yes", "No"] (NOT "Agree/Disagree" unless asked)
    - User mentions specific names/terms → use them exactly as written
    """
    component_brief = dspy.InputField(desc="Brief description from planner")
    component_type = dspy.InputField(desc="Component type")
    component_id = dspy.InputField(desc="Unique component identifier")
    form_context = dspy.InputField(desc="Overall form context for better component generation")
    component_spec = dspy.OutputField(desc="Complete JSON component specification ready for frontend rendering")


class FormEditorSignature(dspy.Signature):
    """
    Edit an existing form based on user requests.
    
    FRONTEND CAPABILITIES:
    - Headless UI for dialogs and modals
    - Markdown support in all text fields
    - Inline editing with QuestionEditor component
    - Tally-inspired minimal design
    - Purple accent color throughout
    
    INPUT:
    - edit_request: Natural language edit instruction
    - current_form: JSON with form structure INCLUDING component summary at top level
    
    The current_form JSON includes a "component_summary" field like:
    [{"index": 1, "id": 123, "type": "checkboxes", "text": "Which options..."}]
    
    EDIT TYPES:
    1. Add components: Insert new components at appropriate position
    2. Remove components: Delete specified components
    3. Modify components: Change text, type, or settings
    4. Reorder components: Change component sequence
    5. Update form metadata: Change title, description, settings
    6. Update conditional logic: Add/remove/modify rules
    
    HOW TO FIND COMPONENTS:
    - Look at "component_summary" in current_form for quick reference
    - Match user's request to the most relevant component by text similarity or type
    - If user says "the checkbox" find the component with type "checkboxes"
    - If user references by number (e.g., "question 2"), use the index in component_summary
    - If ambiguous, apply edit to the MOST LIKELY matching component
    
    COMPONENT TYPES (for reference):
    - short_answer, long_answer, multiple_choice, checkboxes, dropdown
    - multi_select, number, email, phone, link, file_upload
    - date, time, linear_scale, matrix, rating, payment, signature, ranking
    
    OUTPUT FORMAT (JSON):
    {
        "title": "Updated title",
        "description": "Updated description",
        "components": [
            // Updated components array with component_id, type, settings, etc.
        ],
        "conditional_logic": [
            // Updated conditional logic rules
        ],
        "submit_button_text": "Submit"
    }
    
    RULES:
    1. Preserve existing components unless explicitly asked to change
    2. Maintain component_id consistency
    3. Update conditional logic if component_ids change
    4. Apply changes precisely as requested
    5. Return complete updated form structure
    6. When changing component type, preserve the question_text and adapt settings appropriately
    """
    edit_request = dspy.InputField(desc="User's edit instruction")
    current_form = dspy.InputField(desc="Current form structure as JSON with component_summary for quick reference")
    updated_form = dspy.OutputField(desc="Complete updated form structure as JSON")
    changes_made = dspy.OutputField(desc="Summary of changes applied")


class QuestionEditorSignature(dspy.Signature):
    """
    Edit/regenerate a single question component based on user's edit instructions.
    
    This signature is specifically designed for editing individual questions/components.
    It takes the current component state and user's edit prompt, then generates a new
    component specification that may have a different type and/or updated metadata.
    
    INPUT:
    - current_question_type: The current question type (e.g., "short_answer", "multiple_choice", "checkboxes")
    - current_question_text: Current question text/label
    - current_description: Current description/helper text (if any)
    - current_settings: Current component settings as JSON (choices, validation, etc.)
    - current_required: Whether the question is currently required
    - user_edit_prompt: User's instruction for how to edit the question (e.g., "Make this a long text", "Add more options", "Change to multiple choice")
    - form_context: Context about the form (title, description, other questions)
    
    OUTPUT FORMAT (JSON):
    {
        "question_type": "new_or_same_type",  // Can be same or different type based on user's request
        "question_text": "Updated question text (markdown supported)",
        "description": "Updated description (markdown supported, optional)",
        "required": true/false,
        "settings": {
            // Type-specific settings matching the NEW question_type
            "choices": ["Option 1", "Option 2"],  // For multiple_choice, checkboxes, dropdown
            "min_value": 1,  // For number, linear_scale
            "max_value": 10,
            "placeholder": "Enter text here",  // For text inputs
            "scale_min_label": "Not at all",  // For linear_scale
            "scale_max_label": "Extremely",
            "rows": ["Row 1", "Row 2"],  // For matrix (MUST be array of strings)
            "columns": ["Col 1", "Col 2"],  // For matrix (MUST be array of strings)
            "file_types": [".pdf", ".doc"],  // For file_upload
            "max_file_size": 5242880,  // bytes
            "ranking_items": ["Item 1", "Item 2"]  // For ranking (MUST be array of strings)
        }
    }
    
    QUESTION TYPES (use exact strings):
    - short_answer: Single line text
    - long_answer: Multi-line text
    - multiple_choice: Radio buttons (one selection)
    - checkboxes: Multiple selections
    - dropdown: Select dropdown
    - multi_select: Multi-select dropdown
    - number: Numeric input
    - email: Email validation
    - phone: Phone number
    - link: URL input
    - file_upload: File attachment
    - date: Date picker
    - time: Time picker
    - linear_scale: Scale (1-10)
    - matrix: Grid questions
    - rating: Star rating
    - payment: Payment field
    - signature: Digital signature
    - ranking: Rank items
    - wallet_connect: Web3 wallet
    - button: Custom action button
    
    RULES:
    1. **FOLLOW USER'S EDIT INSTRUCTIONS PRECISELY** - If user says "make this a long text", change type to "long_answer"
    2. **PRESERVE EXISTING DATA WHEN APPROPRIATE** - If user doesn't specify changing type, keep the same type unless it makes sense to change
    3. **UPDATE SETTINGS TO MATCH NEW TYPE** - If type changes, generate appropriate settings for the new type
    4. **PRESERVE USER'S TERMINOLOGY** - Keep exact terms from current question unless user explicitly asks to change them
    5. **GENERATE COMPLETE SETTINGS** - Always provide complete settings for the question type (e.g., all choices for multiple_choice)
    6. **MAINTAIN CONSISTENCY** - Keep question text, description style consistent with form context
    7. **SUPPORT MARKDOWN** - Question text and description support markdown (use **bold**, *italic*, etc.)
    8. **CRITICAL: rows, columns, ranking_items MUST be arrays of strings**, never integers
    9. If user asks to "add more options" or "add choices", expand the choices array
    10. If user asks to change type, ensure settings match the new type requirements
    
    EXAMPLES:
    - User says "Make this a long text" → Change type to "long_answer", remove choices if present
    - User says "Add more options" → Keep type, add more items to choices array
    - User says "Change to multiple choice" → Change type to "multiple_choice", generate appropriate choices
    - User says "Make it required" → Keep everything same, set required=true
    """
    current_question_type = dspy.InputField(desc="Current question type")
    current_question_text = dspy.InputField(desc="Current question text")
    current_description = dspy.InputField(desc="Current description (can be empty)")
    current_settings = dspy.InputField(desc="Current settings as JSON string")
    current_required = dspy.InputField(desc="Whether question is currently required (true/false)")
    user_edit_prompt = dspy.InputField(desc="User's instruction for editing the question")
    form_context = dspy.InputField(desc="Form context (title, description, other questions)")
    question_spec = dspy.OutputField(desc="Complete JSON question specification with potentially new type and metadata")


class ComponentMatcherSignature(dspy.Signature):
    """Match user query to a specific component in the form. Return component_id or null."""
    query = dspy.InputField(desc="user query about a component")
    components = dspy.InputField(desc="JSON: [{'id':'comp_1','type':'short_answer','text':'Question text'},...]")
    component_id = dspy.OutputField(desc="Matching component_id or null if no match")


class FormChatRouterSignature(dspy.Signature):
    """Route user queries for form editing OR response analysis.
    
    ROUTING RULES:
    
    **FORM EDITING:**
    - **add_component**: User wants to ADD a new form component/question/field.
      Keywords: "add", "include", "insert", "create field", "add question"
      Examples: "Add an email field", "Include a phone number question", "Add a rating field"
    
    - **edit_component**: User wants to MODIFY an existing component.
      Keywords: "change", "modify", "update", "edit", "make it", "adjust"
      Examples: "Change the email field to required", "Update the rating scale to 1-5"
    
    **RESPONSE ANALYSIS:**
    - **analyze_responses**: User wants to analyze, summarize, or query form responses/submissions.
      Keywords: "responses", "submissions", "answers", "who answered", "how many", "summarize", "filter", "average", "sentiment", "export"
      Examples: "Summarize my responses", "How many people submitted?", "Show me responses where rating > 3", "What's the average rating?", "Export responses", "What did people say?", "Analyze the feedback"
    
    **OTHER:**
    - **general_query**: General questions about the form structure or capabilities.
      Examples: "What fields are in this form?", "How does conditional logic work?"
    
    - **need_more_clarity**: Query is ambiguous, unclear, or possibly irrelevant.
    
    IMPORTANT: Carefully distinguish between form EDITING and response ANALYSIS.
    """
    user_query = dspy.InputField(desc="The user's query about the form")
    form_context = dspy.InputField(desc="Context about the form structure and response count")
    query_type = dspy.OutputField(desc="One of: 'add_component', 'edit_component', 'analyze_responses', 'general_query', 'need_more_clarity'")
    reasoning = dspy.OutputField(desc="Brief explanation of why this route was chosen")


class GeneralFormQASignature(dspy.Signature):
    """Answer general questions about the form briefly and concisely.
    
    IMPORTANT RULES:
    - Keep answers SHORT - maximum 2-3 sentences
    - Be direct and to the point
    - Do NOT provide long explanations or lists
    - If asked about something unrelated to the form, briefly redirect to form editing
    - NEVER generate long content like lists of items, detailed descriptions, or educational content
    """
    user_query = dspy.InputField(desc="The user's question (max 1000 chars)")
    form_context = dspy.InputField(desc="Current form structure")
    answer = dspy.OutputField(desc="Brief answer in 2-3 sentences MAX. Keep under 500 characters.")


CLARITY_RESPONSE = (
    "I'm sorry, I couldn't understand your request.\n\n"
    "#### Here's what I can help you with:\n"
    "- **Add** a new component or field to your form\n"
    "- **Edit** or **modify** an existing component\n"
    "- **Analyze responses** - summarize, filter, or query submissions\n"
    "- Answer **general questions** about your form\n\n"
    "Please clarify what you'd like to do!"
)

NO_RESPONSES_MESSAGE = (
    "No responses yet! Once people submit your form, I can help you:\n\n"
    "- **Summarize** all responses\n"
    "- **Filter** responses by criteria\n"
    "- **Calculate** statistics (averages, counts, etc.)\n"
    "- **Analyze sentiment** of text answers\n"
    "- **Export** custom data sets\n\n"
    "Share your form to start collecting responses!"
)


class FormChatFunction(dspy.Module):
    """
    Unified chat module for form editing AND response analysis.
    
    Uses GPT-4o-mini for:
    1. Routing queries to appropriate handler
    2. Summarizing results
    3. Deciding whether to use memory
    
    Condition: If response_count == 0, analyze_responses route returns NO_RESPONSES_MESSAGE.
    """
    
    def __init__(self):
        # Form editing signatures
        self.type_detector = dspy.Predict(ComponentTypeDetectorSignature)
        self.add_component = dspy.Predict(ComponentSignatureGenerator)
        self.edit_form = dspy.Predict(FormEditorSignature)
        self.general_qa = dspy.Predict(GeneralFormQASignature)
        
        # Router
        self.router = dspy.Predict(FormChatRouterSignature)
        
        # Response analysis signatures
        self.sql_generator = dspy.Predict(SQLGeneratorSignature)
        self.summarizer = dspy.Predict(ResponseSummarizerSignature)
        
        self.CLARITY_RESPONSE = CLARITY_RESPONSE
        self.NO_RESPONSES_MESSAGE = NO_RESPONSES_MESSAGE
    
    async def aforward(
        self,
        user_query: str,
        form_context: str,
        current_form: dict = None,
        response_count: int = 0,
        chat_history: List[Dict] = None,
        response_data: dict = None
    ) -> dict:
        """
        Unified chat handler for form editing and response analysis.
        
        Args:
            user_query: User's natural language request
            form_context: JSON string of current form structure  
            current_form: Dict of current form structure
            response_count: Number of responses (0 = no analysis)
            chat_history: Previous messages for memory
            response_data: Pre-loaded response data (schema, summary, duckdb conn)
        
        Returns:
            dict with route, response, and metadata
        """
        user_query = user_query[:1000] if len(user_query) > 1000 else user_query
        
        # Build enhanced context with response count
        try:
            context_dict = json.loads(form_context) if isinstance(form_context, str) else (form_context or {})
        except:
            context_dict = {}
        context_dict['response_count'] = response_count
        context_dict['has_responses'] = response_count > 0
        enhanced_context = json.dumps(context_dict)
        
        # === STEP 1: Route using GPT-4o-mini ===
        with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=500, temperature=0.3)):
            route_result = self.router(user_query=user_query, form_context=enhanced_context)
            query_type = route_result.query_type.lower().strip()
            
            # Recheck if unclear
            if 'clarity' in query_type or 'unclear' in query_type:
                route_result = self.router(user_query=user_query, form_context=enhanced_context)
                query_type = route_result.query_type.lower().strip()
        
        result = {
            'route': query_type,
            'reasoning': getattr(route_result, 'reasoning', ''),
            'response': None,
            'data': None,
            'use_memory': False,
            'requires_response_analysis': False
        }
        
        # === STEP 2: Handle based on route ===
        
        # --- RESPONSE ANALYSIS ---
        if 'analyze' in query_type or 'response' in query_type:
            # CONDITION: No responses = no analysis
            if response_count == 0:
                result['response'] = self.NO_RESPONSES_MESSAGE
                result['route'] = 'no_responses'
                return result
            
            result['route'] = 'analyze_responses'
            result['use_memory'] = True
            result['requires_response_analysis'] = True
            
            # VALIDATION: Check if DuckDB data is ready
            if not response_data:
                result['response'] = "Unable to analyze responses - data not loaded. Please try again."
                result['duckdb_ready'] = False
                return result
            
            if not response_data.get('schema_description'):
                result['response'] = "Unable to analyze responses - schema not available. Please try again."
                result['duckdb_ready'] = False
                return result
            
            if not response_data.get('conn'):
                result['response'] = "Unable to analyze responses - database connection not ready. Please try again."
                result['duckdb_ready'] = False
                return result
            
            result['duckdb_ready'] = True
            
            # Response data validated, proceed with analysis
            schema = response_data['schema_description']
            summary = response_data.get('summary', {})
            
            with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1300)):
                # Generate SQL
                sql_result = self.sql_generator(
                    user_query=user_query,
                    schema_description=schema
                )
                result['sql_query'] = sql_result.sql_query
                
                # Summarize
                summary_result = self.summarizer(
                    query_results=json.dumps(summary, default=str),
                    user_query=user_query,
                    schema_description=schema
                )
                result['response'] = summary_result.summary
            
            return result
        
        # --- ADD COMPONENT ---
        if 'add' in query_type:
            result['route'] = 'add_component'
            
            existing_ids = []
            if current_form and 'questions' in current_form:
                existing_ids = [f"comp_{i+1}" for i in range(len(current_form['questions']))]
            
            new_id = f"comp_{len(existing_ids) + 1}"
            
            # First, detect the component type from user query
            with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=200)):
                type_result = self.type_detector(user_query=user_query)
            
            detected_type = getattr(type_result, 'component_type', 'short_answer')
            # Clean up type - ensure it's a valid type string
            valid_types = [
                'short_answer', 'long_answer', 'multiple_choice', 'checkboxes',
                'dropdown', 'multi_select', 'number', 'email', 'phone', 'link',
                'file_upload', 'date', 'time', 'linear_scale', 'matrix', 'rating',
                'payment', 'signature', 'ranking', 'wallet_connect', 'button'
            ]
            detected_type = detected_type.lower().strip().replace(' ', '_')
            if detected_type not in valid_types:
                detected_type = 'short_answer'
            
            logger.info(f"Detected component type: {detected_type} for query: {user_query}")
            
            add_context = json.dumps({
                **context_dict,
                'ORIGINAL_USER_REQUEST': user_query,
                'DETECTED_COMPONENT_TYPE': detected_type,
                'IMPORTANT': 'Use EXACT terms from user. Do NOT substitute cultural terms.'
            })
            
            # Now generate the component with the detected type
            with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1000)):
                component = self.add_component(
                    component_brief=f"{user_query}. Use exact terms from user. Component type MUST be: {detected_type}",
                    component_type=detected_type,
                    component_id=new_id,
                    form_context=add_context
                )
            
            result['response'] = component
            return result
        
        # --- EDIT COMPONENT ---
        if 'edit' in query_type:
            result['route'] = 'edit_component'
            
            if not current_form:
                result['response'] = "No form available to edit."
                return result
            
            # Build component summary and embed it into the form for easy matching
            component_summary = []
            if 'questions' in current_form:
                for idx, q in enumerate(current_form['questions']):
                    component_summary.append({
                        'index': idx + 1,
                        'id': q.get('id', f'comp_{idx+1}'),
                        'type': q.get('question_type', 'unknown'),
                        'text': q.get('question_text', '')[:80],  # Truncate for brevity
                        'required': q.get('required', False)
                    })
            
            # Create form with embedded component summary
            form_with_summary = {
                'component_summary': component_summary,
                **current_form
            }
            
            logger.info(f"Editing form with {len(component_summary)} components")
            
            with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1500)):
                edit_result = self.edit_form(
                    edit_request=user_query,
                    current_form=json.dumps(form_with_summary)
                )
            
            result['response'] = edit_result
            return result
        
        # --- GENERAL QUERY ---
        if 'general' in query_type:
            result['route'] = 'general_query'
            
            with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=500)):
                qa_result = self.general_qa(
                    user_query=user_query,
                    form_context=form_context
                )
            
            answer = getattr(qa_result, 'answer', str(qa_result))
            result['response'] = answer[:1000] if len(answer) > 1000 else answer
            return result
        
        # --- UNCLEAR ---
        result['route'] = 'need_clarity'
        result['response'] = self.CLARITY_RESPONSE
        return result
    
    def summarize_query_results(
        self,
        query_results: List[Dict],
        user_query: str,
        schema_description: str
    ) -> str:
        """Summarize SQL query results in natural language."""
        with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=800)):
            result = self.summarizer(
                query_results=json.dumps(query_results[:50], default=str),
                user_query=user_query,
                schema_description=schema_description
            )
            return result.summary




# ============================================================================
# FORM GENERATION MODULE
# ============================================================================

class FormGenerationModule(dspy.Module):
    """Main module for generating forms from natural language."""
    
    def __init__(self):
        self.planner = dspy.Predict(FormPlannerSignature)
        self.component_generator = dspy.Predict(ComponentSignatureGenerator)
    
    async def aforward(self, user_query: str):
        """
        Generate a complete form from a user query.
        
        Args:
            user_query: Natural language description of the form
        
        Returns:
            dict with complete form structure including components and conditional logic
        """
        # Step 1: Generate form plan with component briefs and conditional logic
        with dspy.context(lm=dspy.LM("openai/gpt-4o-mini", api_key=os.getenv('OPENAI_API_KEY'), max_tokens=2000)):
            plan = self.planner(user_query=user_query)
        
        form_plan = plan.form_plan
        if isinstance(form_plan, str):
            try:
                form_plan = json.loads(form_plan)
            except json.JSONDecodeError:
                logger.error("Failed to parse form plan JSON")
                return {'error': 'Failed to generate form plan'}
        
        logger.info(f"Form plan generated: {form_plan.get('title', 'Untitled')}")
        
        # Step 2: Generate detailed component specifications
        components = form_plan.get('components', [])
        detailed_components = []
        
        # CRITICAL: Include original user_query so components use exact terminology
        form_context = json.dumps({
            'title': form_plan.get('title'),
            'description': form_plan.get('description'),
            'total_components': len(components),
            'ORIGINAL_USER_REQUEST': user_query,  # Pass the exact user request
            'IMPORTANT': 'Use the EXACT terms from ORIGINAL_USER_REQUEST. Do NOT substitute cultural or local terms.'
        })
        
        for comp in components:
            try:
                # Include original user query in component brief for exact terminology
                enhanced_brief = f"{comp.get('brief', '')}. IMPORTANT: Use exact terms from user's original request: '{user_query}'. Do NOT substitute any terms."
                
                with dspy.context(lm=dspy.LM("openai/gpt-4o-mini", api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1000)):
                    component_spec = self.component_generator(
                        component_brief=enhanced_brief,
                        component_type=comp.get('type', 'short_answer'),
                        component_id=comp.get('component_id', f"comp_{len(detailed_components) + 1}"),
                        form_context=form_context
                    )
                
                comp_spec = component_spec.component_spec
                if isinstance(comp_spec, str):
                    try:
                        comp_spec = json.loads(comp_spec)
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse component spec for {comp.get('component_id')}")
                        continue
                
                # Ensure order is preserved
                comp_spec['order'] = comp.get('order', len(detailed_components))
                detailed_components.append(comp_spec)
                
            except Exception as e:
                logger.error(f"Error generating component {comp.get('component_id')}: {e}")
                continue
        
        # Step 3: Build final form structure
        final_form = {
            'title': form_plan.get('title', 'Untitled Form'),
            'description': form_plan.get('description', ''),
            'submit_button_text': form_plan.get('submit_button_text', 'Submit'),
            'components': detailed_components,
            'conditional_logic': form_plan.get('conditional_logic', []),
            'settings': form_plan.get('settings', {})
        }
        
        return final_form


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def validate_form_structure(form_data: dict) -> tuple[bool, str]:
    """
    Validate form structure.
    
    Args:
        form_data: Form dictionary to validate
    
    Returns:
        (is_valid, error_message)
    """
    if not isinstance(form_data, dict):
        return False, "Form data must be a dictionary"
    
    if 'title' not in form_data:
        return False, "Form must have a title"
    
    if 'components' not in form_data or not isinstance(form_data['components'], list):
        return False, "Form must have a components list"
    
    if len(form_data['components']) == 0:
        return False, "Form must have at least one component"
    
    # Validate each component has required fields
    for i, comp in enumerate(form_data['components']):
        if 'component_id' not in comp:
            return False, f"Component {i} missing component_id"
        if 'question_type' not in comp:
            return False, f"Component {comp.get('component_id')} missing question_type"
        if 'question_text' not in comp:
            return False, f"Component {comp.get('component_id')} missing question_text"
    
    return True, ""


def extract_component_ids(form_data: dict) -> list:
    """Extract all component IDs from form structure."""
    if not isinstance(form_data, dict):
        return []
    
    components = form_data.get('components', [])
    return [comp.get('component_id') for comp in components if 'component_id' in comp]


# ============================================================================
# RESPONSE ANALYSIS SIGNATURES
# ============================================================================

class ResponseAnalysisRouterSignature(dspy.Signature):
    """Route user queries for form response analysis.
    
    ROUTING RULES:
    
    - **summary**: User wants an overall summary or overview of responses.
      Keywords: "summarize", "overview", "tell me about", "how many", "total"
      Examples: "Give me a summary of all responses", "How many people responded?"
    
    - **filter**: User wants to filter or search specific responses.
      Keywords: "show", "find", "where", "filter", "which", "list"
      Examples: "Show me responses where rating > 3", "Find responses from last week"
    
    - **aggregate**: User wants statistical aggregations or calculations.
      Keywords: "average", "count", "sum", "max", "min", "distribution", "percentage"
      Examples: "What's the average rating?", "How are responses distributed?"
    
    - **sentiment**: User wants sentiment analysis on text responses.
      Keywords: "sentiment", "positive", "negative", "feedback", "feel", "opinion"
      Examples: "What's the overall sentiment?", "Are responses positive or negative?"
    
    - **export**: User wants to export or download data.
      Keywords: "export", "download", "csv", "file", "save"
      Examples: "Export responses as CSV", "Download filtered results"
    
    - **general**: General questions about the data or clarification needed.
      Examples: "What columns are available?", "Help me understand the data"
    """
    user_query = dspy.InputField(desc="The user's query about form responses")
    schema_description = dspy.InputField(desc="Description of available data columns")
    conversation_history = dspy.InputField(desc="Previous conversation context")
    query_type = dspy.OutputField(desc="One of: 'summary', 'filter', 'aggregate', 'sentiment', 'export', 'general'")
    reasoning = dspy.OutputField(desc="Brief explanation of why this route was chosen")


class SQLGeneratorSignature(dspy.Signature):
    """Generate safe SQL queries for DuckDB based on user requests.
    
    RULES:
    1. Only generate SELECT queries - no INSERT, UPDATE, DELETE, DROP, etc.
    2. Use the exact column names from the schema description
    3. Use DuckDB SQL syntax (similar to PostgreSQL)
    4. For text matching, use ILIKE for case-insensitive search
    5. Always include LIMIT clause (max 100 rows) unless counting/aggregating
    6. Wrap column names in double quotes if they contain special characters
    
    IMPORTANT - QUESTION SHORTCUTS (q1, q2, etc.):
    - The schema includes a SHORTCUTS section mapping q1, q2, etc. to full column names
    - When user says "q1", "q2", "question 1", etc., use the SHORTCUTS to find the actual column name
    - Example: if schema shows 'q1 → "q1_full_name"', use "q1_full_name" in your SQL
    
    IMPORTANT - NUMERIC COLUMNS (rating, number, linear_scale):
    - Values are stored as strings, empty string means NULL
    - ALWAYS filter out empty strings BEFORE casting: WHERE "col" != '' AND "col" IS NOT NULL
    - For AVG/SUM: SELECT AVG(CAST("col" AS FLOAT)) FROM responses WHERE "col" != '' AND "col" IS NOT NULL
    - For comparisons: WHERE "col" != '' AND CAST("col" AS INTEGER) > 3
    
    IMPORTANT - CHECKBOX/MULTI-SELECT COLUMNS:
    - Values are comma-separated strings like "Option A, Option B"
    - For INDIVIDUAL option counts: use LIKE for each option
    - For COMBINATION analysis (Sankey/flow): GROUP BY the entire column to see which combinations are selected together
    - Schema will list available options
    
    IMPORTANT - SINGLE CHOICE (multiple_choice, dropdown):
    - One value per response, use GROUP BY to count
    
    EXAMPLES:
    - "Average of q2" (if q2 → "q2_rating") → SELECT AVG(CAST("q2_rating" AS FLOAT)) as avg_rating FROM responses WHERE "q2_rating" != '' AND "q2_rating" IS NOT NULL
    - "Count ratings" → SELECT "q2_rating" as rating, COUNT(*) as count FROM responses WHERE "q2_rating" != '' GROUP BY "q2_rating" ORDER BY rating
    - "Ratings above 3" → SELECT * FROM responses WHERE "q2_rating" != '' AND CAST("q2_rating" AS INTEGER) > 3 LIMIT 100
    - "Count by satisfaction level" (single choice) → SELECT "q1_satisfaction" as satisfaction, COUNT(*) as count FROM responses WHERE "q1_satisfaction" != '' GROUP BY "q1_satisfaction"
    - "Count individual checkbox options" (for checkbox with options A, B, C) → 
        SELECT 'Option A' as option, COUNT(*) as count FROM responses WHERE "q3_features" ILIKE '%Option A%'
        UNION ALL SELECT 'Option B', COUNT(*) FROM responses WHERE "q3_features" ILIKE '%Option B%'
        UNION ALL SELECT 'Option C', COUNT(*) FROM responses WHERE "q3_features" ILIKE '%Option C%'
    - "Analyze checkbox combinations" or "Show checkbox Sankey" → 
        SELECT "q3_features" as combination, COUNT(*) as count FROM responses WHERE "q3_features" != '' GROUP BY "q3_features" ORDER BY count DESC
    - "Count by status" → SELECT status, COUNT(*) as count FROM responses GROUP BY status
    - "Show all responses" → SELECT * FROM responses LIMIT 100
    """
    user_query = dspy.InputField(desc="Natural language query from user")
    schema_description = dspy.InputField(desc="Table schema with column names, descriptions, QUESTION SHORTCUTS mapping q1/q2 to full column names, and available options for choice fields")
    sql_query = dspy.OutputField(desc="Safe SELECT SQL query for DuckDB, using full column names from SHORTCUTS when user references q1/q2")


class ResponseSummarizerSignature(dspy.Signature):
    """Summarize form response data in natural language.
    
    Create a clear, concise summary that highlights:
    1. Key statistics (total responses, completion rate)
    2. Notable patterns or trends
    3. Most common answers for each question
    4. Any interesting insights
    
    Keep the summary conversational and easy to understand.
    Use bullet points for clarity when listing multiple items.
    """
    query_results = dspy.InputField(desc="JSON data from query execution")
    user_query = dspy.InputField(desc="What the user asked for")
    schema_description = dspy.InputField(desc="Column descriptions for context")
    summary = dspy.OutputField(desc="Natural language summary of the data (max 500 words)")


class ResponseChatModule(dspy.Module):
    """Module for handling response analysis chat interactions."""
    
    def __init__(self):
        self.router = dspy.Predict(ResponseAnalysisRouterSignature)
        self.sql_generator = dspy.Predict(SQLGeneratorSignature)
        self.summarizer = dspy.Predict(ResponseSummarizerSignature)
    
    async def aforward(
        self,
        user_query: str,
        schema_description: str,
        conversation_history: str,
        response_summary: dict = None
    ) -> dict:
        """
        Process a user query about form responses.
        
        Args:
            user_query: User's natural language query
            schema_description: Description of available columns
            conversation_history: Previous conversation context
            response_summary: Pre-computed summary statistics
        
        Returns:
            dict with 'query_type', 'sql_query' (if applicable), 'response'
        """
        # Truncate inputs
        user_query = user_query[:1000] if len(user_query) > 1000 else user_query
        
        with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1000, temperature=0.3)):
            # Route the query
            route_result = self.router(
                user_query=user_query,
                schema_description=schema_description,
                conversation_history=conversation_history
            )
            query_type = route_result.query_type.lower().strip()
            
            result = {
                'query_type': query_type,
                'reasoning': route_result.reasoning,
                'sql_query': None,
                'response': None
            }
            
            if query_type in ['filter', 'aggregate', 'export']:
                # Generate SQL query
                sql_result = self.sql_generator(
                    user_query=user_query,
                    schema_description=schema_description
                )
                result['sql_query'] = sql_result.sql_query
                
            elif query_type == 'summary':
                # Use pre-computed summary if available
                if response_summary:
                    summary_context = json.dumps(response_summary, default=str)
                    summarize_result = self.summarizer(
                        query_results=summary_context,
                        user_query=user_query,
                        schema_description=schema_description
                    )
                    result['response'] = summarize_result.summary
                    
            elif query_type == 'general':
                # Answer general questions about the data
                result['response'] = f"I can help you analyze your form responses. The available data includes: {schema_description}\n\nYou can ask me to:\n- Summarize responses\n- Filter by specific criteria\n- Calculate statistics\n- Analyze sentiment of text answers\n- Export filtered data"
        
        return result
    
    def summarize_results(
        self,
        query_results: list,
        user_query: str,
        schema_description: str
    ) -> str:
        """Summarize query results in natural language."""
        with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=800)):
            result = self.summarizer(
                query_results=json.dumps(query_results[:50], default=str),  # Limit to 50 rows
                user_query=user_query,
                schema_description=schema_description
            )
            return result.summary


# Singleton instance for response chat
response_chat_module = ResponseChatModule()
