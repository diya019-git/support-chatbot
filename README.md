# SupportPilot — AI-Powered Customer Support Chatbot

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green)

> An internship project implementing a full-stack AI-powered customer support chatbot with NLP intent matching, auto-escalation, real-time chat, and a complete admin dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How the NLP Engine Works](#how-the-nlp-engine-works)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Security](#security)
- [Future Enhancements](#future-enhancements)
- [Learning Outcomes](#learning-outcomes)

---

## Overview

SupportPilot automates repetitive customer support queries using NLP, freeing human agents to handle complex issues. It answers questions about order status, refunds, account help, and technical issues — and automatically escalates anything it can't handle confidently to a human agent.

**Problem it solves:**
- Delayed responses due to high support volume
- Repetitive queries consuming agent time
- No 24/7 availability for customers
- High operational support costs

---

## Live Demo

| Service | URL |
|---------|-----|
| Customer Chat | https://support-chatbot-ivory.vercel.app |
| Admin Dashboard | https://support-chatbot-ivory.vercel.app/admin |
| Backend API | https://support-chatbot-q2v6.onrender.com/api |

**Demo credentials:**

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Full access |
| `agent` | `agent123` | Chats + FAQs only |

---

## Features

### Customer-Facing
- 💬 **Real-time chat widget** — floating button, opens instantly, mobile responsive
- 🧠 **NLP intent matching** — understands natural language, not just exact keywords
- ✏️ **Spell correction** — handles typos like "oreder" → "order" automatically
- 📂 **5 support categories** — Order Status, Refund, Account, Technical, General
- 🔁 **Session persistence** — chat history restored on page refresh
- 🚨 **Auto-escalation** — flags low-confidence queries for human follow-up

### Admin Dashboard
- 📊 **Analytics** — total chats, resolution rate, category breakdown, 7-day trend chart
- 💼 **Chat history** — view all conversations, filter by status, read full transcripts
- 📝 **FAQ management** — add, edit, delete knowledge base entries with keyword support
- 👥 **User management** — create and remove admin/agent accounts (admin role only)
- 🔐 **Role-based access** — admin vs agent permissions enforced on every route

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Axios |
| Backend | Python, Flask, Flask-JWT-Extended, Flask-Limiter |
| Database | SQLite (via SQLAlchemy ORM) |
| NLP | scikit-learn (TF-IDF + cosine similarity), pyspellchecker |
| Auth | JWT (JSON Web Tokens) with role-based access control |
| Deployment | Render (backend), Vercel (frontend) |

---

## Project Structure

```
support-chatbot/
├── backend/
│   ├── app.py              # Flask app factory + all API routes
│   ├── models.py           # SQLAlchemy models (Admin, FAQ, ChatSession, ChatMessage)
│   ├── nlp_engine.py       # TF-IDF intent matcher + spell correction
│   ├── config.py           # Configuration via environment variables
│   ├── seed_data.py        # Seeds demo users + 20 starter FAQs
│   ├── smoke_test.py       # 18 automated API tests
│   └── requirements.txt    # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js           # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx     # Admin auth state management
    │   ├── lib/
    │   │   └── categories.js       # Category/status color metadata
    │   ├── components/
    │   │   ├── ChatWidget.jsx      # Floating customer chat widget
    │   │   ├── AdminLayout.jsx     # Sidebar navigation shell
    │   │   └── ProtectedRoute.jsx  # Auth route guards
    │   └── pages/
    │       ├── Landing.jsx         # Customer-facing homepage
    │       ├── Login.jsx           # Admin login page
    │       ├── Dashboard.jsx       # Analytics overview
    │       ├── FAQManagement.jsx   # CRUD FAQ knowledge base
    │       ├── ChatHistory.jsx     # All chat sessions
    │       ├── ChatDetail.jsx      # Single conversation transcript
    │       └── UserManagement.jsx  # Admin/agent user accounts
    ├── vite.config.js      # Dev proxy: /api/* → localhost:5000
    └── tailwind.config.js  # Custom design tokens
```

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/support-chatbot.git
cd support-chatbot
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo users and 20 starter FAQs
python seed_data.py

# Start the Flask server (runs on port 5000)
python app.py
```

### 3. Frontend setup

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (runs on port 5173)
npm run dev
```

### 4. Open the app

| Page | URL |
|------|-----|
| Customer chat | http://localhost:5173 |
| Admin dashboard | http://localhost:5173/admin |

> The Vite dev server automatically proxies `/api/*` requests to Flask on port 5000 — no CORS configuration needed.

---

## How the NLP Engine Works

```
User message
     │
     ▼
Spell correction (pyspellchecker)
     │  "oreder" → "order"
     ▼
Small-talk detection
     │  "hello" → canned greeting response
     ▼
TF-IDF vectorization
     │  Build matrix over all FAQ questions + keywords
     ▼
Cosine similarity scoring
     │  Score each FAQ against the user message
     ▼
Threshold check (default: 0.22)
     │
     ├── Score ≥ threshold → Return matched FAQ answer
     │
     └── Score < threshold → Escalate to human agent
```

**Tuning the threshold:**

Edit `NLP_CONFIDENCE_THRESHOLD` in `backend/config.py` or set it as an environment variable:
- Lower value → more aggressive matching, fewer escalations
- Higher value → more conservative, more escalations

**Improving match accuracy:**

Add richer `keywords` to FAQs from the Admin → FAQ Management panel. Keywords are comma-separated synonyms that widen the TF-IDF matching surface.

---

## API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/chat` | Send message, receive bot reply |
| `GET` | `/api/chat/:session_id` | Get full chat history |
| `GET` | `/api/faqs` | List FAQs (optional `?category=` filter) |
| `POST` | `/api/auth/login` | Admin login → JWT token |

**POST `/api/chat` payload:**
```json
{
  "message": "Where is my order?",
  "session_id": "optional-existing-uuid",
  "user_name": "optional-name"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "status": "active",
  "response": {
    "message": "You can track your order from 'My Orders'...",
    "category": "order_status",
    "confidence": 0.712,
    "escalated": false,
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

### Admin Endpoints (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Current user info |
| `GET` | `/api/admin/analytics` | Dashboard stats + chart data |
| `GET/POST` | `/api/admin/faqs` | List / create FAQs |
| `PUT/DELETE` | `/api/admin/faqs/:id` | Update / delete FAQ |
| `GET` | `/api/admin/chats` | All chat sessions |
| `GET` | `/api/admin/chats/:id` | Full conversation |
| `PUT` | `/api/admin/chats/:id/status` | Update status |
| `DELETE` | `/api/admin/chats/:id` | Delete conversation |
| `GET/POST` | `/api/auth/users` | List / create users *(admin only)* |
| `DELETE` | `/api/auth/users/:id` | Remove user *(admin only)* |

---

## Database Schema

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────────────┐
│   admins    │     │      faqs         │     │   chat_sessions      │
├─────────────┤     ├───────────────────┤     ├──────────────────────┤
│ id (PK)     │     │ id (PK)           │     │ id (PK)              │
│ username    │     │ category          │     │ session_id (unique)  │
│ password    │     │ question          │     │ user_name            │
│ role        │     │ answer            │     │ status               │
│ created_at  │     │ keywords          │     │ created_at           │
└─────────────┘     │ created_at        │     │ updated_at           │
                    │ updated_at        │     └──────────┬───────────┘
                    └─────────┬─────────┘                │
                              │                          │
                              │         ┌────────────────▼─────────────┐
                              │         │        chat_messages         │
                              │         ├──────────────────────────────┤
                              │         │ id (PK)                      │
                              │         │ session_id (FK)              │
                              └─────────► matched_faq_id (FK)         │
                                        │ sender (user/bot)            │
                                        │ message                      │
                                        │ category                     │
                                        │ confidence                   │
                                        │ escalated                    │
                                        │ timestamp                    │
                                        └──────────────────────────────┘
```

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set these values:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python app.py` |

5. Add environment variables:

```
SECRET_KEY=<generate a random 32-char string>
JWT_SECRET_KEY=<generate a different random 32-char string>
NLP_CONFIDENCE_THRESHOLD=0.22
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

6. Click **Deploy** — after first deploy, open the Render shell and run:
```bash
python seed_data.py
```

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set these values:

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Add environment variable:
```
VITE_API_URL=https://your-render-app.onrender.com/api
```

5. Click **Deploy**

---

## Security

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT tokens with 12-hour expiry |
| Authorization | Role-based (admin vs agent) on every protected route |
| Rate limiting | Chat: 30/min · Login: 10/min (brute-force protection) |
| Password storage | Werkzeug `generate_password_hash` (bcrypt) |
| Security headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| HTTPS | HSTS header in production, TLS via Render/Vercel |
| CORS | Configurable origin whitelist via `CORS_ORIGINS` env var |

---

## Running Tests

```bash
cd backend
source venv/bin/activate   # Windows: venv\Scripts\Activate.ps1
python smoke_test.py
```

Runs 18 automated tests covering: chat flow, escalation, login, JWT auth, FAQ CRUD, chat management, analytics, and role-based access control.

---

## Future Enhancements

- [ ] Voice assistant support (Web Speech API)
- [ ] Multi-language chatbot with translated FAQ sets
- [ ] AI sentiment analysis on escalated chats
- [ ] WhatsApp Business API integration
- [ ] Real-time live agent chat via WebSockets
- [ ] ML-based responses using sentence-transformers
- [ ] Email notifications to agents on new escalation
- [ ] Canned response suggestions for human agents

---

## Learning Outcomes

This project demonstrates hands-on experience with:

- ✅ Full-stack web development (React + Flask)
- ✅ RESTful API design and implementation
- ✅ NLP fundamentals (TF-IDF, cosine similarity, spell correction)
- ✅ Database design and ORM usage (SQLAlchemy + SQLite)
- ✅ JWT authentication and role-based authorization
- ✅ Rate limiting and security hardening
- ✅ Response caching for performance
- ✅ Cloud deployment (Render + Vercel)

---

## License

MIT License — free to use for educational and commercial purposes.

---

*Built as an internship project for Yinolite. Developed with Python, Flask, React, and scikit-learn.*