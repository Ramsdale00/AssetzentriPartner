# AssetZentri Partner Portal

A full-stack B2B SaaS partner portal built with React + Express + PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Database Setup

```bash
# Create the database
createdb assetzentri

# Or using psql:
psql -U postgres -c "CREATE DATABASE assetzentri;"

# Run the schema
psql -U postgres -d assetzentri -f backend/schema.sql

# Seed the database
psql -U postgres -d assetzentri -f backend/seed.sql
```

## Backend Setup

```bash
cd backend

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Install dependencies
npm install

# Start the server
npm start

# Development (with auto-reload)
npm run dev
```

The backend runs on **http://localhost:6789**

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend runs on **http://localhost:5173**

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| alex@northwave-tech.com | password | Partner Admin (Northwave Technologies, Gold) |
| ops@vistrive.com | password | Admin / Partner Ops (Vistrive) |

## Ports

| Service | Port |
|---------|------|
| Backend (Express) | 6789 |
| Frontend (Vite) | 5173 |

## Features

### Partner Portal
- Dashboard with pipeline stats and onboarding progress
- 8-step onboarding checklist
- Lead/deal registration with duplicate detection
- Deal detail view with stage tracker and comments
- Product collateral browser with search and co-branded one-pager generator
- Team management with invite and remove

### Admin Portal
- Operations overview with cross-partner stats and stage distribution chart
- All deals table across all partners
- Partners list with onboarding progress bars
- Partner drilldown with deals, team, and onboarding detail

### Shared
- Global search (Ctrl+K / Cmd+K) across deals and collaterals
- JWT authentication with auto-redirect by persona
- Toast notifications
- Responsive layout

## Security & Anti-Spam

The auth endpoints (`/api/auth/login`, `/api/auth/signup`, `/api/auth/verify-magic-link`)
are protected with free, layered defenses:

### 1. Cloudflare Turnstile (free CAPTCHA alternative)
Stops bots/spam on the sign-in and sign-up forms.

1. In the [Cloudflare dashboard](https://dash.cloudflare.com) → **Turnstile**, create a
   free widget for your domain. You get a **Site key** and a **Secret key**.
2. Backend: set `TURNSTILE_SECRET_KEY` in `backend/.env`.
3. Frontend: set `VITE_TURNSTILE_SITE_KEY` in `frontend/.env`, then rebuild.

If these are left blank (e.g. local dev), Turnstile is skipped and the app works
normally — so it's safe to enable only in production.

### 2. Rate limiting
Each IP is limited to 20 auth requests per 15 minutes (in-memory, zero-dependency),
which blunts brute-force and signup/login spam. Excess requests get `429 Too Many
Requests`. Behind a proxy, set `TRUST_PROXY` so the real client IP is used.

### 3. Cloudflare edge (recommended, dashboard-only — no code)
Put the site behind Cloudflare and enable, for free:
- **Proxy (orange cloud)** on the DNS records so traffic flows through Cloudflare.
- **WAF Managed Rules** and **Bot Fight Mode** (Security → Bots).
- **Rate limiting rules** on `/api/auth/*` (Security → WAF → Rate limiting rules).
- **"Under Attack" mode** to toggle on during an active attack.

When proxied through Cloudflare (and nginx), set `TRUST_PROXY` in `backend/.env`
(e.g. `TRUST_PROXY=2`) so per-IP limits apply to the visitor, not the proxy.
