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
            question_data = {
                "question_order": component.get("order", idx),
                "question_type": component.get("question_type", "short_answer"),
                "question_text": component.get("question_text", f"Question {idx + 1}"),
                "description": component.get("description"),
                "required": component.get("required", False),
                "settings": component.get("settings", {})
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
        
        logger.info(f"Form generation complete: {len(questions_list)} questions, {len(conditional_rules)} rules")
        
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
        "payment", "signature", "ranking", "wallet_connect"
    ]
    return question_type in valid_types


def validate_condition_type(condition_type: str) -> bool:
    """Validate that condition type is supported"""
    valid_conditions = [
        "equals", "not_equals", "contains", "not_contains",
        "greater_than", "less_than", "is_empty", "is_not_empty"
    ]
    return condition_type in valid_conditions
