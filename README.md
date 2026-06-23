<div align="center">

# 🚀 AI SaaS Starter Kit

**Production-ready full-stack AI SaaS boilerplate**

Built with React · Vite · Tailwind CSS v4 · FastAPI · PostgreSQL · Stripe

[![CI Pipeline](https://github.com/your-org/ai-saas-starter-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-saas-starter-kit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** — Secure access & refresh token flow
- **Google OAuth 2.0** — One-click social login
- **API Key Management** — Generate, rotate, and revoke API keys
- **Rate Limiting** — Redis-backed per-user rate limits
- **CORS & Security Headers** — Production-hardened Nginx config

### 💳 Billing & Subscriptions
- **Stripe Integration** — Checkout, customer portal, webhook handling
- **Plan Management** — Free, Pro, and Enterprise tiers
- **Usage Tracking** — Per-user API call and token tracking
- **Usage Quotas** — Plan-based limits with enforcement

### 🤖 AI Features
- **Chat Interface** — Modern AI chat with streaming responses (SSE)
- **Prompt Templates** — Create, share, and use prompt templates
- **OpenAI-Compatible** — Works with OpenAI, Azure OpenAI, local models
- **Token Counting** — Track token usage per conversation

### 📊 Dashboards
- **User Dashboard** — Usage stats, recent conversations, quick actions
- **Admin Panel** — User management, system stats, usage analytics
- **Usage Analytics** — Daily breakdown, trend indicators

### 🎨 Modern UI
- **Tailwind CSS v4** — Latest design system with CSS-first configuration
- **Dark/Light Mode** — System-aware with manual toggle
- **Responsive Design** — Mobile-first, works on all devices
- **Glassmorphism & Gradients** — Premium, modern aesthetics
- **Smooth Animations** — Micro-interactions and transitions

### 🐳 DevOps
- **Docker Compose** — One-command full-stack deployment
- **GitHub Actions CI/CD** — Automated testing and deployment
- **Health Checks** — Liveness and readiness probes
- **Network Segmentation** — Internal backend network

---

## 🏗️ Architecture

```
ai-saas-starter-kit/
├── frontend/                 # React + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/       # UI + Layout components
│   │   ├── pages/            # Route pages
│   │   ├── providers/        # Auth & Theme contexts
│   │   ├── stores/           # Zustand state management
│   │   ├── lib/              # API client & utilities
│   │   ├── routes/           # Router + route guards
│   │   └── types/            # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/           # Versioned REST endpoints
│   │   ├── core/             # Security, middleware, deps
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation
│   │   ├── services/         # Business logic
│   │   └── main.py           # App factory
│   ├── alembic/              # Database migrations
│   ├── tests/                # Pytest suite
│   └── Dockerfile
│
├── docker-compose.yml        # Production orchestration
├── docker-compose.dev.yml    # Development overrides
└── .github/workflows/        # CI/CD pipelines
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 22+](https://nodejs.org/) (for local frontend development)
- [Python 3.12+](https://python.org/) (for local backend development)

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/ai-saas-starter-kit.git
cd ai-saas-starter-kit

# Copy environment template and fill in your values
cp .env.example .env
```

### 2. Start with Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker compose up -d

# Run database migrations
docker compose run --rm migrate

# Open http://localhost in your browser
```

### 3. Local Development (Without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL and Redis locally or via Docker:
docker compose up -d db redis

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev    # Opens http://localhost:5173
```

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `SECRET_KEY` | JWT signing secret | ✅ |
| `REFRESH_SECRET_KEY` | Refresh token secret | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ |
| `STRIPE_SECRET_KEY` | Stripe API secret key | ❌ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ❌ |
| `OPENAI_API_KEY` | OpenAI API key for AI chat | ❌ |
| `OPENAI_MODEL` | Model name (default: gpt-4o-mini) | ❌ |

See [`.env.example`](.env.example) for the complete list.

---

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login with email/password |
| `GET` | `/api/v1/auth/google/login` | Google OAuth login |
| `GET` | `/api/v1/users/me` | Get current user profile |
| `POST` | `/api/v1/chat/conversations` | Create conversation |
| `POST` | `/api/v1/chat/conversations/{id}/messages` | Send message (streaming) |
| `GET` | `/api/v1/templates` | List prompt templates |
| `POST` | `/api/v1/subscriptions/checkout` | Create Stripe checkout |
| `POST` | `/api/v1/api-keys` | Create API key |
| `GET` | `/api/v1/admin/stats` | Admin system stats |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend lint & type check
cd frontend
npm run lint
npx tsc --noEmit
```

---

## 🐳 Production Deployment

### Docker Compose (VPS)

```bash
# On your server
git pull origin main
docker compose pull
docker compose run --rm migrate
docker compose up -d --remove-orphans
```

### CI/CD

The included GitHub Actions workflows handle:
1. **CI** (`ci.yml`) — Runs on every push/PR: lint, test, build
2. **CD** (`cd.yml`) — Runs on merge to `main`: build images, push to GHCR, deploy via SSH

Configure these GitHub Secrets:
- `DEPLOY_HOST` — Server IP/hostname
- `DEPLOY_USER` — SSH username
- `DEPLOY_SSH_KEY` — SSH private key

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19 |
| **Build Tool** | Vite | 6 |
| **Styling** | Tailwind CSS | 4 |
| **State** | Zustand | 5 |
| **Routing** | React Router | 7 |
| **Backend** | FastAPI | 0.115+ |
| **ORM** | SQLAlchemy | 2.0+ |
| **Database** | PostgreSQL | 17 |
| **Cache** | Redis | 7 |
| **Auth** | JWT + Google OAuth | — |
| **Payments** | Stripe | — |
| **Container** | Docker + Compose | — |
| **CI/CD** | GitHub Actions | — |

---

## 📁 Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Create Products in the Stripe Dashboard:
   - **Pro Plan** ($29/month) → copy the Price ID
   - **Enterprise Plan** ($99/month) → copy the Price ID
3. Set up a webhook endpoint pointing to `https://yourdomain.com/api/v1/subscriptions/webhook`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Add the keys to your `.env` file

For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:8000/api/v1/subscriptions/webhook
```

---

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:8000/api/v1/auth/google/callback`
4. Copy Client ID and Client Secret to `.env`

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the SaaS community**

[Report Bug](https://github.com/your-org/ai-saas-starter-kit/issues) ·
[Request Feature](https://github.com/your-org/ai-saas-starter-kit/issues) ·
[Discussions](https://github.com/your-org/ai-saas-starter-kit/discussions)

</div>