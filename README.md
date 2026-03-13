# [NestSocial](https://nest-social-media-app-frontend.vercel.app/posts)

## Overview

NestSocial is a production-style social media app built with NestJS (backend) and Next.js (frontend). It includes JWT authentication with refresh token rotation, email verification, post feed and detail views, comments, likes, follows, file uploads, Redis caching, and RBAC.

## Repository Structure

```
backend/
  src/
    modules/
      auth/      # Register, verify email, login, refresh, logout
      users/     # Profiles, admin user management
      posts/     # Feed, post CRUD, filtering, sorting
      comments/  # Per-post comments
      likes/     # Per-post likes (toggle)
      follows/   # Follow/unfollow and follower/following lists
      upload/    # Avatar and post image upload
      mail/      # Verification email templates/service
frontend/
  src/
    app/         # Next.js routes (auth, feed/posts, profile, upload)
    components/  # Reusable UI + social components
    hooks/       # Auth/posts/post/comments/likes hooks
    lib/         # Axios client + token helpers
    types/       # API-facing TypeScript types
```

## Core Features

- Email verification flow:
  register returns a confirmation message, user verifies via token link.
- JWT auth:
  access + refresh tokens, token rotation, logout invalidation.
- Social interactions:
  create posts, view feed, like/unlike, comment, follow/unfollow.
- Profile pages:
  user info + follower/following counts + authored posts.
- Uploads:
  avatar and post image upload endpoints.
- Production-grade backend concerns:
  caching, throttling, validation, exception filters, Swagger.

## Main API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create account and send verification email |
| POST | /api/auth/verify-email | Public | Verify account by token |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/refresh | Public | Rotate tokens |
| GET | /api/auth/me | Bearer | Current user profile |
| POST | /api/auth/logout | Bearer | Logout and revoke refresh tokens |
| GET | /api/posts | Public | Feed/list posts (pagination/filter/sort/feed mode) |
| GET | /api/posts/:id | Public | Single post detail |
| POST | /api/posts | Bearer | Create post |
| PATCH | /api/posts/:id | Bearer | Update own post |
| DELETE | /api/posts/:id | Bearer | Delete own post or admin delete |
| GET | /api/posts/:postId/comments | Public | List comments for post |
| POST | /api/posts/:postId/comments | Bearer | Add comment |
| PATCH | /api/posts/:postId/comments/:id | Bearer | Update comment (owner/admin) |
| DELETE | /api/posts/:postId/comments/:id | Bearer | Delete comment (owner/admin) |
| GET | /api/posts/:postId/likes | Public | List likes for post |
| POST | /api/posts/:postId/likes | Bearer | Toggle like |
| GET | /api/users/:id | Public | Public user profile |
| POST | /api/users/:id/follow | Bearer | Toggle follow |
| GET | /api/users/:id/followers | Public | Followers list |
| GET | /api/users/:id/following | Public | Following list |
| POST | /api/upload/avatar | Bearer | Upload avatar |
| POST | /api/upload/post-image | Bearer | Upload post image |

Swagger: http://localhost:3000/api/docs

## Local Development

### 1) Start Infrastructure

Use Docker Compose (recommended):

```bash
docker compose up -d postgres redis mailhog
```

MailHog UI: http://localhost:8025

### 2) Backend Setup

```bash
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
```

Backend runs on http://localhost:3000

### 3) Frontend Setup

```bash
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend runs on http://localhost:3001

## Full Stack with Docker

```bash
docker compose up --build
```

Services:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- MailHog: http://localhost:8025
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Environment Variables

### backend/.env

| Variable | Description |
|---|---|
| APP_PORT | Backend port (default 3000) |
| DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_SYNC | Database settings |
| JWT_ACCESS_SECRET, JWT_REFRESH_SECRET | JWT signing secrets |
| JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES | Token TTLs |
| REDIS_HOST, REDIS_PORT | Redis settings |
| CORS_ORIGIN | Allowed frontend origin |
| MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM | SMTP/mail settings |
| FRONTEND_URL | URL used in verification email links |

### frontend/.env.local

| Variable | Description |
|---|---|
| NEXT_PUBLIC_API_URL | Backend base URL (default http://localhost:3000 in example can be changed) |

## Testing & Validation

Backend:

```bash
cd backend
npx tsc --noEmit
npm test -- --testPathPatterns="unit"
```

Current status after recent updates:
- TypeScript build: passing
- Unit tests: 82/82 passing

## Deployment

### Live Demo
- [API + Swagger](https://socialapp-backend-production-372e.up.railway.app/api/docs)
- [Frontend](https://socialapp-frontend.vercel.app)

### Stack
- Frontend → Vercel (free, no sleep)
- Backend + PostgreSQL + Redis → Railway (~$0 without traffic)

### CI/CD Pipeline
Every push triggers GitHub Actions:
- `develop` / PR → runs unit + e2e tests only
- `main` → tests → docker build check → deploy to Railway + Vercel

### Required GitHub Secrets
| Secret | Where to get it |
|--------|----------------|
| `RAILWAY_TOKEN` | railway.app → Account Settings → Tokens |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | vercel.com → Account Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General |

