# Reflex Delivery System

PERN stack (Postgres via Supabase, Express, React, Node), with role-based auth (JWT + bcrypt)
and live updates over Socket.IO.

```
Users (Retailer / Dispatcher / Rider)
        │
   React Frontend  ──── Socket.IO (live events) ────┐
        │                                            │
  HTTPS / REST API  ◄────── JWT on every request ────┘
        │
  Node + Express + Socket.IO
        │
   Supabase (Postgres)
```

## Setup

### 1. Database (Supabase)
1. Create a project at supabase.com.
2. Open the SQL editor and run `backend/db/schema.sql`.
3. Copy your project URL and `service_role` key (Project Settings → API).

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm run dev
```
API + Socket.IO run on `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Auth flow

- `POST /auth/register` — creates a user with a bcrypt-hashed password (12 salt rounds), returns a JWT.
- `POST /auth/login` — verifies password with bcrypt, returns a JWT.
- Every other REST route requires `Authorization: Bearer <token>`.
- The same JWT is passed to Socket.IO on connect (`socket.handshake.auth.token`) and
  verified before the socket is allowed to join any room.
- Role is embedded in the JWT payload and enforced server-side on both REST routes
  (`requireRole('dispatcher')`, etc.) and socket rooms (`role:dispatcher`, `user:<id>`) —
  the frontend never decides what a user can do, it just reflects what the server allows.

## Live events (Socket.IO)

| Event | Room | Emitted when |
|---|---|---|
| `delivery:new` | `role:dispatcher` | A retailer creates an order |
| `delivery:assigned` | `role:dispatcher` | A dispatcher assigns any order (so all dispatcher screens stay in sync) |
| `assignment:new` | `user:<rider_id>` | A rider is assigned a delivery |
| `delivery:status` | `role:dispatcher`, `user:<retailer_id>` | A rider advances a delivery's status |

## API summary

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | /auth/register | — | Create account (any role) |
| POST | /auth/login | — | Log in |
| GET  | /users/me | any | Current user profile |
| GET  | /users?role=rider | any | List users by role |
| POST | /deliveries | retailer | Create an order |
| GET  | /deliveries?status=pending | any | List orders (retailers see only their own) |
| GET  | /deliveries/:id | any | Order detail + history + assignment |
| POST | /assignments | dispatcher | Assign rider to order |
| POST | /status/:deliveryId | rider, dispatcher | Advance status (riders: forward-only, must be assigned) |

deployed link: https://reflex-delivery-murex.vercel.app/

