# TRANSFORMERS CI/CD Healing Agent

## Overview
Autonomous CI/CD healing agent that clones a repo, runs tests, diagnoses failures, generates fixes with an LLM, commits changes, and pushes a branch back to GitHub. Built for the RIFT 2026 hackathon.

## Team
- Team Name: TRANSFORMERS
- Team Leader: Karthikeya
- GitHub: https://github.com/BendiKarthikeya

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  User Interface                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Dashboard (Vite + Tailwind CSS + Recharts)      │   │
│  │  - Input: Repository URL, Team Name, Leader           │   │
│  │  - Output: Real-time fix progress & scoring           │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │ HTTP REST API                         │
│                         ▼                                        │
│  Backend Service                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI + Uvicorn                                      │  │
│  │  - POST /api/run-agent (orchestrate healing)           │  │
│  │  - GET /api/status (check progress)                    │  │
│  │  - GET /api/results (fetch results)                    │  │
│  └──────────────────┬──────────────────────────────────────┘  │
│                     │                                           │
│                     ▼                                           │
│  LangGraph Multi-Agent Pipeline                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Clone Repository (GitPython)                        │  │
│  │  2. Discover Tests (pytest, pyflakes)                   │  │
│  │  3. Run Tests (detect failures)                         │  │
│  │  4. Analyze Failures (bug classification)               │  │
│  │  5. Fix Code (Groq LLM, Gemini fallback)                │  │
│  │  6. Commit & Push (git operations)                      │  │
│  │  7. Verify Fixes (re-run tests, max 5 iterations)       │  │
│  │  8. Calculate Score (efficiency + success metrics)      │  │
│  └──────────────────┬──────────────────────────────────────┘  │
│                     │                                           │
│                     ▼                                           │
│  GitHub Repository                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Clone repo to backend/repos/                         │  │
│  │  - Create branch: TRANSFORMERS_KARTHIKEYA_AI_Fix       │  │
│  │  │  - Apply AI-generated fixes                          │  │
│  │  │  - Commit with [AI-AGENT] prefix                     │  │
│  │  │  - Push to GitHub                                    │  │
│  │  - GitHub Actions CI/CD Pipeline                        │  │
│  │    └─ Runs: pytest on all test files                    │  │
│  │    └─ Validates: syntax, logic, imports                 │  │
│  │    └─ Reports: pass/fail status back to agent           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Local Setup

### Prerequisites
1. Python 3.11+
2. Node.js 18+
3. Git
4. GitHub Personal Access Token
5. Groq API key (Gemini optional)

## Configuration
Create .env files:

backend/.env
```
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GITHUB_TOKEN=your_github_token
PORT=8000
```

frontend/.env (optional)
```
VITE_API_URL=http://localhost:8000
```

## Run (Docker)
```
docker compose up -d --build
```

Frontend: http://localhost:5173
Backend: http://localhost:8000

## Run (Local)
Backend:
```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:
```
cd frontend
npm install
npm run dev
```

## Usage
1. Open the UI and enter the GitHub repo URL, team name, and leader name.
2. Click Run Agent.
3. The agent will create a branch and push fixes if tests fail.

## Production Notes
- Use real secrets via environment variables or secret managers.
- Disable auto-reload and run behind a reverse proxy.
- Configure CORS and rate limiting for the API.

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/transformers-cicd-agent.git
cd transformers-cicd-agent
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys (see ⚙️ Environment Setup below)

# Test the setup
python -m uvicorn main:app --reload
# Application should be running on http://localhost:8000
```

### Step 3: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local if needed
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
# Application should be running on http://localhost:5173
```

### Step 4: Verify Installation
```bash
# Backend health check
curl http://localhost:8000/health

