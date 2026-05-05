# Eves — Frontend Build PRD

## For: Any AI or developer building the Next.js frontend

**Backend API:** `http://localhost:3001` (dev) / deployed URL (prod)
**Stack:** Next.js 14+ (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Socket.IO Client · Zustand · React Query

---

## 1. Authentication

### JWT Token Flow
1. User registers/logs in → API returns `{ token, user }`
2. Store token in localStorage as `eves_token`
3. Attach to all API requests: `Authorization: Bearer <token>`
4. On 401 response → clear token, redirect to /login
5. Socket.IO auth: pass token in handshake `auth: { token }`

### Endpoints

**POST /api/auth/register**
```json
// Request
{ "name": "John", "email": "john@test.com", "password": "pass123", "phone": "optional" }
// Response
{ "success": true, "data": { "user": { "id", "name", "email", "role", "createdAt" }, "token": "jwt..." } }
```

**POST /api/auth/login**
```json
// Request
{ "email": "admin@eves.io", "password": "admin123" }
// Response (same shape as register)
```

**GET /api/auth/me** (requires auth header)
```json
// Response
{ "success": true, "data": { "id", "name", "email", "phone", "role", "createdAt" } }
```

---

## 2. Pages & Routes

| Route | Page | Auth Required | Role |
|-------|------|--------------|------|
| `/` | Landing Page | No | — |
| `/login` | Login | No | — |
| `/register` | Register | No | — |
| `/events` | Event Search/List | No | — |
| `/events/[eventId]` | Seat Selection | Yes | Any |
| `/events/[eventId]/payment` | Payment Simulation | Yes | Any |
| `/bookings` | My Bookings | Yes | Any |
| `/bookings/[bookingId]` | Booking Details | Yes | Any |
| `/admin` | Admin Dashboard | Yes | ADMIN |
| `/admin/simulation` | Race Condition Test | Yes | ADMIN |

---

## 3. Page Specifications

### 3.1 Landing Page (`/`)

**Purpose:** Hero section explaining the problem and solution.

**Content:**
- Hero: "Eves — Zero Double Bookings, Real-Time Recovery"
- Problem statement: phantom locks in booking systems
- Solution: atomic Redis locks + recovery worker
- Architecture diagram (show Redis ↔ API ↔ PostgreSQL ↔ Socket.IO)
- CTA button → "Try Live Demo" → `/events`
- Feature cards: Real-time seats, Phantom lock recovery, Fair queue, Race condition proof

**No API calls needed.**

---

### 3.2 Event Search (`/events`)

**API Call:** `GET /api/events`
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Mumbai Rajdhani Express",
      "type": "TRAIN",  // TRAIN | BUS | CINEMA | EVENT | STADIUM
      "source": "Mumbai Central",
      "destination": "New Delhi",
      "venue": null,
      "eventDate": "2026-05-12T00:00:00.000Z",
      "totalSeats": 80,
      "rows": 10,
      "columns": 8,
      "status": "ACTIVE",
      "_count": { "seats": 80, "bookings": 5 }
    }
  ]
}
```

**UI Elements:**
- Search/filter bar (by title, type, date)
- Event cards showing: title, type badge, date, source→destination (for trains/buses) or venue (for cinema/events), available seat count
- Click card → navigate to `/events/[eventId]`

---

### 3.3 Seat Selection (`/events/[eventId]`)

**This is the most important page.** It shows the real-time seat grid.

**API Calls:**
1. `GET /api/events/[eventId]` — event details
2. `GET /api/events/[eventId]/seats` — full seat grid

```json
// GET /api/events/:eventId/seats Response
{
  "success": true,
  "data": {
    "event": { "id", "title", "rows": 10, "columns": 8 },
    "seats": [
      {
        "id": "uuid",
        "seatNumber": "A1",
        "rowLabel": "A",
        "columnNumber": 1,
        "status": "AVAILABLE",  // AVAILABLE | LOCKED | BOOKED
        "lockedBy": null,       // user ID if locked
        "lockedUntil": null     // ISO timestamp if locked
      }
    ]
  }
}
```

**Seat Grid UI:**
- Render as rows × columns grid
- Color coding:
  - **Green** (#22c55e) → AVAILABLE (clickable)
  - **Yellow** (#eab308) → LOCKED by another user (not clickable)
  - **Red** (#ef4444) → BOOKED (not clickable)
  - **Blue/Purple** (#8b5cf6) → LOCKED by current user (show timer)
- On click (AVAILABLE seat):
  - Call `POST /api/seats/:seatId/lock` with `{ "sessionId": "<uuid>" }`
  - Generate sessionId once per page load, store in state
  - On success → seat turns Blue, show countdown timer
  - On failure (409) → show toast "Seat locked by another user" + queue position

**Lock Response:**
```json
// POST /api/seats/:seatId/lock
// Request: { "sessionId": "uuid-v4" }
// Response:
{
  "success": true,
  "data": {
    "lockToken": "uuid",
    "seatId": "uuid",
    "expiresAt": "2026-05-05T12:05:00.000Z",
    "ttlSeconds": 300
  }
}
```

**Countdown Timer:**
- Display: "Time remaining: 4:32"
- Calculate from `expiresAt` field
- On expiry: show "Lock expired" toast, seat reverts to green
- "Proceed to Payment" button → navigate to `/events/[eventId]/payment?seat=<seatId>&token=<lockToken>`

**Legend:**
- Show color legend below the grid
- Show availability counts: "Available: 75 | Locked: 3 | Booked: 2"

**API for availability:** `GET /api/events/:eventId/availability`
```json
{ "success": true, "data": { "total": 80, "available": 75, "locked": 3, "booked": 2 } }
```

---

### 3.4 Payment Simulation (`/events/[eventId]/payment`)

**Query params:** `?seat=<seatId>&token=<lockToken>&session=<sessionId>`

**UI Elements:**
- Seat info card (seat number, event title, row/column)
- Amount field (editable, default 500)
- Countdown timer (same lock timer, continue counting down)
- **4 simulation buttons:**
  - "Pay Successfully" (green) → `POST /api/payments/simulate-success`
  - "Simulate Failure" (red) → `POST /api/payments/simulate-failure`
  - "Simulate Timeout" (orange) → `POST /api/payments/simulate-timeout`
  - "Simulate Crash" (dark) → `POST /api/payments/simulate-crash`

**All payment endpoints require:**
```json
// Request body (same for all 4)
{
  "seatId": "uuid",
  "sessionId": "uuid",
  "lockToken": "uuid",
  "amount": 500
}
```

**Responses:**

Success:
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "uuid",
      "bookingCode": "A3K7NP2X",
      "seatId": "uuid",
      "paymentStatus": "SUCCESS",
      "bookingStatus": "CONFIRMED"
    },
    "paymentStatus": "SUCCESS"
  }
}
```

