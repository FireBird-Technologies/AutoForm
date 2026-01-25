"""
Form Creator Module
===================

This module integrates with DSPy to generate form structures from natural language queries.
Uses the new FormGenerationModule architecture.
"""

import json
import logging
import os
from typing import Dict, Any, List, Tuple
from .agents import FormGenerationModule, FormChatFunction
import dspy

logger = logging.getLogger(__name__)

# Maximum retries for form generation when validation fails
MAX_GENERATION_RETRIES = 3

# Common AI type mistakes -> correct type mapping
TYPE_CORRECTION_MAP = {
    'text': 'short_answer',
    'textarea': 'long_answer',
    'textbox': 'short_answer',
    'input': 'short_answer',
    'radio': 'multiple_choice',
    'radio_button': 'multiple_choice',
    'radio_buttons': 'multiple_choice',
    'checkbox': 'checkboxes',
    'select': 'dropdown',
    'select_one': 'dropdown',
    'select_multiple': 'multi_select',
    'multiselect': 'multi_select',
    'file': 'file_upload',
    'upload': 'file_upload',
    'scale': 'linear_scale',
    'slider': 'linear_scale',
    'stars': 'rating',
    'star_rating': 'rating',
    'sign': 'signature',
    'rank': 'ranking',
    'order': 'ranking',
    'wallet': 'wallet_connect',
    'web3': 'wallet_connect',
    'url': 'link',
    'website': 'link',
    'tel': 'phone',
    'telephone': 'phone',
    'datetime': 'date',
    'grid': 'matrix',
    'table': 'matrix',
    'numeric': 'number',
    'integer': 'number',
    'float': 'number',
    'submit': 'button',
    'action': 'button',
}


def correct_question_type(question_type: str) -> str:
    """
    Correct common AI mistakes in question type generation.
    
    Args:
        question_type: The question type string from AI
        
    Returns:
        Corrected question type string
    """
    if not question_type:
        return 'short_answer'
    
    # Normalize: lowercase and strip
    normalized = question_type.lower().strip().replace(' ', '_').replace('-', '_')
    
    # Check if it needs correction
    if normalized in TYPE_CORRECTION_MAP:
        corrected = TYPE_CORRECTION_MAP[normalized]
        logger.info(f"Corrected question type '{question_type}' -> '{corrected}'")
        return corrected
    
    return normalized


