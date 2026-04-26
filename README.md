# 📡 Content Broadcasting System

A production-ready school content management & broadcasting backend built with **Node.js**, **Express 5**, **PostgreSQL (Neon)**, and **Sequelize ORM**.

Teachers upload content → Principal approves → System broadcasts via time-based rotation → Analytics track engagement.

---

## ✨ Features

- **JWT Authentication** with role-based access control (Principal & Teacher)
- **Content Upload** with file validation (JPG, PNG, GIF — max 10MB)
- **Approval Workflow** — Principal approves/rejects teacher content
- **Time-Based Rotation Broadcasting** — Stateless algorithm, no cron jobs needed
- **Subject-wise Scheduling** — Independent rotation per subject
- **Redis Caching** with graceful fallback (works without Redis)
- **Analytics Dashboard** — Hit counts by subject, teacher, and content
- **Rate Limiting** on public broadcasting endpoint
- **Comprehensive Error Handling** with structured JSON responses

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| Database | PostgreSQL (Neon Cloud) + Sequelize ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Joi |
| File Upload | Multer (local) / AWS S3 (optional) |
| Caching | Redis (ioredis) — optional, graceful fallback |
| Rate Limiting | express-rate-limit |
| Testing | Jest + Supertest (unit), Newman (integration) |

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/Content_Broadcasting_System.git
cd Content_Broadcasting_System

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 4. Run database migrations
npm run migrate

# 5. Seed test users
npm run seed

# 6. Start the server
npm run dev
```

Server starts at: **http://localhost:5001**

---

## 🔑 Test Accounts (Seeded)

| Role | Email | Password |
|---|---|---|
| Principal | `principal@school.com` | `principal@123` |
| Teacher 1 | `teacher1@school.com` | `teacher@123` |
| Teacher 2 | `teacher2@school.com` | `teacher@123` |
| Teacher 3 | `teacher3@school.com` | `teacher@123` |

---

## 📚 API Endpoints

| # | Endpoint | Method | Auth | Description |
|---|---|---|---|---|
| 1 | `/api/v1/health` | GET | ❌ | Health check |
| 2 | `/api/v1/auth/login` | POST | ❌ | Login (returns JWT) |
| 3 | `/api/v1/auth/me` | GET | ✅ | Get current user profile |
| 4 | `/api/v1/content/upload` | POST | 🧑‍🏫 Teacher | Upload content (multipart/form-data) |
| 5 | `/api/v1/content/my` | GET | 🧑‍🏫 Teacher | List my content (paginated) |
| 6 | `/api/v1/content/my/:id` | GET | 🧑‍🏫 Teacher | Get single content |
| 7 | `/api/v1/content/my/:id` | DELETE | 🧑‍🏫 Teacher | Delete content (pending/rejected only) |
| 8 | `/api/v1/approval/pending` | GET | 👨‍💼 Principal | List pending content |
| 9 | `/api/v1/approval/all` | GET | 👨‍💼 Principal | List all content |
| 10 | `/api/v1/approval/:id/approve` | POST | 👨‍💼 Principal | Approve content |
| 11 | `/api/v1/approval/:id/reject` | POST | 👨‍💼 Principal | Reject content |
| 12 | `/api/v1/content/live/:teacherId` | GET | ❌ Public | Get live broadcasting content |
| 13 | `/api/v1/analytics/subjects` | GET | 👨‍💼 Principal | Subject-wise analytics |
| 14 | `/api/v1/analytics/teachers` | GET | 👨‍💼 Principal | Teacher-wise analytics |
| 15 | `/api/v1/analytics/content/:id` | GET | 👨‍💼 Principal | Single content analytics |

> 📖 Full API documentation with request/response examples: **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

---

## 🧪 Testing

### Jest Unit Tests
```bash
npx jest --forceExit --detectOpenHandles
```
```
Tests: 4 passed, 4 total ✅
```

### Newman Integration Tests (Postman CLI)
```bash
# Make sure server is running first (npm run dev)
npx newman run postman_collection.json -e postman_environment.json --working-dir ./files
```
```
Requests: 8 passed, 0 failed ✅
```

### E2E Test Script
```bash
# Make sure server is running first (npm run dev)
bash test_e2e.sh
```
```
Results: 11 passed, 0 failed ✅
```

---

## 📁 Project Structure

```
├── server.js                     # App entry point
├── .env.example                  # Environment template
├── postman_collection.json       # Postman/Newman collection
├── postman_environment.json      # Newman environment
├── test_e2e.sh                   # E2E test script
├── files/test_image.png          # Test file for uploads
├── tests/api.test.js             # Jest unit tests
└── src/
    ├── config/                   # DB, Redis, Multer, S3 configs
    ├── controllers/              # Request handlers
    ├── services/                 # Business logic
    ├── models/                   # Sequelize models
    ├── middlewares/               # Auth, RBAC, Validation, Upload, Rate Limit, Error Handler
    ├── validations/              # Joi schemas
    ├── migrations/               # DB migrations
    ├── seeders/                  # Seed data
    ├── routes/                   # Express routes
    └── utils/                    # JWT, AppError, Response helpers
```

---

## 🏗️ Architecture

```
Client Request
  → Express Middleware Chain
    → Rate Limiter (public routes)
    → Auth Middleware (JWT verification)
    → RBAC Middleware (role check)
    → Validation Middleware (Joi)
    → Upload Middleware (Multer)
    → Controller → Service → Database
  → JSON Response (or Error Handler)
```

**Key Design Decisions:**
- **Stateless Rotation** — No cron jobs; position calculated via `(now - anchor) % totalCycle`
- **Redis Optional** — All cache ops wrapped in try/catch with `null` fallback
- **File Storage Abstracted** — Toggle local/S3 via `USE_S3` env var
- **Horizontally Scalable** — Stateless JWT + deterministic scheduling

---

## 🌐 Deployment (Render)

1. Push to GitHub
2. Create a **Web Service** on [render.com](https://render.com)
3. Set **Build Command:** `npm install && npm run migrate && npm run seed`
4. Set **Start Command:** `npm start`
5. Add environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your_neon_connection_string>`
   - `JWT_SECRET=<your_secret>`
   - `PORT=5001`

---

## 👤 Author

**Mohd Arif Ansari**
- Email: arifquerry@gmail.com
- Phone: 7081168219

---

## 📄 License

ISC
