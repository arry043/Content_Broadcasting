# Content Broadcasting System — API Documentation

> A school content management & broadcasting backend with role-based access, approval workflows, time-based rotation scheduling, and analytics.

**Base URL:** `http://localhost:5001/api/v1`

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Setup](#project-setup)
- [Seeded Test Accounts](#seeded-test-accounts)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [1. Authentication](#1-authentication)
  - [2. Content Management (Teacher)](#2-content-management-teacher-only)
  - [3. Approval Workflow (Principal)](#3-approval-workflow-principal-only)
  - [4. Public Broadcasting API](#4-public-broadcasting-api-no-auth)
  - [5. Analytics (Principal)](#5-analytics-principal-only)
- [Error Handling](#error-handling)
- [Testing Guide](#testing-guide)
  - [Running Jest Unit Tests](#1-jest-unit-tests)
  - [Running Newman (Postman CLI)](#2-newman-integration-tests-postman-cli)
  - [Manual cURL Testing](#3-manual-curl-testing)
  - [Full End-to-End Flow](#4-full-end-to-end-curl-flow)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run database migrations (creates tables in Neon PostgreSQL)
npm run migrate

# 3. Seed test users into the database
npm run seed

# 4. Start the development server
npm run dev

# Server starts on http://localhost:5001
```

---

## Project Setup

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | v18+ | Tested on v25.8.0 |
| PostgreSQL | Neon (cloud) | Connection string in `.env` |
| Redis | Optional | Graceful fallback if unavailable |

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=24h
REDIS_URL=redis://localhost:6379
USE_S3=false
MAX_FILE_SIZE_MB=10
UPLOADS_DIR=uploads/content
```

### Database Setup

```bash
# Run all migrations (creates Users, Content, ContentSlots, ContentSchedules, Analytics)
npm run migrate

# Seed test users
npm run seed

# Undo migrations (if needed)
npm run migrate:undo
```

---

## Seeded Test Accounts

After running `npm run seed`, these accounts are available:

| Role | Email | Password |
|---|---|---|
| Principal | `principal@school.com` | `principal@123` |
| Teacher 1 | `teacher1@school.com` | `teacher@123` |
| Teacher 2 | `teacher2@school.com` | `teacher@123` |
| Teacher 3 | `teacher3@school.com` | `teacher@123` |

---

## API Endpoints

### Health Check

```
GET /api/v1/health
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

### 1. Authentication

#### Login

```
POST /auth/login
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | ✅ | Valid email format |
| `password` | string | ✅ | Account password |

**Request Body:**
```json
{
  "email": "teacher1@school.com",
  "password": "teacher@123"
}
```

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "d1e8907e-002a-458a-8831-84cae8a80dd6",
      "name": "Teacher One",
      "email": "teacher1@school.com",
      "role": "teacher"
    }
  }
}
```

**Error Responses:**
- `400` — Validation error (missing email/password)
- `401` — Invalid email or password
- `403` — Account is inactive

#### Get Current User

```
GET /auth/me
```

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "role": "teacher" }
  }
}
```

---

### 2. Content Management (Teacher Only)

> All endpoints require `Authorization: Bearer <TEACHER_TOKEN>` header.

#### Upload Content

```
POST /content/upload
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | JPG, PNG, or GIF (max 10MB) |
| `title` | string | ✅ | Content title |
| `subject` | enum | ✅ | `Maths`, `Science`, `English`, `History`, `Geography`, `Other` |
| `description` | string | ❌ | Optional description |
| `start_time` | ISO date | ❌ | Broadcast window start (required if end_time set) |
| `end_time` | ISO date | ❌ | Broadcast window end (required if start_time set) |
| `duration_minutes` | integer | ❌ | Rotation duration in minutes (default: 5) |

**Success Response:** `201 Created`

#### Get My Content

```
GET /content/my?status=pending&subject=Maths&page=1&limit=10
```

All query params are optional. Returns paginated results.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Content retrieved successfully",
  "data": {
    "content": [ ... ],
    "pagination": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
  }
}
```

#### Get Single Content

```
GET /content/my/:id
```

#### Delete My Content

```
DELETE /content/my/:id
```

> ⚠️ Cannot delete content with `approved` status.

---

### 3. Approval Workflow (Principal Only)

> All endpoints require `Authorization: Bearer <PRINCIPAL_TOKEN>` header.

#### Get Pending Content

```
GET /approval/pending?subject=Maths&teacher_id=<uuid>&page=1&limit=10
```

#### Get All Content

```
GET /approval/all?status=approved&subject=Maths&page=1&limit=10
```

#### Approve Content

```
POST /approval/:contentId/approve
```

On approval: creates a `ContentSchedule` entry, assigns rotation order, and invalidates cache.

#### Reject Content

```
POST /approval/:contentId/reject
```

**Request Body:**
```json
{
  "rejection_reason": "Image quality is too low for classroom display"
}
```

> `rejection_reason` is required and must be at least 5 characters.

---

### 4. Public Broadcasting API (No Auth)

#### Get Live Content

```
GET /content/live/:teacherId?subject=Maths
```

- **No authentication required** — public endpoint
- **Rate limited:** 100 requests per 15 minutes per IP
- **Cached:** Response cached with TTL = time remaining in current rotation slot
- Returns currently active content based on time-based rotation algorithm
- `subject` query param is optional — omit to get all active subjects

**Response (content available):** `200 OK`
```json
{
  "available": true,
  "teacher": { "id": "...", "name": "Teacher One" },
  "active_content": {
    "id": "...",
    "title": "Maths Chapter 1 Notes",
    "subject": "Maths",
    "file_url": "/uploads/content/uuid.png",
    "file_type": "png",
    "rotation_ends_at": "2026-04-26T08:05:00.000Z"
  }
}
```

**Response (no content):** `200 OK`
```json
{ "available": false, "message": "No content available" }
```

---

### 5. Analytics (Principal Only)

> All endpoints require `Authorization: Bearer <PRINCIPAL_TOKEN>` header.

#### Subjects Analytics

```
GET /analytics/subjects
```

Returns total hit counts grouped by subject, sorted by most viewed.

#### Teachers Analytics

```
GET /analytics/teachers
```

Returns total hit counts grouped by teacher.

#### Single Content Analytics

```
GET /analytics/content/:contentId
```

---

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Optional array of detailed validation errors"]
}
```

| Status Code | Meaning |
|---|---|
| `400` | Validation error / Bad request |
| `401` | Authentication required / Invalid token |
| `403` | Insufficient permissions (wrong role) |
| `404` | Resource not found |
| `409` | Duplicate entry |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Testing Guide

### 1. Jest Unit Tests

Jest tests are located in `tests/api.test.js` and test core API behavior with mocked services.

**Run:**
```bash
npx jest --forceExit --detectOpenHandles
```

**What's tested:**

| Test | Description | Expected |
|---|---|---|
| `GET /api/v1/health` | Health check endpoint | `200`, `success: true` |
| `POST /auth/login` (no email) | Validation — missing email | `400`, error: "Email is required" |
| `POST /auth/login` (valid) | Successful login (mocked) | `200`, returns token |
| `GET /content/live/:id` | Public endpoint with invalid teacher | `200`, `available: false` |

**Expected Output:**
```
PASS  tests/api.test.js
  API Endpoints Testing
    GET /api/v1/health
      ✓ should return 200 and server running message
    POST /api/v1/auth/login
      ✓ should return 400 if email is missing
      ✓ should return 200 and token on successful login
    GET /api/v1/content/live/:teacherId
      ✓ should pass through rate limiter and return no content

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

> **Note:** Jest tests use mocked services and do NOT hit the real database. They validate routing, validation middleware, and response formats.

---

### 2. Newman Integration Tests (Postman CLI)

Newman runs the full Postman collection against a **live server** with a **real database**.

#### Prerequisites

```bash
# 1. Make sure server is running
npm run dev

# 2. Make sure migrations + seed have been run
npm run migrate
npm run seed
```

#### Run Newman

```bash
npx newman run postman_collection.json \
  -e postman_environment.json \
  --working-dir ./files
```

#### Flags Explained

| Flag | Purpose |
|---|---|
| `-e postman_environment.json` | Provides `BASE_URL` and variable placeholders for tokens |
| `--working-dir ./files` | Directory containing `test_image.png` for file upload |

#### What's Tested (8 Requests)

| # | Request | Method | Expected |
|---|---|---|---|
| 1 | Login (Teacher) | `POST /auth/login` | `200 OK` — saves `TEACHER_TOKEN` |
| 2 | Login (Principal) | `POST /auth/login` | `200 OK` — saves `PRINCIPAL_TOKEN` |
| 3 | Upload Content | `POST /content/upload` | `201 Created` |
| 4 | Get My Content | `GET /content/my` | `200 OK` — saves `CONTENT_ID` |
| 5 | Get Pending Content | `GET /approval/pending` | `200 OK` |
| 6 | Approve Content | `POST /approval/:id/approve` | `200 OK` |
| 7 | Get Live Content | `GET /content/live/:teacherId` | `200 OK` |
| 8 | Subjects Analytics | `GET /analytics/subjects` | `200 OK` |

#### Token Flow (Automatic)

The Postman collection has **test scripts** that automatically chain tokens between requests:

1. **Login (Teacher)** → extracts `token` and `user.id` → saves as `TEACHER_TOKEN` and `TEACHER_ID`
2. **Login (Principal)** → extracts `token` → saves as `PRINCIPAL_TOKEN`
3. **Get My Content** → extracts first content's `id` → saves as `CONTENT_ID`
4. All subsequent requests use these variables in `Authorization: Bearer {{TOKEN}}` headers

#### Expected Output

```
┌─────────────────────────┬────────────────────┬────────────────────┐
│                         │           executed │             failed │
├─────────────────────────┼────────────────────┼────────────────────┤
│              iterations │                  1 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│                requests │                  8 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│            test-scripts │                 11 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│      prerequest-scripts │                  8 │                  0 │
├─────────────────────────┼────────────────────┼────────────────────┤
│              assertions │                  0 │                  0 │
└─────────────────────────┴────────────────────┴────────────────────┘
```

---

### 3. Manual cURL Testing

#### Step 1 — Login as Teacher

```bash
curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@school.com","password":"teacher@123"}'
```

Save the `token` from the response for subsequent requests.

#### Step 2 — Login as Principal

```bash
curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"principal@school.com","password":"principal@123"}'
```

#### Step 3 — Upload Content (Teacher)

```bash
curl -s -X POST http://localhost:5001/api/v1/content/upload \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -F "file=@./files/test_image.png" \
  -F "title=Maths Chapter 1 Notes" \
  -F "subject=Maths" \
  -F "start_time=2024-01-01T00:00:00Z" \
  -F "end_time=2030-12-31T23:59:59Z" \
  -F "duration_minutes=5"
```

#### Step 4 — View My Content (Teacher)

```bash
curl -s http://localhost:5001/api/v1/content/my \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

#### Step 5 — View Pending Content (Principal)

```bash
curl -s http://localhost:5001/api/v1/approval/pending \
  -H "Authorization: Bearer <PRINCIPAL_TOKEN>"
```

#### Step 6 — Approve Content (Principal)

```bash
curl -s -X POST http://localhost:5001/api/v1/approval/<CONTENT_ID>/approve \
  -H "Authorization: Bearer <PRINCIPAL_TOKEN>"
```

#### Step 7 — View Live Content (Public)

```bash
curl -s http://localhost:5001/api/v1/content/live/<TEACHER_ID>
```

#### Step 8 — View Analytics (Principal)

```bash
curl -s http://localhost:5001/api/v1/analytics/subjects \
  -H "Authorization: Bearer <PRINCIPAL_TOKEN>"
```

---

### 4. Full End-to-End cURL Flow

Run the complete flow in one script:

```bash
#!/bin/bash
BASE="http://localhost:5001/api/v1"

echo "=== 1. Login Teacher ==="
TEACHER_RESP=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher1@school.com","password":"teacher@123"}')
TEACHER_TOKEN=$(echo $TEACHER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
TEACHER_ID=$(echo $TEACHER_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['id'])")
echo "Token: ${TEACHER_TOKEN:0:30}..."

echo ""
echo "=== 2. Login Principal ==="
PRINCIPAL_RESP=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"principal@school.com","password":"principal@123"}')
PRINCIPAL_TOKEN=$(echo $PRINCIPAL_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Token: ${PRINCIPAL_TOKEN:0:30}..."

echo ""
echo "=== 3. Upload Content ==="
curl -s -X POST $BASE/content/upload \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -F "file=@./files/test_image.png" \
  -F "title=Science Chapter 3" \
  -F "subject=Science" \
  -F "start_time=2024-01-01T00:00:00Z" \
  -F "end_time=2030-12-31T23:59:59Z" \
  -F "duration_minutes=5" | python3 -m json.tool

echo ""
echo "=== 4. Get My Content ==="
MY_CONTENT=$(curl -s $BASE/content/my -H "Authorization: Bearer $TEACHER_TOKEN")
echo $MY_CONTENT | python3 -m json.tool
CONTENT_ID=$(echo $MY_CONTENT | python3 -c "import sys,json; d=json.load(sys.stdin)['data']['content']; print(d[0]['id'] if d else 'none')")

echo ""
echo "=== 5. Get Pending (Principal) ==="
curl -s $BASE/approval/pending \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" | python3 -m json.tool

echo ""
echo "=== 6. Approve Content ==="
curl -s -X POST $BASE/approval/$CONTENT_ID/approve \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" | python3 -m json.tool

echo ""
echo "=== 7. Live Content (Public) ==="
curl -s $BASE/content/live/$TEACHER_ID | python3 -m json.tool

echo ""
echo "=== 8. Analytics ==="
curl -s $BASE/analytics/subjects \
  -H "Authorization: Bearer $PRINCIPAL_TOKEN" | python3 -m json.tool

echo ""
echo "=== ALL TESTS COMPLETE ==="
```

Save as `test_e2e.sh` and run:
```bash
chmod +x test_e2e.sh
./test_e2e.sh
```

---

## Architecture Overview

```
Request Flow:
Client → Express → rateLimiter → authMiddleware → rbacMiddleware
       → validateMiddleware → uploadMiddleware → Controller → Service → DB
       → Response (or errorHandler if error)
```

### Project Structure

```
├── server.js                    # Express app entry point
├── .env                         # Environment configuration
├── postman_collection.json      # Postman/Newman test collection
├── postman_environment.json     # Newman environment variables
├── files/                       # Test files for upload testing
│   └── test_image.png
├── uploads/content/             # Local file storage
├── tests/
│   └── api.test.js              # Jest unit tests
└── src/
    ├── config/
    │   ├── config.js            # Sequelize DB config (dev/prod/test)
    │   ├── database.js          # Sequelize instance
    │   ├── redis.js             # Redis client with graceful fallback
    │   ├── multer.js            # File upload configuration
    │   └── s3.js                # AWS S3 client (optional)
    ├── controllers/             # HTTP request/response handlers
    │   ├── auth.controller.js
    │   ├── content.controller.js
    │   ├── approval.controller.js
    │   ├── broadcast.controller.js
    │   └── analytics.controller.js
    ├── services/                # Business logic layer
    │   ├── auth.service.js      # Login + password verification
    │   ├── upload.service.js    # Local/S3 file upload
    │   ├── approval.service.js  # Approve/reject + schedule creation
    │   ├── scheduling.service.js # Time-based rotation algorithm
    │   ├── cache.service.js     # Redis caching with fallback
    │   └── analytics.service.js # Aggregated analytics queries
    ├── models/                  # Sequelize ORM models
    │   ├── User.js
    │   ├── Content.js
    │   ├── ContentSlot.js
    │   ├── ContentSchedule.js
    │   └── Analytics.js
    ├── middlewares/
    │   ├── auth.middleware.js    # JWT verification
    │   ├── rbac.middleware.js    # Role-based access control
    │   ├── validate.middleware.js # Joi schema validation
    │   ├── upload.middleware.js  # Multer file handling
    │   ├── rateLimiter.middleware.js # Rate limiting (in-memory)
    │   └── errorHandler.middleware.js # Global error handler
    ├── validations/             # Joi validation schemas
    ├── migrations/              # Sequelize migration files
    ├── seeders/                 # Database seed data
    ├── routes/                  # Express route definitions
    └── utils/                   # Helper utilities
```

### Key Design Decisions

- **Stateless Rotation:** No cron jobs — rotation position calculated mathematically using `(now - anchor) % totalCycle`
- **Redis Optional:** All Redis operations wrapped in try/catch with `null` fallback
- **File Storage:** Abstracted behind `upload.service.js` — toggle local/S3 via `USE_S3` env var
- **Role Isolation:** RBAC middleware prevents any role mixing at the route level

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| Database | PostgreSQL (Neon) + Sequelize ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Joi |
| File Upload | Multer (local) / AWS S3 (optional) |
| Caching | Redis (ioredis) — optional |
| Rate Limiting | express-rate-limit (in-memory) |
| Testing | Jest + Supertest (unit), Newman (integration) |
| Logging | Morgan (HTTP) + Winston (app) |
