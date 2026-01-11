"""
DSPy-based Form Generation System
==================================

This module uses DSPy to generate forms from natural language queries.
It includes a multi-stage pipeline:
1. Planner: Converts user query to form plan with components
2. Component Signature: Generates renderable form components with metadata
3. Conditional Logic: Defines relationships between components
"""

import dspy
import json
import logging
import os
from typing import Dict, Any, List, Optional

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
    
    CONDITIONAL LOGIC RULES:
    - condition_type: equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty
    - action: show, hide
    
    GUIDELINES:
    1. Choose appropriate component types based on the data being collected
    2. Mark essential components as required
    3. Order components logically (general to specific)
    4. Include 3-15 components typically
    5. Add conditional logic where it makes sense (e.g., show follow-up based on previous answer)
    6. Generate component_ids like "comp_1", "comp_2", etc.
    """
    user_query = dspy.InputField(desc="Natural language description of the form needed")
    form_plan = dspy.OutputField(desc="JSON form plan with title, description, components list, and conditional_logic")


class ComponentSignatureGenerator(dspy.Signature):
    """
    Generate detailed component specifications that the frontend can render.
    
    INPUT:
    - component_brief: Brief description from planner
    - component_type: Type of component
    - component_id: Unique identifier
    - form_context: Overall form context
    
    OUTPUT FORMAT (JSON):
    {
        "component_id": "comp_1",
        "question_type": "type from list",
        "question_text": "Clear question text",
        "description": "Optional helper text",
        "required": true/false,
        "settings": {
            // Type-specific settings
            "choices": ["Option 1", "Option 2"],  // For multiple_choice, checkboxes, dropdown
            "min_value": 1,  // For number, linear_scale
            "max_value": 10,
            "placeholder": "Enter text here",  // For text inputs
            "scale_min_label": "Not at all",  // For linear_scale
            "scale_max_label": "Extremely",
            "rows": ["Row 1", "Row 2"],  // For matrix
            "columns": ["Col 1", "Col 2"],
            "file_types": [".pdf", ".doc"],  // For file_upload
            "max_file_size": 5242880,  // bytes
            "ranking_items": ["Item 1", "Item 2"]  // For ranking
        },
        "validation_rules": {
            "min_length": 5,  // For text inputs
            "max_length": 100,
            "pattern": "regex_pattern",  // For custom validation
            "error_message": "Custom error message"
        }
    }
    
    RULES:
    1. Provide 3-5 choices for multiple_choice/checkboxes/dropdown
    2. Use descriptive labels for scales
    3. Set reasonable limits for numbers and file sizes
    4. Include helpful placeholder text
    5. Add description for complex components
    6. Include validation rules where appropriate
    """
    component_brief = dspy.InputField(desc="Brief description from planner")
    component_type = dspy.InputField(desc="Component type")
    component_id = dspy.InputField(desc="Unique component identifier")
    form_context = dspy.InputField(desc="Overall form context for better component generation")
    component_spec = dspy.OutputField(desc="Complete JSON component specification ready for frontend rendering")


class FormEditorSignature(dspy.Signature):
    """
    Edit an existing form based on user requests.
    
    INPUT:
    - edit_request: Natural language edit instruction
    - current_form: JSON of current form structure
    
    EDIT TYPES:
    1. Add components: Insert new components at appropriate position
    2. Remove components: Delete specified components
    3. Modify components: Change text, type, or settings
    4. Reorder components: Change component sequence
    5. Update form metadata: Change title, description, settings
    6. Update conditional logic: Add/remove/modify rules
    
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
    """
    edit_request = dspy.InputField(desc="User's edit instruction")
    current_form = dspy.InputField(desc="Current form structure as JSON")
    updated_form = dspy.OutputField(desc="Complete updated form structure as JSON")
    changes_made = dspy.OutputField(desc="Summary of changes applied")


class ComponentMatcherSignature(dspy.Signature):
    """Match user query to a specific component in the form. Return component_id or null."""
    query = dspy.InputField(desc="user query about a component")
    components = dspy.InputField(desc="JSON: [{'id':'comp_1','type':'short_answer','text':'Question text'},...]")
    component_id = dspy.OutputField(desc="Matching component_id or null if no match")


class FormChatRouterSignature(dspy.Signature):
    """Route user queries for form editing/addition ONLY.
    
    ROUTING RULES:
    
    - **add_component**: User wants to ADD a new form component/question/field.
      Keywords: "add", "include", "insert", "create field", "add question"
      Examples: "Add an email field", "Include a phone number question", "Add a rating field"
    
    - **edit_component**: User wants to MODIFY an existing component.
      Keywords: "change", "modify", "update", "edit", "make it", "adjust"
      Examples: "Change the email field to required", "Update the rating scale to 1-5"
    
    - **general_form_query**: General questions about the form structure or capabilities.
      Examples: "What fields are in this form?", "How does conditional logic work?"
    
    - **need_more_clarity**: Query is ambiguous or unclear.
    
    IMPORTANT: This router is ONLY for form editing/building. NO data analysis.
    """
    user_query = dspy.InputField(desc="The user's query about the form")
    form_context = dspy.InputField(desc="Context about the form structure")
    query_type = dspy.OutputField(desc="One of: 'add_component', 'edit_component', 'general_form_query', 'need_more_clarity'")
    reasoning = dspy.OutputField(desc="Brief explanation of why this route was chosen")


CLARITY_RESPONSE = (
    "I'm sorry, I couldn't understand your request.\n\n"
    "#### Here's what I can help you with:\n"
    "- **Add** a new component or field to your form\n"
    "- **Edit** or **modify** an existing component\n"
    "- Answer **general questions** about your form\n\n"
    "Please clarify what you'd like to do, or ask for help with one of the options above!"
)


class FormChatFunction(dspy.Module):
    """Chat functionality for form editing - ONLY add or edit components."""
    
    def __init__(self):
        self.add_component_mod = dspy.Predict(ComponentSignatureGenerator)
        self.edit_form_mod = dspy.Predict(FormEditorSignature)
        self.general_qa = dspy.Predict("user_query, form_context -> answer")
        self.router = dspy.Predict(FormChatRouterSignature)
        self.recheck_router = dspy.Predict(FormChatRouterSignature)
        self.CLARITY_RESPONSE = CLARITY_RESPONSE
    
    async def aforward(self, user_query: str, form_context: str, current_form: dict = None):
        """
        Handle user queries for form editing/addition.
        
        Args:
            user_query: User's natural language request
            form_context: JSON string of current form structure
            current_form: Dict of current form structure (optional)
        
        Returns:
            dict with 'route' and 'response' keys
        """
        with dspy.context(lm=dspy.LM('openai/gpt-4o-mini', api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1500, temperature=1)):
            route = self.router(user_query=user_query, form_context=form_context)
            query_type = route.query_type
            
            # If unclear, try recheck router
            if 'need_more_clarity' in query_type:
                recheck = self.recheck_router(user_query=user_query, form_context=form_context)
                if 'need_more_clarity' not in recheck.query_type:
                    query_type = recheck.query_type
        
        if 'add_component' in query_type:
            # Extract component details from query
            # Generate a new component_id
            existing_ids = []
            if current_form and 'components' in current_form:
                existing_ids = [c.get('component_id', '') for c in current_form.get('components', [])]
            
            new_id = f"comp_{len(existing_ids) + 1}"
            
            response = self.add_component_mod(
                component_brief=user_query,
                component_type="short_answer",  # Default, will be inferred
                component_id=new_id,
                form_context=form_context
            )
        elif 'edit_component' in query_type:
            if current_form:
                response = self.edit_form_mod(
                    edit_request=user_query,
                    current_form=json.dumps(current_form)
                )
            else:
                response = "No form available to edit."
        elif 'general_form_query' in query_type:
            response = self.general_qa(user_query=user_query, form_context=form_context)
        elif 'need_more_clarity' in query_type:
            response = self.CLARITY_RESPONSE
        else:
            response = self.general_qa(user_query=user_query, form_context=form_context)
        
        route.query_type = query_type
        return_dict = {'route': route, 'response': response}
        
        return return_dict


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
        
        form_context = json.dumps({
            'title': form_plan.get('title'),
            'description': form_plan.get('description'),
            'total_components': len(components)
        })
        
        for comp in components:
            try:
                with dspy.context(lm=dspy.LM("openai/gpt-4o-mini", api_key=os.getenv('OPENAI_API_KEY'), max_tokens=1000)):
                    component_spec = self.component_generator(
                        component_brief=comp.get('brief', ''),
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
