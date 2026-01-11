# AutoForm Routing and Validation System

## System Architecture

```
User Query
    ↓
POST /api/forms/generate
    ↓
generate_form_spec()
    ↓
FormGenerationModule.aforward()
    ↓
┌─────────────────────────────────────┐
│ 1. FormPlannerSignature             │
│    - Generates title                │
│    - Generates description          │
│    - Picks component types          │
│    - Creates component briefs       │
│    - Defines conditional logic      │
│    ↓                                │
│ VALIDATION METRIC #1                │
│ ✓ Title present                     │
│ ✓ Components list not empty         │
│ ✓ Each component has ID, type, text │
│ ✓ Question types are valid          │
│ ✓ Conditional logic refs valid IDs  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. ComponentSignatureGenerator      │
│    (For each component)             │
│    - Generates detailed settings    │
│    - Generates validation rules     │
│    - Generates placeholders         │
│    - Generates choices/options      │
│    ↓                                │
│ VALIDATION METRIC #2                │
│ ✓ Settings match question type      │
│ ✓ Required fields present           │
│   (choices, min/max, rows/columns)  │
│ ✓ Defaults applied if missing       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Transform to Database Format     │
│    - Map component_id → question_order│
│    - Map conditional logic indices   │
│    - Structure for database insert   │
│    ↓                                │
│ VALIDATION METRIC #3                │
│ ✓ JSON is serializable              │
│ ✓ Complete closed structure         │
│ ✓ Frontend can render               │
└─────────────────────────────────────┘
    ↓
Database (forms, form_questions, conditional_rules)
    ↓
FormGenerationResponse (JSON)
    ↓
Frontend renders form
```

## Validation Metrics

### Metric #1: Form Plan Validation

**When**: After FormPlannerSignature generates the initial plan

**Validates**:
- ✓ `title` field exists and is not empty
- ✓ `components` field exists and is a list with at least 1 item
- ✓ Each component has `component_id`, `question_type`, `question_text`
- ✓ Each `question_type` is one of the 20 valid types
- ✓ Conditional logic references valid `component_id`s
- ✓ Condition types are valid (equals, not_equals, etc.)
- ✓ Actions are valid (show, hide)

**On Failure**: 
- Logs all validation errors
- Raises exception with error details
- Returns minimal fallback form structure

**Purpose**: Catch malformed AI outputs early before database operations

---

### Metric #2: Component Settings Validation

**When**: For each component after extraction from plan

**Validates**:
- ✓ **multiple_choice/checkboxes/dropdown/multi_select**: Has `choices` array with ≥2 items
- ✓ **linear_scale**: Has `min_value` and `max_value`
- ✓ **matrix**: Has `rows` and `columns` arrays
- ✓ **ranking**: Has `ranking_items` array with ≥2 items
- ✓ **payment**: Has `payment_amount`
- ✓ **file_upload**: Optional file_types and max_file_size

**On Failure**:
- Logs warning with specific errors
- Applies sensible defaults:
  - Choice types → `["Option 1", "Option 2", "Option 3"]`
  - Linear scale → `min_value: 1, max_value: 10`
- Continues processing (graceful degradation)

**Purpose**: Ensure frontend components have required data to render

---

### Metric #3: JSON Serialization Test

**When**: Before returning results to API endpoint

**Validates**:
- ✓ Entire output structure is JSON-serializable
- ✓ No circular references
- ✓ No non-serializable objects (functions, classes, etc.)
- ✓ Complete "closed" structure ready for frontend

**On Failure**:
- Logs serialization error
- Raises exception (cannot send to frontend)

**Purpose**: Guarantee frontend receives valid, renderable JSON

---

## Complete Data Flow

### Input
```json
{
  "user_query": "Create a customer feedback form with rating and comments"
}
```

### After Planner (with Metric #1 validation)
```json
{
  "title": "Customer Feedback Form",
  "description": "Collect customer feedback with ratings and comments",
  "submit_button_text": "Submit Feedback",
  "components": [
    {
      "component_id": "comp_1",
      "type": "short_answer",
      "question_text": "What is your name?",
      "required": true,
      "order": 0
    },
    {
      "component_id": "comp_2",
      "type": "rating",
      "question_text": "How would you rate our service?",
      "required": true,
      "order": 1,
      "settings": {
        "max_value": 5
      }
    },
    {
      "component_id": "comp_3",
      "type": "long_answer",
      "question_text": "Additional comments",
      "required": false,
      "order": 2,
      "settings": {
        "placeholder": "Share your thoughts..."
      }
    }
  ],
  "conditional_logic": []
}
```