Failure/Timeout:
```json
{
  "success": true,
  "data": {
    "booking": { "bookingCode": "FAIL-...", "paymentStatus": "FAILED", "bookingStatus": "CANCELLED" },
    "paymentStatus": "FAILED"
  }
}
```

Crash:
```json
{
  "success": true,
  "data": {
    "booking": { "paymentStatus": "PENDING", "bookingStatus": "PENDING" },
    "paymentStatus": "CRASH_SIMULATED"
  }
}
```

**After success:** redirect to `/bookings/[bookingId]`
**After failure/timeout:** show error toast, redirect back to seat selection
**After crash:** show info banner "Server crash simulated — recovery worker will clean up"

**Error case (410 — lock expired):**
```json
{ "success": false, "error": { "code": "LOCK_EXPIRED", "message": "Lock has expired — cannot process payment" } }
```

---

### 3.5 My Bookings (`/bookings`)

**API:** `GET /api/bookings/my`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bookingCode": "A3K7NP2X",
      "paymentStatus": "SUCCESS",
      "bookingStatus": "CONFIRMED",
      "amount": 500,
      "createdAt": "2026-05-05T12:05:30.000Z",
      "event": { "id", "title", "type", "eventDate" },
      "seat": { "seatNumber": "A5", "rowLabel": "A", "columnNumber": 5 }
    }
  ]
}
```

**UI:** Table/card list showing booking code, event, seat, status badge, date.

---

### 3.6 Booking Details (`/bookings/[bookingId]`)

**API:** `GET /api/bookings/:bookingId`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingCode": "A3K7NP2X",
    "paymentStatus": "SUCCESS",
    "bookingStatus": "CONFIRMED",
    "amount": 500,
    "createdAt": "...",
    "event": { "id", "title", "type", "source", "destination", "venue", "eventDate" },
    "seat": { "id", "seatNumber", "rowLabel", "columnNumber" },
    "payments": [{ "id", "amount", "status", "simulationType", "createdAt" }]
  }
}
```

**UI:** Ticket-style card with booking code, QR code placeholder, event details, seat info, download button.

---

### 3.7 Admin Dashboard (`/admin`)

