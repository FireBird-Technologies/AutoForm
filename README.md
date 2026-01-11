<div align="center">
  <img src="frontend/public/logo.svg" alt="Logo" width="300" />
  
  <h1>AutoForm</h1>
  <p><strong>Your AI Form Builder</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Open%20Source-purple?style=flat-square" alt="Open Source" />
    <img src="https://img.shields.io/badge/AI-Powered-blue?style=flat-square" alt="AI Powered" />
    <img src="https://img.shields.io/badge/No%20Code-green?style=flat-square" alt="No Code" />
  </p>

  <p>
    <em>Create intelligent forms from natural language descriptions in seconds.</em>
    <br />
    <strong>No code. No complexity. Just forms.</strong>
  </p>
</div>

---

## Features

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>Natural Language</h3>
      <p>Describe your form in plain English. Our AI understands what you need and generates the perfect form structure.</p>
    </td>
    <td width="33%" valign="top">
      <h3>19 Question Types</h3>
      <p>From text inputs to file uploads, ratings to dates. Support for all common form field types with validation.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Smart Logic</h3>
      <p>Conditional rules, skip logic, and dynamic fields. Forms adapt based on user responses.</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3>Response Management</h3>
      <p>Track submissions, view responses, and export data in CSV or JSON format.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Easy Sharing</h3>
      <p>Generate shareable links instantly. No login required for respondents.</p>
    </td>
    <td width="33%" valign="top">
      <h3>Customizable</h3>
      <p>White/black/purple theme. Clean, modern interface that works on any device.</p>
    </td>
  </tr>
</table>

---

## How It Works

### Building forms is as easy as 1, 2, 3

> From idea to live form in minutes. No technical skills required.

#### **01. Describe Your Form**
Tell us what kind of form you need in plain language.
- Natural language processing understands your intent
- Examples: "Customer feedback survey", "Event registration form"
- AI suggests appropriate question types
- Context-aware field generation

#### **02. Review & Customize**
Get instant form generation and refine as needed.
- 19 question types supported
- Add conditional logic and validation rules
- Reorder questions with drag & drop
- Set required fields and default values

#### **03. Share & Collect**
Publish your form and start collecting responses.
- Generate shareable link instantly
- No login required for respondents
- Real-time response tracking
- Export responses as CSV or JSON

---

## Supported Question Types

**Input Fields**
- Short Text
- Long Text (Textarea)
- Email
- Phone Number
- Number
- URL

**Selection Options**
- Single Choice (Radio)
- Multiple Choice (Checkboxes)
- Dropdown Menu

**Specialized Fields**
- Date Picker
- Time Picker
- File Upload
- Rating Scale
- Linear Scale
- Yes/No Toggle

**Advanced**
- Multi-select Dropdown
- Section Header (for organization)

---

## Why AutoForm?

<table>
  <tr>
    <td width="33%" align="center">
      <h3>No Code Required</h3>
      <p>Built for everyone—from analysts to executives. If you can describe it, we can create it.</p>
    </td>
    <td width="33%" align="center">
      <h3>Lightning Fast</h3>
      <p>Go from idea to live form in under 60 seconds. Our AI handles all the heavy lifting.</p>
    </td>
    <td width="33%" align="center">
      <h3>Enterprise Ready</h3>
      <p>Secure, scalable, and built with production workloads in mind. OAuth authentication included.</p>
    </td>
  </tr>
</table>

---

## Tech Stack

### Frontend
- **React** + **TypeScript** - Modern, type-safe UI
- **React Router** - Seamless navigation
- **Vite** - Lightning-fast build tool

### Backend
- **FastAPI** - High-performance Python API
- **DSPy** - AI-powered form generation
- **SQLAlchemy** - Database ORM
- **PostgreSQL/SQLite** - Reliable data storage

### AI & Intelligence
- **Natural Language Processing** - Understand user intent
- **Smart Field Generation** - Automatic question type detection
- **Validation Rules** - Context-aware field validation
- **Conditional Logic** - Dynamic form behavior

---

## Installation

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.9+
- **Git**

### Clone the Repository
```bash
git clone https://github.com/yourusername/autoform.git
cd autoform
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (OpenAI, Google OAuth, etc.)

# Run the backend
uvicorn app.main:app --reload --port 8000
```

The backend will start on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install

# Run the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

---

## Usage

1. **Start the Application**
   - Navigate to `http://localhost:5173`
   - Sign in with Google

2. **Create Your Form**
   - Click "Create Forms for free"
   - Describe your form in plain English
   - Examples:
     - "Customer satisfaction survey with rating and feedback"
     - "Event registration form with name, email, and dietary preferences"
     - "Job application form with resume upload"

3. **Customize & Share**
   - Review generated questions
   - Add conditional logic if needed
   - Generate shareable link
   - Start collecting responses

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **FastAPI** - For the blazing-fast Python framework
- **DSPy** - For AI-powered form generation
- **React** - For the excellent UI library
- **Open Source Community** - For inspiration and support

---

<div align="center">
  <h3>Ready to build intelligent forms?</h3>
  <p><strong>Join thousands of teams making data-driven decisions faster.</strong></p>
  
  <p>
    <a href="https://github.com/yourusername/autoform">Star on GitHub</a> •
    <a href="#installation">Get Started</a> •
    <a href="https://github.com/yourusername/autoform/issues">Report Bug</a> •
    <a href="https://github.com/yourusername/autoform/issues">Request Feature</a>
  </p>

  <p>
    <sub>Built with ❤️ by FireBird Technologies</sub>
  </p>
</div>


