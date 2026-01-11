# AutoForm - AI-Powered Form Builder

Transform form creation with AI. Describe your form in plain English, and AutoForm generates a complete, intelligent form with conditional logic, 19 question types, and response management.

## 🚀 Features

### AI Form Generation
- **Natural Language Input**: "Create a customer feedback form with rating and comments"
- **Smart Question Types**: AI selects appropriate question types automatically
- **Conditional Logic**: AI suggests show/hide rules based on form structure
- **Instant Generation**: Complete forms in seconds

### 19 Question Types
1. **Short Answer** - Single line text input
2. **Long Answer** - Multi-line textarea
3. **Multiple Choice** - Radio button selection
4. **Checkboxes** - Multiple selections
5. **Dropdown** - Select menu
6. **Multi-Select** - Multiple dropdown selections
7. **Number** - Numeric input with validation
8. **Email** - Email validation
9. **Phone** - Phone number input
10. **Link** - URL validation
11. **File Upload** - File attachments
12. **Date** - Date picker
13. **Time** - Time picker
14. **Linear Scale** - Rating scale (1-10)
15. **Matrix** - Grid questions
16. **Rating** - Star rating
17. **Payment** - Payment integration
18. **Signature** - Digital signature
19. **Ranking** - Drag-to-rank items
20. **Wallet Connect** - Web3 wallet connection

### Conditional Logic
- Show/hide questions based on answers
- 8 condition types (equals, contains, is_empty, etc.)
- Real-time evaluation
- AI-generated rules

### Response Management
- Store unlimited responses
- View individual submissions
- Export to CSV or JSON
- Response analytics
- Delete responses

### Public Sharing
- Generate unique share links
- No authentication required for submissions
- Custom thank you messages
- Expiration dates
- Control multiple submissions

## 🎨 Design

Clean, modern interface with:
- **White** backgrounds for clarity
- **Black** text for readability
- **Purple** (#9333ea) accents for actions
- Responsive design
- Accessible components

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database management
- **DSPy** - AI form generation with LLMs
- **PostgreSQL/SQLite** - Database
- **Pydantic** - Data validation

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **CSS** - Styling

### AI/ML
- **OpenAI GPT-4** - Form generation
- **DSPy** - Structured LLM outputs
- **Natural Language Processing** - Query understanding

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your API keys to .env
OPENAI_API_KEY=your_key_here
DATABASE_URL=sqlite:///./chat.db

# Run migrations
python -m alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add backend URL
VITE_BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

## 🚀 Quick Start

1. **Start the backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

4. **Create your first form**:
   - Sign in with Google
   - Click "Create Forms for free"
   - Describe your form: "Create a customer satisfaction survey with rating and feedback"
   - Click "Generate Form"
   - Preview and share!

## 📖 Usage Examples

### Example 1: Customer Feedback Form
```
Create a customer feedback form with:
- Overall satisfaction rating (1-5 stars)
- What did you like most? (long answer)
- What could we improve? (long answer)
- Would you recommend us? (Yes/No)
- If no, why not? (conditional question)
```

### Example 2: Event Registration
```
Generate an event registration form with:
- Full name
- Email address
- Phone number
- Number of attendees
- Dietary restrictions (checkboxes)
- Special requirements (optional text)
```

### Example 3: Job Application
```
Build a job application form including:
- Personal information (name, email, phone)
- Resume upload
- Cover letter (long text)
- Years of experience (number)
- Salary expectations (number)
- Availability date (date picker)
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:///./chat.db

# AI/ML
OPENAI_API_KEY=your_openai_key
DEFAULT_MODEL=openai/gpt-4o-mini

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google/callback

# Session
SESSION_SECRET=your_secret_key
SESSION_HTTPS_ONLY=0

# Stripe (optional)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:8000
```

## 📊 API Documentation

### Form Generation
```http
POST /api/forms/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "user_query": "Create a customer feedback form with rating and comments"
}
```

### Public Form Submission
```http
POST /api/public/forms/{token}/submit
Content-Type: application/json

{
  "answers": [
    {
      "question_id": 1,
      "answer_value": {
        "text": "Great service!"
      }
    }
  ]
}
```

### Export Responses
```http
GET /api/forms/{form_id}/responses/export/csv
Authorization: Bearer {token}
```

Full API documentation available at `http://localhost:8000/docs` when running the backend.

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- AI form generation
- 19 question types
- Conditional logic
- Response storage
- Public sharing
- Export functionality

### Phase 2 (Planned)
- [ ] Visual conditional logic editor
- [ ] Form templates library
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] Webhook integrations

### Phase 3 (Future)
- [ ] Multi-page forms
- [ ] A/B testing
- [ ] Payment processing
- [ ] File upload to cloud
- [ ] Mobile app

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- DSPy for structured LLM outputs
- FastAPI and React communities
- All contributors and users

## 📧 Support

- **Documentation**: See AUTOFORM_IMPLEMENTATION_SUMMARY.md
- **Issues**: GitHub Issues
- **Email**: support@autoform.dev (placeholder)

## 🔐 Security

- Authentication via Google OAuth
- Secure session management
- SQL injection protection
- XSS prevention
- CORS configuration
- Rate limiting (recommended for production)

## 🌟 Star History

If you find this project useful, please consider giving it a star on GitHub!

---

**Built with ❤️ using AI**