**API:** `GET /api/admin/dashboard`
```json
{
  "success": true,
  "data": {
    "totalEvents": 3,
    "totalSeats": 430,
    "availableSeats": 400,
    "lockedSeats": 10,
    "bookedSeats": 20,
    "activeLocksCount": 10,
    "totalBookings": 20,
    "totalRecoveries": 5
  }
}
```

**Additional APIs:**
- `GET /api/admin/active-locks` — list of active locks with TTL
- `GET /api/admin/bookings?page=1&limit=20` — paginated bookings
- `GET /api/recovery/logs?page=1&limit=20` — recovery history
- `GET /api/recovery/stats` — recovery statistics
- `POST /api/admin/reset-demo` — reset demo data
- `POST /api/recovery/run` — manually trigger recovery

**UI Elements:**
- Stats cards (total seats, available, locked, booked, recoveries)
- Active locks table with countdown TTL
- Recent bookings table
- Recovery logs table
- Buttons: "Reset Demo", "Run Recovery", "Race Test"

---

### 3.8 Race Condition Simulation (`/admin/simulation`)

**API:** `POST /api/admin/race-test`
```json
// Request
{ "eventId": "uuid", "seatId": "uuid", "concurrentUsers": 50 }
// Response
{
  "success": true,
  "data": {
    "totalAttempts": 50,
    "successCount": 1,
    "failedCount": 49,
    "winner": { "userId": "race-user-7", "lockToken": "uuid" },
    "timingMs": 45
  }
}
```

**UI:**
- Select event and seat from dropdowns
- Slider for concurrent users (10-100)
- "Run Test" button
- Results display: pie chart (1 success, 49 failed), timing, winner info
- Explanation text: "This proves only 1 user can lock a seat despite 50 simultaneous attempts"

---

## 4. WebSocket Integration

### Connection Setup
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: localStorage.getItem('eves_token') },
  transports: ['websocket', 'polling'],
});
```

### Room Management
```typescript
// Join event room when viewing seat grid
socket.emit('join:event', eventId);

// Leave when navigating away
socket.emit('leave:event', eventId);
```

### Events to Listen For

| Event | Payload | Action |
|-------|---------|--------|
| `seat:locked` | `{ seatId, userId, expiresAt }` | Update seat to yellow (or blue if current user) |
| `seat:available` | `{ seatId }` | Update seat to green |
| `seat:booked` | `{ seatId, bookingCode, userId }` | Update seat to red |
| `lock:expired` | `{ seatId, message }` | Update seat to green, show toast |
| `payment:failed` | `{ seatId, userId }` | Update seat to green |
| `payment:crashed` | `{ seatId, message }` | Show info banner |
| `queue:update` | `{ seatId, nextUserId, message }` | Show "seat available" notification to queued user |
| `booking:confirmed` | `{ bookingId, bookingCode, seatId, userId }` | Show success notification |

### Real-Time Seat Grid Update Logic
```typescript
socket.on('seat:locked', ({ seatId, userId, expiresAt }) => {
  updateSeatStatus(seatId, 'LOCKED', userId, expiresAt);
});

socket.on('seat:available', ({ seatId }) => {
  updateSeatStatus(seatId, 'AVAILABLE', null, null);
});

socket.on('seat:booked', ({ seatId }) => {
  updateSeatStatus(seatId, 'BOOKED', null, null);
});
```

---

## 5. State Management

### Zustand Stores

```typescript
// authStore
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
}

// seatStore (for current event view)
interface SeatStore {
  seats: Seat[];
  myLock: { seatId: string; lockToken: string; expiresAt: Date; sessionId: string } | null;
  updateSeat: (seatId: string, updates: Partial<Seat>) => void;
  setMyLock: (lock: LockResult | null) => void;
}
```

### React Query Keys
```typescript
const queryKeys = {
  events: ['events'],
  event: (id: string) => ['events', id],
  seats: (eventId: string) => ['events', eventId, 'seats'],
  availability: (eventId: string) => ['events', eventId, 'availability'],
  myBookings: ['bookings', 'my'],
  booking: (id: string) => ['bookings', id],
  adminDashboard: ['admin', 'dashboard'],
  activeLocks: ['admin', 'active-locks'],
  recoveryLogs: ['recovery', 'logs'],
};
```

---

## 6. Session ID

Generate **one UUID per browser tab** on page load for the seat selection page:
```typescript
const sessionId = useMemo(() => crypto.randomUUID(), []);
```

Pass this `sessionId` in:
- Lock request body
- Payment request body
- Release request header (`X-Session-Id`) or body

This prevents the same user from locking the same seat in two tabs.

---

## 7. Error Handling

All API errors follow this shape:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",        // VALIDATION_ERROR | AUTHENTICATION_ERROR | AUTHORIZATION_ERROR | NOT_FOUND | CONFLICT | LOCK_EXPIRED | SERVICE_UNAVAILABLE | INTERNAL_ERROR
    "message": "Human readable message"
  }
}
```