# Frontend should be accessible at http://localhost:5173
# Try entering a test repository URL in the dashboard
```

## ⚙️ Environment Setup

### Backend Environment Variables (.env)

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
# Get from: https://console.groq.com/

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token_here
# Get from: https://github.com/settings/tokens
# Required scopes: repo (full control), workflow (GitHub Actions)

# Server Configuration
PORT=8000
HOST=0.0.0.0

# Optional: API Keys for other services
# OPENAI_API_KEY=sk-...  # (if using OpenAI as fallback)
```

### Frontend Environment Variables (.env.local)

Create a `.env.local` file in the `frontend/` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
# For production: VITE_API_URL=https://your-backend-api.railway.app
```

## 📖 Usage Examples

### Example 1: Via Dashboard (Recommended)
1. Open http://localhost:5173
2. Enter GitHub repository URL: `https://github.com/username/failing-tests-repo`
3. (Optional) Modify Team Name: `TRANSFORMERS`
4. (Optional) Modify Team Leader: `KARTHIKEYA`
5. Click **🚀 Run Agent**
6. Watch real-time progress:
   - Failures detected
   - Fixes being generated
   - CI/CD verification
   - Final score calculation

### Example 2: Via API
```bash
# Request
curl -X POST http://localhost:8000/api/run-agent \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/example/repo",
    "team_name": "TRANSFORMERS",
    "team_leader": "KARTHIKEYA"
  }'

# Response
{
  "branch_name": "TRANSFORMERS_KARTHIKEYA_AI_Fix",
  "total_failures": 3,
  "total_fixes": 3,
  "ci_status": "passed",
  "time_taken": 245.7,
  "score": 105,
  "fixes": [
    {
      "file": "src/utils.py",
      "bug_type": "SYNTAX",
      "line_number": 42,
      "commit_message": "[AI-AGENT] Fixed syntax error in utils.py:42",
      "status": "Fixed"
    }
  ],
  "timeline": [
    {
      "stage": "clone_repo",
      "description": "Cloned repository to backend/repos/",
      "status": "completed",
      "timestamp": "2026-02-19T10:15:30Z"
    }
  ]
}
```

### Example 3: Check Agent Status
```bash
curl -X GET http://localhost:8000/api/status
```

### Example 4: Retrieve Previous Results
```bash
curl -X GET http://localhost:8000/api/results
```

## 🐛 Supported Bug Types

The agent can detect and automatically fix the following bug categories:

| Bug Type | Description | Example | Fix Strategy |
|----------|-------------|---------|--------------|
| **LINTING** | Code style violations | Unused imports, line too long | Apply style rules (PEP 8) |
| **SYNTAX** | Python syntax errors | Missing colon, invalid indentation | Parse errors + AST analysis |
| **LOGIC** | Incorrect algorithm logic | Off-by-one errors, wrong conditionals | Review logic flow + LLM generation |
| **TYPE_ERROR** | Type mismatches | String passed to int() | Type hint analysis |
| **IMPORT** | Missing/invalid imports | `from module import missing_name` | Dependency resolution |
| **INDENTATION** | Incorrect indentation levels | Mixed tabs/spaces, wrong block level | Normalize indentation |

### Detection Methods
- **Pyflakes:** Fast linting analysis (real-time)
- **Pytest:** Test execution and failure parsing
- **Regex Pattern Matching:** Error message classification
- **AST Analysis:** Deep syntax/semantic checks

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI component library
- **Vite 5.0.0** - Build tool with hot module replacement
- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **Recharts 2.10.0** - React charting library for score visualization
- **Axios 1.6.0** - HTTP client for API communication
- **React Router 6.18.0** - (Future enhancement for multi-page navigation)

### Backend
- **FastAPI 0.104+** - Modern web framework with async support
- **Uvicorn 0.24+** - ASGI web server
- **Python 3.11** - Programming language runtime

### AI & Automation
- **LangGraph** - Multi-agent orchestration framework
- **Groq API (llama3-70b-8192)** - Primary LLM for code generation
- **LangChain** - AI framework for prompt engineering
- **Temperature: 0.3** - Low variance for consistent code fixes

