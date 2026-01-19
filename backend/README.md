# AutoForm Backend

FastAPI backend for AutoForm - AI-powered form builder.

## Local Development

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DEFAULT_MODEL=openai/gpt-4o-mini
OPENAI_API_KEY=your_key_here
DATABASE_URL=sqlite:///./app.db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-session-secret
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## DeploymentSee `DEPLOY_HF.md` for instructions on deploying to Hugging Face Spaces.