### After Component Generation (with Metric #2 validation)
Each component is validated and enhanced with proper settings.

### After Transform (with Metric #3 validation)
```json
{
  "form_data": {
    "title": "Customer Feedback Form",
    "description": "Collect customer feedback with ratings and comments",
    "settings": {
      "background_color": "#ffffff",
      "text_color": "#000000",
      "accent_color": "#9333ea",
      "submit_button_text": "Submit Feedback",
      "show_progress_bar": true
    }
  },
  "questions": [
    {
      "question_order": 0,
      "question_type": "short_answer",
      "question_text": "What is your name?",
      "description": null,
      "required": true,
      "settings": {}
    },
    {
      "question_order": 1,
      "question_type": "rating",
      "question_text": "How would you rate our service?",
      "description": null,
      "required": true,
      "settings": {
        "max_value": 5
      }
    },
    {
      "question_order": 2,
      "question_type": "long_answer",
      "question_text": "Additional comments",
      "description": null,
      "required": false,
      "settings": {
        "placeholder": "Share your thoughts..."
      }
    }
  ],
  "rules": []
}
```

### Database Insert
- Form record created with title, description, settings
- 3 FormQuestion records created with proper order
- 0 ConditionalRule records (no conditional logic in this example)

### API Response
```json
{
  "form": {
    "id": 123,
    "title": "Customer Feedback Form",
    "description": "Collect customer feedback with ratings and comments",
    "user_id": 456,
    "created_at": "2026-01-11T...",
    "updated_at": "2026-01-11T...",
    "questions": [...],
    "conditional_rules": [],
    "settings": {...}
  },
  "message": "Form generated successfully"
}
```

### Frontend Rendering
QuestionRenderer receives each question and routes to appropriate component:
- Question 0 → `ShortAnswer` component
- Question 1 → `Rating` component (with max_value=5 from settings)
- Question 2 → `LongAnswer` component (with placeholder from settings)

---

## Error Handling

### Signature Failure Scenarios

1. **Planner produces invalid JSON**
   - Metric #1 catches missing title/components
   - Exception raised with specific errors
   - Fallback: Minimal form with user query as description

2. **Component settings incomplete**
   - Metric #2 catches missing required settings
   - Defaults applied gracefully
   - Warning logged but processing continues

3. **Non-serializable output**
   - Metric #3 catches before API response
   - Exception raised (better than sending bad data to frontend)
   - User sees error message, can retry

4. **Database insert fails**
   - Transaction rolled back
   - User gets error message
   - No partial data left in database

---

## Logging

Each validation metric logs:

```
✓ Form generation complete: 3 questions, 0 rules
✓ Validation passed: Complete closed JSON ready for frontend
```

Or on error:

```
✗ Form plan validation failed: ['Missing required field: title', 'Components list is empty']
✗ Component 2 settings validation failed: ["Question type 'rating' requires 'max_value' in settings"]
✗ JSON serialization failed: Object of type 'datetime' is not JSON serializable
```

---

## Testing Checklist

- [ ] Valid user query generates complete form
- [ ] Invalid question type is caught by Metric #1
- [ ] Missing choices for dropdown triggers Metric #2 defaults
- [ ] Conditional logic with invalid IDs is caught by Metric #1
- [ ] Non-serializable data is caught by Metric #3
- [ ] Frontend successfully renders all 20 question types
- [ ] Conditional logic shows/hides questions correctly
- [ ] Settings are properly consumed by components

---

## Summary

The routing system ensures:

1. ✅ **User query** → Planner generates complete plan
2. ✅ **Metric #1** validates plan structure
3. ✅ **Component generator** enriches each field
4. ✅ **Metric #2** validates and fixes settings
5. ✅ **Transform** maps to database format
6. ✅ **Metric #3** ensures closed JSON
7. ✅ **Database** persists valid data
8. ✅ **Frontend** receives renderable JSON

All signatures are validated, all outputs are complete, and the frontend always receives properly structured, closed JSON that can be rendered.
