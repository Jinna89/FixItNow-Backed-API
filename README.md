# FixItNow 🔧 — Backend API

"Your Trusted Home Service Platform" — a backend API for a home services
marketplace built with **Node.js, Express, PostgreSQL, and Prisma ORM**.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing
- **Payments:** SSLCommerz (sandbox by default)
- **Validation:** Zod
- **Security:** Helmet, CORS, rate limiting

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```
At minimum, set `DATABASE_URL` to a running PostgreSQL instance, and generate
strong random values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
(e.g. `openssl rand -hex 32`).

For payments, register a free sandbox store at
https://developer.sslcommerz.com/registration/ and fill in
`SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD`.

### 3. Set up the database
```bash
npm run prisma:migrate   # creates tables from prisma/schema.prisma
npm run seed              # creates the admin account + default categories
```

### 4. Run the server
```bash
npm run dev     # development (nodemon)
npm start       # production
```
The API will be available at `http://localhost:5050`.

## Admin Credentials (mandatory requirement)

The seed script creates a working admin account from your `.env` values:

| Field | Default (override in `.env`) |
|---|---|
| Email | `admin@fixitnow.com` |
| Password | `Admin@12345` |

⚠️ Change these in production via `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding.

## Response Format (mandatory requirement)

**Success:**
```json
{ "success": true, "message": "Services fetched", "data": [ /* ... */ ] }
```

**Error:**
```json
{ "success": false, "message": "Validation failed", "errorDetails": [ /* ... */ ] }
```

All input is validated server-side with Zod before reaching a controller;
validation failures return `400` with field-level `errorDetails`.

## Roles & Permissions

| Role | Key Permissions |
|---|---|
| `CUSTOMER` | Browse services, book technicians, pay, track bookings, leave reviews |
| `TECHNICIAN` | Manage profile & services, set availability, accept/decline/complete bookings |
| `ADMIN` | Manage users (ban/unban), view all bookings, manage categories |

Role is selected at registration (`POST /api/auth/register`). Admin accounts
are only created via the seed script, not via public registration.

## Booking Status Flow

```
REQUESTED → ACCEPTED → PAID → IN_PROGRESS → COMPLETED
    │           │
    ▼           ▼
DECLINED    CANCELLED
```
Customers may cancel any booking before it reaches `IN_PROGRESS`
(`PATCH /api/bookings/:id/cancel`).

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register (customer/technician) |
| POST | `/api/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Public | Rotate refresh token for a new access token |
| POST | `/api/auth/logout` | Public | Revoke a refresh token |
| GET | `/api/auth/me` | 🔒 Any | Current authenticated user |

### Public: Services, Technicians, Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/services` | Filter by `categoryId`, `location`, `minPrice`, `maxPrice`, `minRating`, `search` |
| GET | `/api/technicians` | Filter by `location`, `minRating`, `skill` |
| GET | `/api/technicians/:id` | Technician profile with services + reviews |
| GET | `/api/categories` | All service categories |

### Bookings (🔒 Customer, unless noted)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create a booking request |
| GET | `/api/bookings` | List my bookings |
| GET | `/api/bookings/:id` | 🔒 Customer/Technician (owner)/Admin |
| PATCH | `/api/bookings/:id/cancel` | Cancel before `IN_PROGRESS` |

### Payments (🔒 Customer, unless noted)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create` | Start an SSLCommerz session for an `ACCEPTED` booking |
| POST/GET | `/api/payments/confirm` | SSLCommerz IPN/redirect callback (no auth) |
| GET | `/api/payments` | 🔒 My payment history |
| GET | `/api/payments/:id` | 🔒 Payment details |

### Technician Management (🔒 Technician)
| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/technician/profile` | Update bio, skills, rate, location |
| POST | `/api/technician/services` | Create a service offering |
| PUT | `/api/technician/services/:id` | Update a service offering |
| PUT | `/api/technician/availability` | Set availability slots |
| GET | `/api/technician/bookings` | My incoming bookings |
| PATCH | `/api/technician/bookings/:id` | Accept/decline/progress/complete |

### Reviews (🔒 Customer)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reviews` | Review a `COMPLETED` booking |

### Admin (🔒 Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id` | Ban/unban a user |
| GET | `/api/admin/bookings` | List all bookings |
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create a category |

## Database Schema

Defined in `prisma/schema.prisma`:

- **User** — auth, profile, `role` (CUSTOMER/TECHNICIAN/ADMIN), `status` (ACTIVE/BANNED)
- **RefreshToken** — rotated JWT refresh tokens
- **TechnicianProfile** — 1:1 with User; skills, rate, location, aggregate rating
- **Category** — service categories
- **Service** — offerings created by a technician, tied to a category
- **Availability** — technician time slots, `isBooked` flag
- **Booking** — links customer, technician, service, optional slot; status machine
- **Payment** — 1:1 with Booking; SSLCommerz transaction + validation data
- **Review** — 1:1 with Booking; feeds `TechnicianProfile.avgRating`

## Project Structure
```
src/
├── config/db.js           # Prisma client singleton
├── controllers/           # Route handlers
├── middleware/             # auth, validate, errorHandler
├── routes/                 # Express routers
├── utils/                  # apiResponse, asyncHandler, jwt, sslcommerz
├── validators/              # Zod schemas
├── app.js                  # Express app setup
└── server.js                # Entry point
prisma/
├── schema.prisma
└── seed.ts                  # Admin + category seeding
```

## Notes

- Payment simulation (Cash on Delivery / Pay Later) is intentionally **not**
  implemented per the mandatory requirement — SSLCommerz sandbox is the only
  supported flow. Swap `SSLCOMMERZ_IS_LIVE=true` and live credentials to go
  to production.
- Booking → Payment → Status transitions are enforced server-side
  (`technicianController.js`, `paymentController.js`) so clients cannot skip
  states (e.g. cannot mark `COMPLETED` without passing through `PAID` and
  `IN_PROGRESS`).
# FixItNow-Backed-API