# Validation metrics for signature outputs
def validate_form_plan(form_result: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate that the form plan from FormPlannerSignature is complete.
    
    Returns:
        tuple: (is_valid, error_messages)
    """
    errors = []
    
    # Check required fields
    if not form_result.get("title"):
        errors.append("Missing required field: title")
    
    if not form_result.get("components"):
        errors.append("Missing required field: components (must have at least one)")
    elif not isinstance(form_result.get("components"), list):
        errors.append("Field 'components' must be a list")
    elif len(form_result.get("components")) == 0:
        errors.append("Components list is empty (must have at least one)")
    
    # Validate each component has required fields
    components = form_result.get("components", [])
    valid_types = [
        "short_answer", "long_answer", "multiple_choice", "checkboxes",
        "dropdown", "multi_select", "number", "email", "phone", "link",
        "file_upload", "date", "time", "linear_scale", "matrix", "rating",
        "payment", "signature", "ranking", "wallet_connect", "button"
    ]
    
    for idx, comp in enumerate(components):
        if not comp.get("component_id"):
            errors.append(f"Component {idx}: missing component_id")
        if not comp.get("question_type"):
            errors.append(f"Component {idx}: missing question_type")
        if not comp.get("question_text"):
            errors.append(f"Component {idx}: missing question_text")
        
        # Auto-correct question type before validation
        original_type = comp.get("question_type", "")
        corrected_type = correct_question_type(original_type)
        
        # Update the component with corrected type
        if corrected_type != original_type:
            comp["question_type"] = corrected_type
            logger.info(f"Auto-corrected component {idx} type: '{original_type}' -> '{corrected_type}'")
        
        # Validate question type (after correction)
        if comp.get("question_type") not in valid_types:
            errors.append(f"Component {idx}: invalid question_type '{comp.get('question_type')}'")
    
    # Validate conditional logic references valid components
    component_ids = {comp.get("component_id") for comp in components}
    conditional_logic = form_result.get("conditional_logic", [])
    
    for idx, rule in enumerate(conditional_logic):
        trigger_id = rule.get("trigger_component_id")
        target_id = rule.get("target_component_id")
        
        if trigger_id not in component_ids:
            errors.append(f"Conditional rule {idx}: invalid trigger_component_id '{trigger_id}'")
        if target_id not in component_ids:
            errors.append(f"Conditional rule {idx}: invalid target_component_id '{target_id}'")
        
        valid_conditions = ["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than", "is_empty", "is_not_empty"]
        if rule.get("condition_type") not in valid_conditions:
            errors.append(f"Conditional rule {idx}: invalid condition_type '{rule.get('condition_type')}'")
        
        if rule.get("action") not in ["show", "hide"]:
            errors.append(f"Conditional rule {idx}: invalid action '{rule.get('action')}'")
    
    is_valid = len(errors) == 0
    return is_valid, errors


def validate_component_settings(question_type: str, settings: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate that component settings match the question type requirements.
    
    Returns:
        tuple: (is_valid, error_messages)
    """
    errors = []
    
    # Check type-specific required settings
    if question_type in ["multiple_choice", "checkboxes", "dropdown", "multi_select"]:
        if not settings.get("choices"):
            errors.append(f"Question type '{question_type}' requires 'choices' in settings")
        elif not isinstance(settings.get("choices"), list) or len(settings.get("choices")) < 2:
            errors.append(f"Question type '{question_type}' requires at least 2 choices")
    
    if question_type == "linear_scale":
        if "min_value" not in settings or "max_value" not in settings:
            errors.append(f"Question type 'linear_scale' requires 'min_value' and 'max_value' in settings")
    
    if question_type == "matrix":
        if not settings.get("rows") or not settings.get("columns"):
            errors.append(f"Question type 'matrix' requires 'rows' and 'columns' in settings")
    
    if question_type == "ranking":
        if not settings.get("ranking_items") or len(settings.get("ranking_items", [])) < 2:
            errors.append(f"Question type 'ranking' requires at least 2 'ranking_items' in settings")
    
    if question_type == "payment":
        if "payment_amount" not in settings:
            errors.append(f"Question type 'payment' requires 'payment_amount' in settings")
    
    is_valid = len(errors) == 0
    return is_valid, errors


async def generate_form_spec(
    user_query: str,
    user_id: int = None
) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generate form specification based on the user's query using FormGenerationModule.
    
    Args:
        user_query: Natural language description of the form needed
        user_id: User ID for context
        
    Returns:
        tuple: (form_data, questions_list, conditional_rules_list)
            - form_data: Dict with title, description, settings
            - questions_list: List of question dicts with type, text, options, etc.
            - conditional_rules_list: List of conditional logic rules
    """
    try:
        # Configure DSPy with OpenAI
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        # Initialize FormGenerationModule
        generator = FormGenerationModule()
        
        # Generate form structure
        logger.info(f"Generating form for query: {user_query}")
        form_result = await generator.aforward(user_query=user_query)
        
        # Check for error in result
        if isinstance(form_result, dict) and 'error' in form_result:
            logger.error(f"Form generation error: {form_result['error']}")
            raise Exception(form_result['error'])
        
        # VALIDATION METRIC: Validate form plan structure (includes auto-correction)
        is_valid, validation_errors = validate_form_plan(form_result)
        
        # If validation fails, try to fix the form using the AI fixer
        if not is_valid:
            logger.warning(f"Form plan validation failed: {validation_errors}")
            logger.info("Attempting to fix form using FormFixerSignature...")
            
            # Use the fixer to correct validation errors
            form_result = await generator.fix_form(
                invalid_form=form_result,
                validation_errors=validation_errors,
                user_query=user_query
            )
            
            # Re-validate after fixing
            is_valid, validation_errors = validate_form_plan(form_result)
            if not is_valid:
                logger.error(f"Form still invalid after fix attempt: {validation_errors}")
                raise Exception(f"Invalid form plan: {'; '.join(validation_errors)}")
            else:
                logger.info("Form successfully fixed by AI fixer")
        
        # Extract form metadata
        form_data = {
            "title": form_result.get("title", "New Form"),
            "description": form_result.get("description", ""),
            "settings": form_result.get("settings", {
                "background_color": "#ffffff",
                "text_color": "#000000",
                "accent_color": "#9333ea",
                "submit_button_text": form_result.get("submit_button_text", "Submit"),
                "show_progress_bar": True
            })
        }
        
        # Transform components to questions_list
        # Components use component_id, but database uses question_order (0-indexed)
        components = form_result.get("components", [])
        questions_list = []
        component_id_to_order = {}  # Map component_id to question_order
        
        for idx, component in enumerate(components):
            component_id = component.get("component_id", f"comp_{idx + 1}")
            component_id_to_order[component_id] = idx
            
            # Map component structure to question structure
            question_type = component.get("question_type", "short_answer")
            settings = component.get("settings", {})
            
            # FIX: Handle AI generating numbers instead of arrays for matrix/ranking
            # THIS MUST HAPPEN BEFORE VALIDATION
            if question_type == "matrix":
                # Ensure settings dict exists
                if not isinstance(settings, dict):
                    settings = {}
                
                # Convert rows: handle int, float, None, or non-list
                rows_value = settings.get("rows")
                if isinstance(rows_value, (int, float)):
                    num_rows = max(1, int(rows_value))
                    settings["rows"] = [f"Row {i+1}" for i in range(num_rows)]
                    logger.info(f"Converted matrix rows from {num_rows} to array of {num_rows} strings")
                elif not isinstance(rows_value, list):
                    settings["rows"] = ["Row 1", "Row 2", "Row 3"]
                    logger.info(f"Set default matrix rows (was: {type(rows_value).__name__})")
                
                # Convert columns: handle int, float, None, or non-list
                columns_value = settings.get("columns")
                if isinstance(columns_value, (int, float)):
                    num_cols = max(1, int(columns_value))
                    settings["columns"] = [f"Column {i+1}" for i in range(num_cols)]
                    logger.info(f"Converted matrix columns from {num_cols} to array of {num_cols} strings")
                elif not isinstance(columns_value, list):
                    settings["columns"] = ["Column 1", "Column 2", "Column 3"]
                    logger.info(f"Set default matrix columns (was: {type(columns_value).__name__})")
            
            if question_type == "ranking":
                # Ensure settings dict exists
                if not isinstance(settings, dict):
                    settings = {}
                
                # Convert ranking_items: handle int, float, None, or non-list
                ranking_value = settings.get("ranking_items")
                if isinstance(ranking_value, (int, float)):
                    num_items = max(2, int(ranking_value))
                    settings["ranking_items"] = [f"Item {i+1}" for i in range(num_items)]
                    logger.info(f"Converted ranking_items from {num_items} to array of {num_items} strings")
                elif not isinstance(ranking_value, list):
                    settings["ranking_items"] = ["Item 1", "Item 2", "Item 3"]
                    logger.info(f"Set default ranking_items (was: {type(ranking_value).__name__})")
            
            # VALIDATION METRIC: Validate component settings
            settings_valid, settings_errors = validate_component_settings(question_type, settings)
            if not settings_valid:
                logger.warning(f"Component {idx} settings validation failed: {settings_errors}")
                # Add defaults for failed settings instead of rejecting
                if question_type in ["multiple_choice", "checkboxes", "dropdown", "multi_select"] and not settings.get("choices"):
                    settings["choices"] = ["Option 1", "Option 2", "Option 3"]
                if question_type == "linear_scale" and ("min_value" not in settings or "max_value" not in settings):
                    settings["min_value"] = 1
                    settings["max_value"] = 10
            
            question_data = {
                "question_order": component.get("order", idx),
                "question_type": question_type,
                "question_text": component.get("question_text", f"Question {idx + 1}"),
                "description": component.get("description"),
                "required": component.get("required", False),
                "settings": settings
            }
            
            # Add validation rules if present
            if "validation_rules" in component:
                question_data["settings"]["validation_rules"] = component["validation_rules"]
            
            questions_list.append(question_data)
        
        # Transform conditional logic: map component_ids to question indices
        conditional_rules = []
        raw_rules = form_result.get("conditional_logic", [])
        
        for rule in raw_rules:
            trigger_id = rule.get("trigger_component_id")
            target_id = rule.get("target_component_id")
            
            # Map component IDs to question indices
            if trigger_id in component_id_to_order and target_id in component_id_to_order:
                conditional_rule = {
                    "trigger_question_index": component_id_to_order[trigger_id],
                    "target_question_index": component_id_to_order[target_id],
                    "condition_type": rule.get("condition_type", "equals"),
                    "condition_value": rule.get("condition_value"),
                    "action": rule.get("action", "show")
                }
                conditional_rules.append(conditional_rule)
            else:
                logger.warning(f"Skipping rule with invalid component IDs: {trigger_id} -> {target_id}")
        
        # VALIDATION METRIC: Ensure output is complete and serializable
        try:
            # Test JSON serialization to ensure frontend can render
            json.dumps({
                "form_data": form_data,
                "questions": questions_list,
                "rules": conditional_rules
            })
            logger.info(f"✓ Form generation complete: {len(questions_list)} questions, {len(conditional_rules)} rules")
            logger.info(f"✓ Validation passed: Complete closed JSON ready for frontend")
        except Exception as e:
            logger.error(f"✗ JSON serialization failed: {e}")
            raise Exception(f"Form generation produced non-serializable output: {e}")
        
        return form_data, questions_list, conditional_rules
        
    except Exception as e:
        logger.error(f"Form generation failed: {e}", exc_info=True)
        # Return minimal valid form structure
        return {
            "title": "New Form",
            "description": user_query,
            "settings": {
                "background_color": "#ffffff",
                "text_color": "#000000",
                "accent_color": "#9333ea",
                "submit_button_text": "Submit",
                "show_progress_bar": True
            }
        }, [], []


async def edit_form_spec(
    current_form: Dict[str, Any],
    edit_request: str,
    user_id: int = None
) -> Dict[str, Any]:
    """
    Edit an existing form based on user request using FormChatFunction.
    
    Args:
        current_form: Current form structure with questions
        edit_request: Natural language edit request
        user_id: User ID for context
        
    Returns:
        dict: Updated form structure or changes to apply
    """
    try:
        # Initialize FormChatFunction
        chat_function = FormChatFunction()
        
        # Prepare form context
        form_context = json.dumps({
            "title": current_form.get("title"),
            "description": current_form.get("description"),
            "components": current_form.get("questions", []),  # Pass as components for consistency
            "settings": current_form.get("settings", {})
        })
        
        # Process chat request
        result = await chat_function.aforward(
            user_query=edit_request,
            form_context=form_context,
            current_form=current_form
        )
        
        # Extract response
        route = result.get('route')
        response = result.get('response')
        
        logger.info(f"Form edit route: {route.query_type if hasattr(route, 'query_type') else 'unknown'}")
        
        return {
            "route": route.query_type if hasattr(route, 'query_type') else 'unknown',
            "response": response,
            "changes_made": getattr(response, 'changes_made', None) if hasattr(response, 'changes_made') else None
        }
            
    except Exception as e:
        logger.error(f"Form edit failed: {e}", exc_info=True)
        return {
            "route": "error",
            "response": str(e),
            "changes_made": None
        }


def validate_question_type(question_type: str) -> bool:
    """Validate that question type is supported"""
    valid_types = [
        "short_answer", "long_answer", "multiple_choice", "checkboxes",
        "dropdown", "multi_select", "number", "email", "phone", "link",
        "file_upload", "date", "time", "linear_scale", "matrix", "rating",
        "payment", "signature", "ranking", "wallet_connect", "button"
    ]
    return question_type in valid_types


def validate_condition_type(condition_type: str) -> bool:
    """Validate that condition type is supported"""
    valid_conditions = [
        "equals", "not_equals", "contains", "not_contains",
        "greater_than", "less_than", "is_empty", "is_not_empty"
    ]
    return condition_type in valid_conditions