### CI/CD & DevOps
- **GitPython** - Git repository operations
- **Pytest** - Python test discovery and execution
- **Pyflakes** - Static code analysis
- **GitHub Actions** - CI/CD pipeline execution
- **Black** - Code formatter (optional)

### Deployment
- **Vercel** - Frontend hosting (React SPA)
- **Railway/AWS** - Backend hosting (FastAPI)
- **Docker** - Containerization for consistent environments
- **GitHub** - Source control and CI/CD

## ⚠️ Known Limitations

1. **Python-Only:** Currently supports Python projects. Java, JavaScript, and other languages would require separate LLM prompts and analysis pipelines.

2. **Test Execution Timeout:** If tests take longer than the configured timeout (default 5 minutes per iteration), the agent may fail. Very large test suites might need parallelization or test filtering.

3. **Rate Limiting:** Groq API has rate limits (requests per minute). High-volume concurrent requests may hit the limit. Consider implementing a request queue.

4. **Git Authentication:** Requires a personal GitHub token. Cannot work with private SSH keys or two-factor authentication without proper setup.

5. **Complex Bugs:** The agent may struggle with:
   - Multi-file refactoring requirements
   - Algorithmic logic bugs requiring significant rewrites
   - Bugs in compiled C extensions or system-level code

6. **Verification Loop:** Maximum 5 retries for verification. Some complex bugs may need manual intervention after the retry limit is exhausted.

## 📁 Project Structure

```
transformers-cicd-agent/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── agent.py                # LangGraph multi-agent pipeline
│   ├── tools.py                # Helper functions for agent nodes
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   ├── Dockerfile               # Docker container definition
│   └── repos/                   # (Generated) Cloned repositories working directory
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Main dashboard component
│   │   ├── index.css            # Global styles + Tailwind directives
│   │   ├── context/
│   │   │   └── AgentContext.jsx # Global state management + API calls
│   │   └── components/
│   │       ├── InputSection.jsx        # Repository URL form
│   │       ├── RunSummaryCard.jsx      # Summary statistics grid
│   │       ├── ScoreBreakdown.jsx      # Score visualization (Recharts)
│   │       ├── FixesTable.jsx          # Applied fixes data table
│   │       └── CICDTimeline.jsx        # Timeline of CI/CD stages
│   ├── public/
│   │   └── index.html           # HTML entry point
│   ├── package.json             # NPM dependencies
│   ├── vite.config.js           # Vite build configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS plugins
│   ├── vercel.json              # Vercel deployment config
│   └── .env.local               # Local environment (not committed)
│
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD pipeline
│
├── .gitignore                   # Files to ignore in git
└── README.md                    # This file
```

## 🔧 Running the Project

### Development Mode
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production Deployment

#### Backend (Railway)
```bash
cd backend
railway up
```

#### Frontend (Vercel)
```bash
cd frontend
npm install -g vercel
vercel
```

## 📊 Monitoring & Logging

### Backend Logs
```bash
tail -f backend/results.json  # View saved results
```

### Frontend Error Tracking
Open browser DevTools (F12) to view:
- Network requests to `/api/run-agent`
- Console errors from React components

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with meaningful messages: `git commit -m "Add feature X"`
4. Push and create a Pull Request

## 📝 License

This project is created for RIFT 2026 Hackathon.

## 🎯 Future Enhancements

- [ ] Support for JavaScript/TypeScript projects
- [ ] Integration with other LLM providers (OpenAI, Anthropic)
- [ ] Advanced retry strategies with different fix patterns
- [ ] Real-time WebSocket updates for dashboard
- [ ] Multi-language support (Java, Go, Rust)
- [ ] Custom bug classification models
- [ ] Metrics dashboard and historical analysis

---

**Built with ❤️ by TRANSFORMERS Team - RIFT 2026**
