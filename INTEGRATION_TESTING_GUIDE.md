# AutoForm Backend/Frontend Integration Testing Guide

## Testing Overview

This guide provides step-by-step testing procedures for the new agent-based form generation system.

## Prerequisites

1. Backend running on `http://localhost:8000`
2. Frontend running on `http://localhost:5173`
3. OpenAI API key configured in `.env`
4. Database initialized with plans

## Test Suite

### 1. Backend Form Generation Tests

#### Test 1.1: Simple Form Generation
```bash
curl -X POST http://localhost:8000/api/forms/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_query": "Create a contact form with name, email, and message"
  }'
```

**Expected Result:**
- Status: 200 OK
- Response contains form with 3 questions
- Question types: short_answer, email, long_answer
- All questions have proper settings

#### Test 1.2: Complex Form with Conditional Logic
```bash
curl -X POST http://localhost:8000/api/forms/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_query": "Create a job application form with personal info, and show experience questions only if they have prior experience"
  }'
```

**Expected Result:**
- Status: 200 OK
- Form includes conditional_rules array
- Rules reference correct question indices
- Conditional logic shows/hides based on answers

#### Test 1.3: Form with Multiple Question Types
```bash
curl -X POST http://localhost:8000/api/forms/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_query": "Create an event registration form with name, email, date picker, dietary preferences dropdown, and rating scale for interest level"
  }'
```

**Expected Result:**
- Status: 200 OK
- Mix of question types: short_answer, email, date, dropdown, linear_scale
- Each question has appropriate settings (choices for dropdown, min/max for scale)

### 2. Chat Endpoint Tests

#### Test 2.1: Add Component
```bash
curl -X POST http://localhost:8000/api/forms/{form_id}/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Add a phone number field"
  }'
```

**Expected Result:**
- Status: 200 OK
- Route: "add_component"
- New question added to form
- Question type: "phone"

#### Test 2.2: Edit Component
```bash
curl -X POST http://localhost:8000/api/forms/{form_id}/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Make the email field required"
  }'
```

**Expected Result:**
- Status: 200 OK
- Route: "edit_component"
- Email question updated with required: true
- changes_made describes the update

#### Test 2.3: General Query
```bash
curl -X POST http://localhost:8000/api/forms/{form_id}/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "What fields are in this form?"
  }'
```

**Expected Result:**
- Status: 200 OK
- Route: "general_form_query"
- Response contains answer describing form fields

#### Test 2.4: Unclear Request
```bash
curl -X POST http://localhost:8000/api/forms/{form_id}/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "xyz"
  }'
```

**Expected Result:**
- Status: 200 OK
- Route: "need_more_clarity"
- Response contains clarification message

### 3. Frontend Component Rendering Tests

#### Test 3.1: All Question Types Render
1. Generate a form with all 20 question types
2. Navigate to `/build`
3. Verify each component renders without errors
4. Check that settings are properly displayed

**Question Types to Test:**
- short_answer, long_answer
- multiple_choice, checkboxes, dropdown, multi_select
- number, email, phone, link
- file_upload, date, time
- linear_scale, matrix, rating
- payment, signature, ranking, wallet_connect

#### Test 3.2: Settings Consumption
For each component type, verify:
- Dropdown shows all choices from settings.choices
- LinearScale displays min/max labels from settings
- FileUpload respects file_types and max_file_size
- Matrix displays rows and columns from settings
- Ranking shows ranking_items from settings

#### Test 3.3: Required Field Validation
1. Generate form with required fields
2. Try to submit without filling required fields
3. Verify validation errors appear
4. Fill required fields and verify submission succeeds

### 4. Conditional Logic Tests

#### Test 4.1: Show/Hide Logic
1. Generate form with conditional logic (e.g., "Show experience section if user has prior experience")
2. Verify target questions are hidden initially
3. Trigger condition (select "Yes" for prior experience)
4. Verify target questions appear
5. Change answer back
6. Verify target questions hide again

#### Test 4.2: Multiple Conditions
1. Generate form with multiple conditional rules
2. Test each rule independently
3. Test rules together (cascading conditions)
4. Verify no conflicts or errors

