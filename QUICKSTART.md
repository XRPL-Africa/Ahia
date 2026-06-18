# Ahia Backend - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running locally or accessible
- Redis 6+ running locally or accessible
- (Optional) Cloudinary account for file uploads
- (Optional) XRPL testnet wallet for crypto payments

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

Minimum required variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ahia_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-min-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

### 3. Setup Database

```bash
# Create database (if using PostgreSQL CLI)
createdb ahia_db

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database with sample data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000`

## Verify Installation

### Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "version": "v1",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "development"
  }
}
```

### API Documentation
Open `http://localhost:5000/api-docs` in your browser.

## Using Docker (Alternative)

### Start all services
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f app
```

### Stop services
```bash
docker-compose down
```

## Default Test Accounts

After seeding, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@ahia.app | Admin@123456 | Super Admin |
| john.doe@uniben.edu | Password@123 | Verified Student |
| jane.smith@uniben.edu | Password@123 | Verified Student |

## Common Commands

```bash
# Development
npm run dev              # Start with hot reload

# Database
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Create new migration
npm run prisma:seed      # Reseed database

# Testing
npm run lint             # Check code style
npm run build            # Compile TypeScript
```

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env

### Redis Connection Error
```
Error: Redis connection failed
```
- Verify Redis is running: `redis-cli ping`
- Check REDIS_URL in .env

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
- Kill existing process: `kill $(lsof -t -i:5000)`
- Or change PORT in .env

### Prisma Client Error
```
Error: Cannot find module '@prisma/client'
```
- Regenerate client: `npm run prisma:generate`

## Next Steps

1. Review the API documentation at `/api-docs`
2. Test endpoints using the sample accounts
3. Configure Cloudinary for file uploads
4. Setup XRPL wallet for crypto payments
5. Review the codebase structure in README.md
