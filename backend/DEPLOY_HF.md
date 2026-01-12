# Deploying AutoForm Backend to Hugging Face Spaces

Follow these steps to deploy your backend to: https://huggingface.co/spaces/FireBird-Tech/autoform-backend

## Step 1: Clone the Hugging Face Space Repository

```bash
# Install Hugging Face CLI if you haven't already
curl -LsSf https://hf.co/cli/install.sh | bash

# Clone the Space repository
# You'll need an access token with write permissions
# Generate one from: https://huggingface.co/settings/tokens
git clone https://huggingface.co/spaces/FireBird-Tech/autoform-backend
cd autoform-backend
```

Or use HTTPS with token:
```bash
git clone https://YOUR_USERNAME:YOUR_TOKEN@huggingface.co/spaces/FireBird-Tech/autoform-backend
cd autoform-backend
```

## Step 2: Copy Your Backend Files

Copy the following files from your local `backend/` directory to the cloned repository:

```bash
# From your project root, copy files to the HF Space directory
cp backend/Dockerfile autoform-backend/
cp backend/requirements.txt autoform-backend/
cp -r backend/app autoform-backend/
cp -r backend/images autoform-backend/
```

Or manually copy:
- `backend/Dockerfile` → `autoform-backend/Dockerfile`
- `backend/requirements.txt` → `autoform-backend/requirements.txt`
- `backend/app/` → `autoform-backend/app/`
- `backend/images/` → `autoform-backend/images/`

## Step 3: Create README.md (Optional but Recommended)

Create a `README.md` file in the Space root:

```markdown
---
title: AutoForm Backend API
emoji: 📝
colorFrom: purple
colorTo: pink
sdk: docker
sdk_version: 4.0.0
app_port: 7860
---

# AutoForm Backend API

FastAPI backend for AutoForm - AI-powered form builder.

## API Endpoints

- `/api/health` - Health check
- `/docs` - Interactive API documentation
- `/api/forms` - Form management endpoints
- `/api/public/forms/{token}` - Public form endpoints

## Environment Variables

Set these in your Space settings:

- `DEFAULT_MODEL` - LLM model to use (e.g., `openai/gpt-4o-mini`)
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `ANTHROPIC_API_KEY` - Anthropic API key (if using Anthropic)
- `GEMINI_API_KEY` - Google Gemini API key (if using Gemini)
- `DATABASE_URL` - Database connection string (default: SQLite)
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `SESSION_SECRET` - Session secret key
```

## Step 4: Configure Environment Variables

1. Go to your Space settings: https://huggingface.co/spaces/FireBird-Tech/autoform-backend/settings
2. Scroll down to "Variables and secrets"
3. Add these environment variables:

```
DEFAULT_MODEL=openai/gpt-4o-mini
OPENAI_API_KEY=your_openai_key
DATABASE_URL=sqlite:///./data/app.db
JWT_SECRET=your-jwt-secret-key-here
FRONTEND_URL=https://your-frontend-url.com
SESSION_SECRET=your-session-secret-here
```

**Note:** Add API keys as **secrets** (they'll be encrypted), and other config as **variables**.

## Step 5: Commit and Push

```bash
cd autoform-backend

# Add all files
git add Dockerfile requirements.txt app/ images/ README.md

# Commit
git commit -m "Add AutoForm backend application"

# Push to Hugging Face
git push
```

## Step 6: Wait for Build

Hugging Face Spaces will automatically:
1. Build your Docker image
2. Deploy the container
3. Start the application

You can monitor the build logs in the Space's "Logs" tab.

## Step 7: Access Your API

Once deployed, your API will be available at:
- **API Base URL**: `https://firebird-tech-autoform-backend.hf.space`
- **API Docs**: `https://firebird-tech-autoform-backend.hf.space/docs`
- **Health Check**: `https://firebird-tech-autoform-backend.hf.space/api/health`

## Troubleshooting

### Build Fails
- Check the "Logs" tab in your Space
- Verify all files were copied correctly
- Ensure `requirements.txt` is valid

### Application Crashes
- Check environment variables are set correctly
- Review application logs in the Space
- Verify database URL format

### Port Issues
- Hugging Face Spaces **must** use port 7860
- The Dockerfile is already configured for this

## Updating the Deployment

To update your deployment:

```bash
cd autoform-backend
# Make changes or copy new files
git add .
git commit -m "Update backend"
git push
```

Hugging Face will automatically rebuild and redeploy.
