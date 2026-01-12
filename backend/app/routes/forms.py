"""
Forms API Routes
================

Routes for form CRUD operations, questions, and conditional logic.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import secrets
from datetime import datetime

from ..core.db import get_db
from ..core.security import get_current_user
from ..models import User, Form, FormQuestion, ConditionalRule, PublicForm, QuestionType, ConditionType
from ..schemas.form import (
    FormCreate, FormUpdate, FormResponse, FormGenerationResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    ConditionalRuleCreate, ConditionalRuleResponse,
    PublicFormCreate, PublicFormResponse,
    ChatMessage, ChatResponse
)
from ..services.form_creator import generate_form_spec, edit_form_spec, validate_question_type, validate_condition_type
from ..services.credit_service import credit_service

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/forms", tags=["forms"])


@router.post("/generate", response_model=FormGenerationResponse)
async def generate_form(
    form_data: FormCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new form from natural language description using AI.
    Costs 5 credits.
    """
    # Check credits
    if not credit_service.check_sufficient_credits(db, current_user.id, 5):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient credits. Please upgrade your plan."
        )
    
    try:
        # Generate form using AI
        form_spec, questions_spec, rules_spec = await generate_form_spec(
            user_query=form_data.user_query,
            user_id=current_user.id
        )
        
        # Create form in database
        new_form = Form(
            user_id=current_user.id,
            title=form_spec.get("title", "New Form"),
            description=form_spec.get("description"),
            settings=form_spec.get("settings", {})
        )
        db.add(new_form)
        db.flush()  # Get form ID
        
        # Create questions
        question_id_map = {}  # Map order to actual ID
        for q_spec in questions_spec:
            # Final safety check: ensure matrix/ranking settings are lists
            settings = q_spec.get("settings", {})
            question_type = q_spec.get("question_type", "")
            
            if question_type == "matrix":
                if isinstance(settings.get("rows"), (int, float)):
                    num_rows = max(1, int(settings["rows"]))
                    settings["rows"] = [f"Row {i+1}" for i in range(num_rows)]
                if isinstance(settings.get("columns"), (int, float)):
                    num_cols = max(1, int(settings["columns"]))
                    settings["columns"] = [f"Column {i+1}" for i in range(num_cols)]
            
            if question_type == "ranking":
                if isinstance(settings.get("ranking_items"), (int, float)):
                    num_items = max(2, int(settings["ranking_items"]))
                    settings["ranking_items"] = [f"Item {i+1}" for i in range(num_items)]
            
            question = FormQuestion(
                form_id=new_form.id,
                question_order=q_spec["question_order"],
                question_type=QuestionType(q_spec["question_type"]),
                question_text=q_spec["question_text"],
                description=q_spec.get("description"),
                required=q_spec.get("required", False),
                settings=settings
            )
            db.add(question)
            db.flush()
            question_id_map[q_spec["question_order"]] = question.id
        
        # Create conditional rules
        for rule_spec in rules_spec:
            trigger_idx = rule_spec.get("trigger_question_index")
            target_idx = rule_spec.get("target_question_index")
            
            if trigger_idx in question_id_map and target_idx in question_id_map:
                rule = ConditionalRule(
                    form_id=new_form.id,
                    trigger_question_id=question_id_map[trigger_idx],
                    target_question_id=question_id_map[target_idx],
                    condition_type=ConditionType(rule_spec.get("condition_type", "equals")),
                    condition_value=rule_spec.get("condition_value"),
                    action=rule_spec.get("action", "show")
                )
                db.add(rule)
        
        db.commit()
        db.refresh(new_form)
        
        # Deduct credits
        credit_service.deduct_credits(
            user_id=current_user.id,
            amount=5,
            description=f"Generated form: {new_form.title}",
            db=db
        )
        
        return FormGenerationResponse(
            form=FormResponse.model_validate(new_form),
            message="Form generated successfully"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Form generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Form generation failed: {str(e)}"
        )


@router.get("", response_model=List[FormResponse])
async def list_forms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    sort: str = "created_at"
):
    """Get all forms for the current user, optionally sorted by created_at or updated_at"""
    query = db.query(Form).filter(Form.user_id == current_user.id)
    
    # Apply sorting
    if sort == "updated_at":
        query = query.order_by(desc(Form.updated_at))
    elif sort == "created_at":
        query = query.order_by(desc(Form.created_at))
    else:
        # Default to created_at if invalid sort parameter
        query = query.order_by(desc(Form.created_at))
    
    forms = query.limit(limit).offset(offset).all()
    
    return [FormResponse.model_validate(form) for form in forms]


@router.get("/{form_id}", response_model=FormResponse)
async def get_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific form with all questions and rules"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    return FormResponse.model_validate(form)