**Key error codes to handle:**
- `401` → redirect to login
- `403` → show "admin required" message
- `409 CONFLICT` → seat already locked/booked, refresh grid
- `410 LOCK_EXPIRED` → lock timeout, show retry prompt
- `503` → Redis unavailable, show "try again" message

---

## 8. UI Design Guidelines

- **Theme:** Clean, modern, professional. NOT purple AI theme.
- **Colors:** 
  - Primary: Blue (#2563eb)
  - Success: Green (#22c55e)
  - Warning: Yellow (#eab308)
  - Danger: Red (#ef4444)
  - Locked-by-me: Purple (#8b5cf6)
- **Components:** Use shadcn/ui (Button, Card, Dialog, Table, Badge, Toast, Skeleton)
- **Animations:** Framer Motion for:
  - Seat status transitions (color change)
  - Timer countdown pulse
  - Page transitions
  - Lock/unlock feedback
  - Success confetti on booking confirmation
- **Responsive:** Mobile-first, seat grid should scroll horizontally on mobile
- **Loading states:** Skeleton loaders for seat grid, shimmer for cards

---

## 9. Deployment Wiring

### Environment Variables (Frontend)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001    # Backend API URL
NEXT_PUBLIC_WS_URL=http://localhost:3001     # Socket.IO URL (same as API)
```

### CORS
Backend accepts requests from `CORS_ORIGIN` env var. Set to your Vercel deployment URL in production.

### Vercel Deployment
- Framework: Next.js
- Build command: `npm run build`
- Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

---

## 10. File Structure (Frontend)

```
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── events/
│   │   ├── page.tsx                # Event list
│   │   └── [eventId]/
│   │       ├── page.tsx            # Seat selection
│   │       └── payment/page.tsx    # Payment simulation
│   ├── bookings/
│   │   ├── page.tsx                # My bookings
│   │   └── [bookingId]/page.tsx    # Booking detail
│   └── admin/
│       ├── page.tsx                # Dashboard
│       └── simulation/page.tsx     # Race test
├── components/
│   ├── ui/                         # shadcn components
│   ├── SeatGrid.tsx                # Main seat grid component
│   ├── SeatCell.tsx                # Individual seat with color logic
│   ├── CountdownTimer.tsx          # Lock TTL countdown
│   ├── PaymentButtons.tsx          # 4 simulation buttons
│   ├── BookingCard.tsx             # Booking display card
│   ├── EventCard.tsx               # Event list card
│   ├── AdminStats.tsx              # Dashboard stat cards
│   ├── RaceTestPanel.tsx           # Race simulation UI
│   └── Navbar.tsx                  # Navigation with auth state
├── hooks/
│   ├── useSocket.ts                # Socket.IO connection + events
│   ├── useAuth.ts                  # Auth state hook
│   ├── useSeatGrid.ts             # Seat data + real-time updates
│   ├── useCountdown.ts            # Timer logic
│   └── useLock.ts                 # Lock/release operations
├── lib/
│   ├── api.ts                      # Axios/fetch client with auth interceptor
│   ├── socket.ts                   # Socket.IO singleton
│   └── utils.ts                    # Helpers
├── store/
│   ├── authStore.ts                # Zustand auth store
│   └── seatStore.ts               # Zustand seat state
└── styles/
    └── globals.css                 # Tailwind imports
```

---

## 11. Critical Implementation Notes

1. **Never trust frontend state for seat availability** — always reflect server state via Socket.IO events
2. **SessionId must be unique per tab** — prevents double-locking from same user
3. **Timer must use server `expiresAt`** — don't rely on client-side calculation alone, sync with server time
4. **Invalidate React Query cache on WebSocket events** — when a seat:booked event arrives, invalidate the seats query
5. **Handle race between HTTP response and WebSocket** — lock response may arrive before/after the socket event, deduplicate updates
6. **Admin routes must check role client-side** — redirect non-admins, but backend enforces actual authorization

---

## 12. Testing the Integration

1. Open two browser tabs on the same seat selection page
2. Lock a seat from Tab 1 → Tab 2 should see it turn yellow instantly
3. Simulate payment failure from Tab 1 → both tabs see seat go green
4. Lock from Tab 2 → simulate success → both see it go red
5. Lock a seat → wait 5 minutes → should auto-expire and go green (recovery worker)
6. Run race test from admin → confirm exactly 1 success
