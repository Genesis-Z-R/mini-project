# Estudy Student Workspace - Node.js Express Backend 🎓

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

High-performance, production-ready Node.js + Express REST API backend for the **Estudy Student Workspace**. Built with ES Modules, Prisma ORM, BCrypt password hashing, JWT authentication, Zod validation, Multer file upload storage, Morgan logging, Swagger UI OpenAPI documentation, and 100% full compatibility with the React frontend.

---

## 🛠️ Technology Stack & Architecture

- **Runtime:** Node.js (ES Modules `"type": "module"`)
- **Web Framework:** Express 4 (`express`)
- **ORM & Database:** Prisma ORM 6 (`@prisma/client`, SQLite default / MySQL ready)
- **Authentication:** JWT (`jsonwebtoken`) & BCrypt (`bcryptjs`)
- **Validation:** Zod schemas (`zod`)
- **File Uploads:** Multer (`multer`) saving to `public/uploads`
- **Security & Utilities:** `cors`, `express-rate-limit`, `morgan`
- **Documentation:** Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)
- **Automated Testing:** Jest (`jest`, `supertest`)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Defaults in `.env`:
```env
PORT=8080
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="EstudySecretKeyForJWTSignatureGeneration32BytesLong!"
JWT_EXPIRES_IN="24h"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```

### 3. Run Database Migration
Initialize local database schema tables:
```bash
npx prisma migrate dev --name init
```

### 4. Launch Development Server
```bash
npm run dev
```
The server will start at `http://localhost:8080`.

---

## 🧪 Testing & Inspection

### 1. Run Automated Test Suite
```bash
npm test
```

### 2. Health Check Endpoint
```bash
curl http://localhost:8080/api/health
```

### 3. Swagger OpenAPI Documentation
Open your browser and navigate to:
```text
http://localhost:8080/api-docs
```

### 4. Prisma Studio (Database GUI)
```bash
npx prisma studio
```
Opens an interactive dashboard at `http://localhost:5555` to view and manage database records.

---

## 📂 Project Structure

```
backend/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── docker-compose.yml
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── uploads/                  # Static file storage directory
├── tests/
│   ├── auth.test.js              # Auth route tests
│   └── courses.test.js           # CRUD & 403 ownership tests
└── src/
    ├── app.js                    # Express app setup & middleware
    ├── server.js                 # HTTP listener entrypoint (port 8080)
    ├── swagger.js                # Swagger UI OpenAPI specification
    ├── config/
    │   ├── db.js                 # PrismaClient singleton
    │   └── env.js                # Zod environment variable validator
    ├── controllers/              # HTTP handlers
    ├── services/                 # Business logic & database queries
    ├── middlewares/              # Auth, Zod validation, ownership, upload, rate limiters
    ├── routes/                   # Express route modules
    ├── schemas/                  # Zod validation schemas
    └── utils/                    # JWT & response helper utilities
```

---

## 🐬 Running with MySQL (Optional / Production)

To connect to a live MySQL server or Docker MySQL container:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="mysql://estudy:estudypassword@localhost:3306/estudy_db"
   ```
3. If using Docker Desktop:
   ```bash
   docker compose up -d
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