@router.put("/{form_id}", response_model=FormResponse)
async def update_form(
    form_id: int,
    form_update: FormUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update form metadata (title, description, settings)"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Update fields
    if form_update.title is not None:
        form.title = form_update.title
    if form_update.description is not None:
        form.description = form_update.description
    if form_update.settings is not None:
        form.settings = form_update.settings.model_dump()
    
    form.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(form)
    
    return FormResponse.model_validate(form)


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a form and all associated data"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    db.delete(form)
    db.commit()
    
    return None


# Question endpoints
@router.post("/{form_id}/questions", response_model=QuestionResponse)
async def add_question(
    form_id: int,
    question_data: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new question to a form"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    question = FormQuestion(
        form_id=form_id,
        question_order=question_data.question_order,
        question_type=question_data.question_type,
        question_text=question_data.question_text,
        description=question_data.description,
        required=question_data.required,
        settings=question_data.settings.model_dump() if question_data.settings else {}
    )
    
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return QuestionResponse.model_validate(question)


@router.put("/{form_id}/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    form_id: int,
    question_id: int,
    question_update: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a question"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    question = db.query(FormQuestion).filter(
        FormQuestion.id == question_id,
        FormQuestion.form_id == form_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Update fields
    if question_update.question_text is not None:
        question.question_text = question_update.question_text
    if question_update.question_type is not None:
        question.question_type = question_update.question_type
    if question_update.description is not None:
        question.description = question_update.description
    if question_update.required is not None:
        question.required = question_update.required
    if question_update.question_order is not None:
        question.question_order = question_update.question_order
    if question_update.settings is not None:
        question.settings = question_update.settings.model_dump()
    
    question.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(question)
    
    return QuestionResponse.model_validate(question)


@router.delete("/{form_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    form_id: int,
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a question"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    question = db.query(FormQuestion).filter(
        FormQuestion.id == question_id,
        FormQuestion.form_id == form_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    db.delete(question)
    db.commit()
    
    return None


@router.post("/{form_id}/questions/{question_id}/regenerate")
async def regenerate_question(
    form_id: int,
    question_id: int,
    context: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate/edit a question using AI based on user's prompt.
    """
    # Get the form
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Get the question
    question = db.query(FormQuestion).filter(
        FormQuestion.id == question_id,
        FormQuestion.form_id == form_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    try:
        # Get user's edit prompt
        user_prompt = context.get("prompt", context.get("context", "Improve this question"))
        
        # Import the signature for question generation
        from ..services.agents import FormQuestionGeneratorSignature
        import dspy
        
        # Create context for regeneration with user's instructions
        question_context = {
            "brief": f"Edit this question based on user instructions: '{user_prompt}'. Current question: '{question.question_text}'. Current type: {question.question_type}. Current description: '{question.description or 'None'}'",
            "index": question.question_order,
            "form_context": {
                "title": form.title,
                "description": form.description,
                "existing_questions": [q.question_text for q in form.questions if q.id != question_id],
                "user_edit_instructions": user_prompt
            }
        }
        
        # Generate new question spec
        generator = dspy.Predict(FormQuestionGeneratorSignature)
        result = generator(
            question_context=str(question_context),
            form_title=form.title
        )
        
        # Parse and validate the result
        import json
        question_spec = json.loads(result.question_spec)
        
        # Update the question
        question.question_text = question_spec.get("text", question.question_text)
        question.description = question_spec.get("description")
        question.required = question_spec.get("required", question.required)
        
        # Update question type if specified
        if "question_type" in question_spec:
            try:
                question.question_type = QuestionType(question_spec["question_type"])
            except ValueError:
                pass  # Keep existing type if invalid
        
        # Update settings if provided
        if "settings" in question_spec:
            question.settings = question_spec["settings"]
        
        db.commit()
        db.refresh(question)
        
        return {"question": QuestionResponse.model_validate(question), "message": "Question updated successfully"}
        
    except Exception as e:
        logger.error(f"Question regeneration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate question: {str(e)}"
        )


# Conditional logic endpoints
@router.post("/{form_id}/conditional", response_model=ConditionalRuleResponse)
async def add_conditional_rule(
    form_id: int,
    rule_data: ConditionalRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a conditional logic rule"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    rule = ConditionalRule(
        form_id=form_id,
        trigger_question_id=rule_data.trigger_question_id,
        target_question_id=rule_data.target_question_id,
        condition_type=rule_data.condition_type,
        condition_value=rule_data.condition_value,
        action=rule_data.action
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return ConditionalRuleResponse.model_validate(rule)


@router.delete("/{form_id}/conditional/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conditional_rule(
    form_id: int,
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conditional logic rule"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    rule = db.query(ConditionalRule).filter(
        ConditionalRule.id == rule_id,
        ConditionalRule.form_id == form_id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )
    
    db.delete(rule)
    db.commit()
    
    return None


# Public sharing endpoint
@router.post("/{form_id}/share", response_model=PublicFormResponse)
async def share_form(
    form_id: int,
    share_data: PublicFormCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a public shareable link for a form"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    # Check if public form already exists
    existing = db.query(PublicForm).filter(
        PublicForm.form_id == form_id
    ).first()
    
    if existing:
        return PublicFormResponse.model_validate(existing)
    
    # Generate unique share token
    share_token = secrets.token_urlsafe(32)
    
    public_form = PublicForm(
        form_id=form_id,
        user_id=current_user.id,
        share_token=share_token,
        is_public=True,
        expires_at=share_data.expires_at,
        allow_multiple_submissions=share_data.allow_multiple_submissions,
        collect_email=share_data.collect_email,
        custom_thank_you_message=share_data.custom_thank_you_message
    )
    
    db.add(public_form)
    db.commit()
    db.refresh(public_form)
    
    return PublicFormResponse.model_validate(public_form)


@router.get("/{form_id}/share", response_model=PublicFormResponse)
async def get_share_info(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get public share information for a form"""
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    public_form = db.query(PublicForm).filter(
        PublicForm.form_id == form_id
    ).first()
    
    if not public_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form is not shared"
        )
    
    return PublicFormResponse.model_validate(public_form)


# Chat editing endpoint
@router.post("/{form_id}/chat", response_model=ChatResponse)
async def chat_edit_form(
    form_id: int,
    chat_data: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Edit form via natural language chat (add/edit components).
    Uses AI to understand and apply changes to the form.
    """
    from sqlalchemy import func
    import json
    
    # Get the form
    form = db.query(Form).filter(
        Form.id == form_id,
        Form.user_id == current_user.id
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found"
        )
    
    try:
        # Prepare current form structure
        current_form_structure = {
            "title": form.title,
            "description": form.description,
            "questions": [
                {
                    "id": q.id,
                    "question_order": q.question_order,
                    "question_type": q.question_type.value,
                    "question_text": q.question_text,
                    "description": q.description,
                    "required": q.required,
                    "settings": q.settings
                }
                for q in form.questions
            ],
            "settings": form.settings
        }
        
        # Use edit_form_spec to process the chat message
        result = await edit_form_spec(
            current_form=current_form_structure,
            edit_request=chat_data.message,
            user_id=current_user.id
        )
        
        route = result.get("route", "unknown")
        response = result.get("response")
        changes_made = result.get("changes_made")
        
        # If route is add_component, add the new component
        if route == "add_component" and response:
            # Extract component spec from response
            component_spec = None
            if hasattr(response, 'component_spec'):
                try:
                    component_spec = json.loads(response.component_spec) if isinstance(response.component_spec, str) else response.component_spec
                except:
                    component_spec = None
            
            if component_spec:
                # Get the next question order
                max_order = db.query(func.max(FormQuestion.question_order)).filter(
                    FormQuestion.form_id == form_id
                ).scalar() or -1
                
                # Create new question
                new_question = FormQuestion(
                    form_id=form_id,
                    question_order=max_order + 1,
                    question_type=QuestionType(component_spec.get("question_type", "short_answer")),
                    question_text=component_spec.get("question_text", "New Question"),
                    description=component_spec.get("description"),
                    required=component_spec.get("required", False),
                    settings=component_spec.get("settings", {})
                )
                db.add(new_question)
                db.commit()
                db.refresh(new_question)
                
                return ChatResponse(
                    route=route,
                    response={
                        "new_question": QuestionResponse.model_validate(new_question).model_dump(),
                        "message": "Component added successfully"
                    },
                    changes_made=f"Added new {component_spec.get('question_type')} component"
                )
        
        # If route is edit_component, apply changes
        elif route == "edit_component" and response:
            # Extract updated form from response
            updated_form = None
            if hasattr(response, 'updated_form'):
                try:
                    updated_form = json.loads(response.updated_form) if isinstance(response.updated_form, str) else response.updated_form
                except:
                    updated_form = None
            
            if updated_form and "components" in updated_form:
                # Apply updates to existing questions
                for component in updated_form.get("components", []):
                    comp_id = component.get("component_id")
                    if comp_id and comp_id.startswith("comp_"):
                        # Extract order from component_id (e.g., comp_1 -> 0)
                        try:
                            order_idx = int(comp_id.split("_")[1]) - 1
                            question = db.query(FormQuestion).filter(
                                FormQuestion.form_id == form_id,
                                FormQuestion.question_order == order_idx
                            ).first()
                            
                            if question:
                                if "question_text" in component:
                                    question.question_text = component["question_text"]
                                if "question_type" in component:
                                    question.question_type = QuestionType(component["question_type"])
                                if "description" in component:
                                    question.description = component["description"]
                                if "required" in component:
                                    question.required = component["required"]
                                if "settings" in component:
                                    question.settings = component["settings"]
                                
                                question.updated_at = datetime.utcnow()
                        except (ValueError, IndexError):
                            continue
                
                db.commit()
                
                return ChatResponse(
                    route=route,
                    response={
                        "message": "Form updated successfully",
                        "form": FormResponse.model_validate(form).model_dump()
                    },
                    changes_made=changes_made or "Form updated based on your request"
                )
        
        # For general queries or unclear requests, return the response as-is
        response_data = response
        if hasattr(response, 'answer'):
            response_data = {"answer": response.answer}
        elif hasattr(response, 'model_dump'):
            response_data = response.model_dump()
        elif not isinstance(response, dict):
            response_data = {"message": str(response)}
        
        return ChatResponse(
            route=route,
            response=response_data,
            changes_made=changes_made
        )
        
    except Exception as e:
        logger.error(f"Chat edit failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )

