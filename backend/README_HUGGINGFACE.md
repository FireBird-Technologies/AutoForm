# AutoForm Backend on Hugging Face Spaces

This Dockerfile allows you to deploy the AutoForm backend API on Hugging Face Spaces.

## Setup Instructions

1. **Create a new Space on Hugging Face**
   - Go to https://huggingface.co/spaces
   - Create a new Space
   - Select **Docker** as the SDK

2. **Configure Environment Variables**
   
   In your Space settings, add these secrets/environment variables:
   
   ```
   DEFAULT_MODEL=openai/gpt-4o-mini  # or anthropic/claude-3-5-sonnet-20241022, etc.
   OPENAI_API_KEY=your_key_here       # if using OpenAI
   ANTHROPIC_API_KEY=your_key_here    # if using Anthropic
   GEMINI_API_KEY=your_key_here       # if using Google Gemini
   DATABASE_URL=sqlite:///./data/app.db
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=https://your-frontend-url.com
   SESSION_SECRET=your-session-secret-here
   ```

3. **Upload Files**
   
   Upload the following files to your Space:
   - `Dockerfile` (this file should be in the root)
   - `requirements.txt`
   - `app/` directory (entire directory)
   - `images/` directory (entire directory)

4. **Build and Deploy**
   
   Hugging Face Spaces will automatically build and deploy your Docker container.

## Port Configuration

Hugging Face Spaces automatically sets the `PORT` environment variable. The Dockerfile is configured to use port 7860 by default, which is the standard port for Hugging Face Spaces.

## Database

By default, the app uses SQLite stored in `/app/data/app.db`. For production, you may want to use PostgreSQL by setting the `DATABASE_URL` environment variable.

## Health Check

The container includes a health check endpoint at `/api/health` that Hugging Face Spaces can use to monitor your application.

## API Documentation

Once deployed, you can access:
- API docs: `https://your-space.hf.space/docs`
- Health check: `https://your-space.hf.space/api/health`

## Notes

- The application runs on port 7860 (Hugging Face standard)
- Database migrations run automatically on startup (`AUTO_MIGRATE=1`)
- CORS is configured based on the `FRONTEND_URL` environment variable
- All logs are output to stdout/stderr for Hugging Face monitoring
