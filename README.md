# Eves — Real-Time Seat Booking System with Phantom Lock Recovery

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL + Redis)

### Setup

```bash
# 1. Start databases
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed demo data
npm run db:seed

# 6. Start the API
npm run dev
```

API runs on `http://localhost:3001`

### Demo Credentials
- **Admin:** admin@eves.io / admin123
- **User:** user@eves.io / user123

## Architecture

```
Redis (atomic locks)  ←→  Express API  ←→  PostgreSQL (persistent state)
                              ↕
                        Socket.IO (real-time broadcasts)
                              ↕
                        BullMQ Worker (phantom lock recovery)
```

## Key Endpoints

| Category | Endpoint | Method |
|----------|----------|--------|
| Auth | /api/auth/register | POST |
| Auth | /api/auth/login | POST |
| Events | /api/events | GET/POST |
| Seats | /api/events/:id/seats | GET |
| Lock | /api/seats/:id/lock | POST |
| Lock | /api/seats/:id/release | DELETE |
| Payment | /api/payments/simulate-success | POST |
| Booking | /api/bookings/confirm | POST |
| Recovery | /api/recovery/run | POST |
| Admin | /api/admin/race-test | POST |

## Environment Variables

See `.env.example` for all required variables.
