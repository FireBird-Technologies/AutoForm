# Deploying to Hugging Face Spaces - Correct Method

## The Problem

Hugging Face Spaces rejects binary files and development files like:
- `.venv/` (virtual environment)
- `node_modules/`
- Database files (`.db`, `.sqlite`)
- User-uploaded images

## Solution: Copy Only Required Files

**Don't push your entire backend directory!** Only copy the files needed for deployment.

## Step-by-Step Instructions

### 1. Clone the Space Repository

```bash
git clone https://huggingface.co/spaces/FireBird-Tech/autoform-backend
cd autoform-backend
```

### 2. Copy ONLY Required Files

Copy only these files (NOT the entire backend directory):

```bash
# From your project root
cd autoform-backend

# Copy Dockerfile
cp ../backend/Dockerfile .

# Copy requirements
cp ../backend/requirements.txt .

# Copy application code (this excludes venv, db files, etc.)
cp -r ../backend/app .

# Copy ONLY logo images (not user-uploaded content)
mkdir -p images
cp ../backend/images/AutoForm.png images/
cp ../backend/images/AutoForm.svg images/
cp ../backend/images/favicon.png images/
```

### 3. Create README.md

Create `README.md` in the Space root:

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

FastAPI backend for AutoForm.
```

### 4. Verify Files

Make sure you DON'T have:
- ❌ `.venv/` directory
- ❌ `venv/` directory
- ❌ `node_modules/` directory
- ❌ `*.db` files
- ❌ `chat.db`
- ❌ User-uploaded images (keep only logos)

You SHOULD have:
- ✅ `Dockerfile`
- ✅ `requirements.txt`
- ✅ `app/` directory (with Python code)
- ✅ `images/` directory (with only logo files)
- ✅ `README.md`

### 5. Commit and Push

```bash
git add Dockerfile requirements.txt app/ images/ README.md
git commit -m "Add AutoForm backend"
git push
```

## What Files to Include

**Include:**
- `Dockerfile`
- `requirements.txt`
- `app/` directory (all Python source files)
- `images/AutoForm.png`
- `images/AutoForm.svg`
- `images/favicon.png`

**Exclude:**
- `.venv/` or `venv/`
- `node_modules/`
- `*.db` files
- `chat.db`
- User-uploaded images (anything in `images/` that's not a logo)
- `__pycache__/` directories
- `.env` files

## Quick Copy Script

Create a script to copy only the right files:

```bash
#!/bin/bash
# copy_to_hf.sh

HF_DIR="../autoform-backend"  # Adjust path as needed

# Copy essential files
cp Dockerfile "$HF_DIR/"
cp requirements.txt "$HF_DIR/"
cp -r app "$HF_DIR/"

# Copy only logo images
mkdir -p "$HF_DIR/images"
cp images/AutoForm.png "$HF_DIR/images/"
cp images/AutoForm.svg "$HF_DIR/images/"
cp images/favicon.png "$HF_DIR/images/"

echo "Files copied successfully!"
```
