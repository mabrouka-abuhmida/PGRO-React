# PGRO Matching System - Setup Guide

Complete guide to setting up and running the PGRO Matching System.

## 📋 Prerequisites

- **Docker** and **Docker Compose** (v2.0+)
- **Node.js** (v18+) - for frontend development
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/mabrouka-abuhmida/PGRO-matching-system-.git
cd PGRO-matching-system-
```

### 2. Set Up Environment Files
```bash
# Copy all .env.example files to .env
for service in backend/services/*/; do
  cp "$service.env.example" "$service.env" 2>/dev/null || true
done
```

### 3. Start All Services
```bash
# Start all services at once
docker-compose up -d

# Or start step by step:
# Step 1: Start databases
docker-compose up -d postgres redis

# Step 2: Wait for healthy status (~10 seconds)
docker-compose ps

# Step 3: Initialize database tables
docker exec -i pgro-postgres psql -U postgres -d pgr_db < backend/scripts/init_db.sql

# Step 4: Start backend services
docker-compose up -d api-gateway staff-service applicant-service matching-service file-service auth-service email-service
```

### 4. Seed Sample Data
```bash
pip install -r backend/requirements.txt
python backend/scripts/seed_database.py
```

### 5. Start Frontend
```bash
# Option A: Using Docker (port 5173)
docker-compose up -d frontend

# Option B: Local development (recommended)
cd frontend
npm install
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

## 🛠 Service Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database (pgvector enabled) |
| Redis | 6379 | Cache |
| API Gateway (may need 2, each for a language) | 8000 | Main API endpoint |
| Staff Service (c# possible, but llmclient dependant) | 8001 | Staff management |
| Applicant Service (c# possible, but llmclient dependant)| 8002 | Applicant handling |
| Matching Service (C#, but llmclient dependant) | 8003 | AI matching |
| File Service (py) | 8004 | File uploads |
| Auth Service (C#) | 8005 | Authentication |
| Email Service (C#) | 8006 | Email sending |
| Frontend | 5173 | React application |

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View status
docker-compose ps

# View logs (specific service)
docker-compose logs -f api-gateway

# View logs (all services)
docker-compose logs -f

# Rebuild services
docker-compose build

# Reset everything (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres redis
docker exec -i pgro-postgres psql -U postgres -d pgr_db < backend/scripts/init_db.sql
python backend/scripts/seed_database.py
docker-compose up -d

# Access PostgreSQL directly
docker exec -it pgro-postgres psql -U postgres -d pgr_db

# Access Redis
docker exec -it pgro-redis redis-cli

# Clear Redis cache (all data)
docker exec pgro-redis redis-cli FLUSHALL

# Clear specific Redis database
docker exec pgro-redis redis-cli -n 0 FLUSHDB

# Check Redis keys
docker exec pgro-redis redis-cli KEYS "*"

# Get Redis memory info
docker exec pgro-redis redis-cli INFO memory
```

## 🔑 Environment Variables

Key variables in `.env` files:

```env
# Database (all services)
DATABASE_URL=postgresql://postgres:admin@localhost:5432/pgr_db

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenAI (matching-service)
OPENAI_API_KEY=your_key_here

# SendGrid (email-service)
SENDGRID_API_KEY=your_key_here
EMAIL_FROM_ADDRESS=noreply@usw.ac.uk
```

## 🔧 Development Mode

### Frontend Only
```bash
cd frontend
npm install
npm run dev
```


## ❓ Troubleshooting

### "Connection refused" errors
```bash
# Ensure services are running and healthy
docker-compose ps
```

### "Service unavailable" from API Gateway
The API Gateway proxies to microservices. Ensure they're running:
```bash
docker-compose up -d staff-service applicant-service
```

### Database not initialized
```bash
docker exec -i pgro-postgres psql -U postgres -d pgr_db < backend/scripts/init_db.sql
```

### Port already in use
```bash
# Find process using the port
lsof -i :5173

# Kill process or use different port
```

### pgvector extension
The docker-compose uses `pgvector/pgvector:pg15` image which has pgvector pre-installed.

## 📁 Project Structure

```
PGRO-matching-system-/
├── backend/
│   ├── Dockerfile              # Multi-stage build
│   ├── shared/                 # Shared code
│   │   ├── db/models/          # SQLAlchemy models
│   │   ├── config/             # Settings
│   │   └── cache/              # Redis cache
│   └── scripts/
│       ├── init_db.sql         # Database schema
│       └── seed_database.py    # Sample data
├── frontend/                   # React application
├── docker-compose.yml          # Service orchestration
└── SETUP.md                    # This file
```

---

For issues, see `ISSUES_TODO.md` or create a GitHub issue.
