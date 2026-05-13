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

The backend runs on **http://localhost:3001**

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
| Backend (Express) | 3001 |
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