### 5. End-to-End Tests

#### Test 5.1: Complete Form Lifecycle
1. **Generate**: Create form via `/api/forms/generate`
2. **Edit**: Add/modify fields via `/api/forms/{id}/chat`
3. **Share**: Create public link via `/api/forms/{id}/share`
4. **Submit**: Submit response via `/api/responses/submit`
5. **Export**: Download responses via `/api/forms/{id}/export`

#### Test 5.2: Multi-User Scenario
1. User A creates form
2. User A shares form (gets public token)
3. User B (unauthenticated) accesses `/public-form/{token}`
4. User B submits response
5. User A views responses in dashboard
6. User A exports responses

### 6. Error Handling Tests

#### Test 6.1: Invalid Question Type
Generate form with invalid question type in manual edit:
```bash
curl -X PUT http://localhost:8000/api/forms/{form_id}/questions/{question_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_type": "invalid_type"
  }'
```

**Expected Result:**
- Status: 422 Unprocessable Entity
- Error message about invalid question type

#### Test 6.2: Missing Required Settings
Try to create LinearScale without min/max values:
- Verify backend provides defaults
- Verify frontend renders with defaults

#### Test 6.3: OpenAI API Failure
1. Temporarily set invalid OPENAI_API_KEY
2. Try to generate form
3. Verify graceful error handling
4. Verify user-friendly error message

### 7. Performance Tests

#### Test 7.1: Form Generation Speed
- Measure time to generate simple form (3 questions)
- Measure time to generate complex form (15 questions)
- Target: < 10 seconds for complex forms

#### Test 7.2: Chat Response Speed
- Measure time for add_component request
- Measure time for edit_component request
- Target: < 5 seconds per request

## Success Criteria

### Backend
- ✅ Form generation works with new agents (no import errors)
- ✅ All 20 question types can be generated
- ✅ Conditional logic is properly generated and stored
- ✅ Chat endpoint routes correctly (add/edit/general/clarity)
- ✅ Database operations succeed (create/update/delete)

### Frontend
- ✅ All 20 question types render without errors
- ✅ Settings are properly consumed from question.settings
- ✅ Conditional logic shows/hides questions correctly
- ✅ Form submission captures all answer types
- ✅ Public form view works for unauthenticated users

### Integration
- ✅ Backend JSON structure matches frontend expectations
- ✅ No type mismatches or parsing errors
- ✅ Conditional logic works end-to-end
- ✅ Chat edits persist to database and reflect in UI
- ✅ Export includes all response data

## Known Limitations

1. **File Upload**: Frontend stores file locally (URL.createObjectURL), not uploaded to server
2. **Payment**: Mock implementation, no real payment processing
3. **Wallet Connect**: Requires Web3 provider to be configured
4. **Signature**: Stored as base64 string, no verification

## Debugging Tips

### Backend Errors
```bash
# Check backend logs
cd backend
python -m uvicorn app.main:app --reload --log-level debug

# Test specific agent
python -c "from app.services.agents import FormGenerationModule; import asyncio; asyncio.run(FormGenerationModule().aforward('test query'))"
```

### Frontend Errors
```bash
# Check browser console for errors
# Open DevTools → Console

# Check network requests
# Open DevTools → Network → Filter by /api/

# Verify component props
# Add console.log in QuestionRenderer.tsx
```

### Database Issues
```bash
# Check database contents
sqlite3 backend/app.db
.tables
SELECT * FROM forms;
SELECT * FROM form_questions;
SELECT * FROM conditional_rules;
```

## Rollback Plan

If critical issues are found:

1. **Backend**: Revert `form_creator.py` to use old signatures
2. **Frontend**: No changes needed (already compatible)
3. **Database**: No migrations needed (schema unchanged)

## Next Steps After Testing

1. Monitor OpenAI API usage and costs
2. Optimize agent prompts based on output quality
3. Add caching for common form patterns
4. Implement rate limiting on chat endpoint
5. Add telemetry for agent performance tracking
