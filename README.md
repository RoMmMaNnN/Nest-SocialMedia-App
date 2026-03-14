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

---

## Architecture & Technical Decisions

This project is structured as a modular NestJS backend plus a Next.js App Router frontend, with PostgreSQL for persistence, Redis for cache storage, and GitHub Actions for CI/CD. The architecture favors explicit boundaries and predictable API contracts over hidden framework magic. On the backend, request flow is standardized globally in `backend/src/main.ts` with `ValidationPipe`, `GlobalExceptionFilter`, `TransformInterceptor`, and `ClassSerializerInterceptor`, while feature concerns are isolated in module folders under `backend/src/modules/`. On the frontend, route groups in `frontend/src/app/(auth)` and `frontend/src/app/(dashboard)` separate unauthenticated and authenticated UX paths, while custom hooks in `frontend/src/hooks/` encapsulate API workflows.

### NestJS Framework Concepts Used

#### 1. Guards (`JwtAuthGuard`, `RolesGuard`) and `@Public()`

Authentication and authorization are enforced with Nest guards instead of generic Express middleware. `JwtAuthGuard` in `backend/src/common/guards/jwt-auth.guard.ts` extends Passport JWT auth, and `RolesGuard` in `backend/src/common/guards/roles.guard.ts` enforces role metadata from `@Roles(...)`. This solves two concrete problems in this codebase: preventing unauthorized writes on social resources (posts/comments/follows/uploads), and restricting admin-only operations such as `UsersController.findAll` and `UsersController.remove`.

Guards were chosen over middleware because they execute in the Nest execution context, where route metadata (such as role requirements) is available through `Reflector`. Middleware would require custom conventions, cannot naturally consume `@Roles()` metadata, and tends to centralize logic away from route intent. The current design keeps authorization declarations close to handlers, such as `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ADMIN)`.

`@Public()` (defined in `backend/src/common/decorators/public.decorator.ts`) marks routes as public metadata. In this codebase, bypass behavior is effectively achieved by not applying `JwtAuthGuard` on those routes (`AuthController` public endpoints and `PostsController` read endpoints), while guarded controllers still depend on guard wiring. The decorator is still valuable as explicit route intent and future-proofs for a global auth-guard strategy where metadata-based bypass would be read directly.

#### 2. Interceptors (`TransformInterceptor`)

`TransformInterceptor` in `backend/src/common/interceptors/transform.interceptor.ts` wraps successful responses into a single envelope:

- `success: true`
- `data: <payload>`
- `timestamp: <ISO string>`

This solves frontend integration complexity by making all success payloads predictable. Frontend types in `frontend/src/types/api.ts` rely on this exact shape (`ApiResponse<T>`), and hooks like `useAuth`, `usePosts`, and `useLikes` consistently read `res.data.data`. Without this interceptor, each endpoint could return ad hoc structures, increasing parsing and error-prone branching in hooks and components.

Alternatives included response shaping inside each controller method or generic Express middleware. Controller-level shaping was not chosen because it duplicates code and invites drift between modules. Middleware was not chosen because it cannot reliably work with typed Nest return flows and can be less expressive for reactive handler pipelines.

#### 3. Exception Filters (`HttpExceptionFilter` / `GlobalExceptionFilter`)

`GlobalExceptionFilter` in `backend/src/common/filters/http-exception.filter.ts` catches all exceptions and normalizes error responses to `success: false`, `statusCode`, `message`, `errors[]`, `timestamp`, and `path`. This solves inconsistent error formatting across modules and makes frontend error rendering straightforward. For example, `useAuth` parses backend validation errors that are formatted as `field: message` strings.

A global filter was chosen instead of local try/catch blocks in controllers because local handling scales poorly and often misses edge cases from deeper layers (repository errors, strategy exceptions). Nest’s global filter ensures one error contract for every route in `AuthController`, `PostsController`, `UsersController`, and the rest of the API.

#### 4. Pipes (`ValidationPipe` and DTO validation)

`ValidationPipe` is registered globally in `backend/src/main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, and implicit conversion. DTOs in module folders (`auth/dto`, `users/dto`, `posts/dto`, etc.) use `class-validator` decorators, so request payloads are validated before service logic executes.

This choice solves two problems: protecting service/repository layers from invalid input, and keeping validation rules close to API contracts. Alternatives such as manual validation in controllers were not chosen because they duplicate checks and are easy to forget. Schema libraries like Joi/Zod could have been used for DTO payloads, but class-validator integrates directly with Nest DTO classes and Swagger decorators already used throughout this backend.

The custom `exceptionFactory` in `main.ts` also aligns validation output with frontend field-level parsing. In addition to `ValidationPipe`, `ParsePositiveIntPipe` exists in `backend/src/common/pipes/parse-positive-int.pipe.ts` for strict positive integer route params where needed.

#### 5. Decorators (`@Public()`, `@Roles()`, `@CurrentUser()`)

Custom decorators make handlers self-descriptive and reduce boilerplate. `@CurrentUser()` in `backend/src/common/decorators/current-user.decorator.ts` removes repetitive `req.user` extraction, while `@Roles()` expresses authorization intent declaratively.

This was chosen over ad hoc helper functions because decorator metadata is first-class in Nest guard resolution and improves readability in controllers. It also keeps controllers thin: controller methods focus on orchestrating route inputs and delegating to services, not building auth plumbing.

#### 6. Modules and NestJS DI

Feature modules (`AuthModule`, `UsersModule`, `PostsModule`, `CommentsModule`, `LikesModule`, `FollowsModule`, `UploadModule`, `MailModule`, `DatabaseModule`, `JwtModule`) isolate domain concerns and expose only required providers. This solves coupling and scale issues common in monolithic Express apps where routes, services, and data access often merge into large files.

Dependency injection through Nest IoC enables clean substitution in tests (`getRepositoryToken`, mocked services, mocked DataSource) and supports transactional boundaries (for example, `UsersService.removeUserAndSessions` using query runners). `forwardRef` in auth/users modules addresses cyclic dependencies explicitly instead of hidden import side effects.

Compared to plain Express, this structure provides stronger lifecycle management, provider scoping, and testing ergonomics with Nest testing modules.

#### 7. Middleware (actual usage in this project)

This codebase does not define custom Nest middleware classes in module consumers. Instead, `backend/src/main.ts` uses Express-level middleware for platform concerns: `cookieParser()` for refresh-token extraction support and static assets middleware for `/uploads` files. Core request policies (auth, validation, response formatting, error shaping) are intentionally implemented with guards/pipes/interceptors/filters because those mechanisms are metadata-aware and better aligned with Nest execution semantics.

### Authentication & Security

Authentication uses short-lived access tokens plus longer-lived refresh tokens. `AuthService.generateAndStoreTokens` signs both tokens through `JwtHelperService`, stores only a bcrypt-hashed refresh token in `refresh_tokens`, and removes previous refresh records for the user. Rotation in `AuthService.rotateRefreshToken` verifies JWT validity, checks DB presence/expiration, compares hash, deletes old token, and issues a new pair. This addresses replay risk better than static long-lived JWTs.

The two-token model was chosen over pure session cookies and over external OAuth-only identity because this project is a custom API-first social platform with its own user model and role control. Sessions can simplify invalidation but add server-side session store semantics to all auth checks. OAuth could still be added later for social login, but would not replace internal authorization logic and domain account controls.

Passwords are hashed with bcrypt (cost 12 for password storage in `UsersService.create`, and cost 10 for refresh token hashes in auth flow). Bcrypt was chosen for broad ecosystem support and predictable operational cost. Argon2 is a strong alternative and can offer stronger memory-hard properties, but bcrypt’s maturity and package compatibility are practical for this stack. Unsalted fast hashes such as SHA-256 were not chosen for passwords because they are unsuitable against brute-force attacks.

Email verification and reset flows are handled by `MailService` plus auth service logic. Verification tokens are generated as UUIDs and linked to `/verify-email`; reset tokens are generated as UUIDs but stored hashed via SHA-256 (`hashResetToken`) with one-hour expiry (`resetPasswordExpiresAt`). This reduces exposure if DB data leaks, while still allowing stateless token delivery by email.

RBAC uses `User.role` (`admin`/`user`) in `User` entity plus `RolesGuard` checks against `@Roles(...)` metadata. Rate limiting is configured globally via `ThrottlerModule` (100 requests/min) and tightened on login with `@Throttle({ default: { ttl: 60_000, limit: 10 } })`. This helps protect authentication endpoints from brute-force attempts and reduces abusive request bursts.

CORS is explicitly enabled in `main.ts` with `origin` from `CORS_ORIGIN` and `credentials: true`. This is required because the frontend and backend run on different origins in local/dev/prod setups (for example localhost:3001 frontend and localhost:3000 backend), and cross-origin auth flows must be explicitly allowed.

### Database & ORM

Persistence is implemented with TypeORM (`backend/src/modules/database/database.module.ts`) against PostgreSQL (Docker uses `postgres:16-alpine`). TypeORM was chosen because this project leans on entity decorators and repository/query-builder APIs that integrate naturally with Nest modules and DI. Prisma could provide stronger generated typing and migration ergonomics, while Sequelize is flexible but less idiomatic in Nest-heavy decorator architectures.

PostgreSQL was selected over MySQL and MongoDB because this social model has clear relational structure and constraints: unique user identity fields, join entities for follows/likes, and cascade behavior across authored resources. MongoDB was not chosen because this domain benefits from relational integrity and SQL querying for feed-oriented operations.

Entity relationships in this codebase include:

- One-to-many: `User -> Post`, `User -> Comment`, `User -> Like`, `User -> RefreshToken`, `Post -> Comment`, `Post -> Like`
- Many-to-one: inverse links from `Post`, `Comment`, `Like`, `Follow`, `RefreshToken` back to owning entities
- Many-to-many semantics via explicit join entity: user follow graph is modeled as `Follow` (`followerId`, `followingId`) rather than an implicit `@ManyToMany` table, which gives direct control over constraints and query shape

`DB_SYNC` controls auto schema sync. Keeping sync enabled in development speeds iteration, but production should favor migrations to avoid accidental destructive schema drift and to maintain explicit DB change history. Connection pooling is handled by the PostgreSQL driver underneath TypeORM; this project relies on default pooling behavior rather than custom pool tuning.

### Caching

Caching is configured globally in `AppModule` using `@nestjs/cache-manager` with Keyv + Redis (`@keyv/redis`) and default TTL of 60 seconds. Route-level cache interceptors are used on selected read endpoints (`UsersController.findAll`, `PostsController.findAll`) with per-route TTL overrides (60_000ms and 30_000ms).

The cache strategy here is simple and mutation-driven: services clear cache broadly (`cacheManager.clear()`) after writes such as user updates, post create/update/delete, password/reset changes, and email verification status updates. This prioritizes correctness and low implementation complexity over maximal cache hit precision.

Redis was chosen over in-memory cache because the deployment model includes containerized/runtime-separated services; Redis enables shared cache semantics across instances and process restarts. In-memory cache would be simpler but unsuitable for multi-instance consistency. If Redis is unavailable, this setup can fail cache operations depending on adapter/runtime behavior; there is no explicit circuit-breaker fallback to memory in current code.

### Testing Strategy

The backend uses both unit and end-to-end testing under `backend/test/`. Unit tests mock repositories/services with focused behavioral assertions (for example `auth.service.spec.ts`, `posts.service.spec.ts`, `users.service.spec.ts`), while E2E tests (`auth.e2e-spec.ts`, `posts.e2e-spec.ts`) boot a full Nest app and verify real HTTP contracts.

The repository mock pattern (`test/mocks/repository.mock.ts`) standardizes mocked TypeORM methods (`findOne`, `findAndCount`, `save`, `remove`, `delete`, etc.), reducing repetitive mock boilerplate and making service tests deterministic. Controller tests validate route-to-service delegation and guard-related decision paths. Service tests validate core business rules like ownership checks, conflict handling, token rotation constraints, and transactional rollback behavior.

E2E coverage is needed for what unit tests cannot guarantee: full request pipeline behavior with global pipes/interceptors/filters, serialization format consistency, auth header behavior, and end-to-end module wiring. Both test types are necessary in this system because high-level API guarantees depend on both business rules and framework-level global configuration.

### CI/CD Pipeline

CI is defined in `.github/workflows/ci.yml` and deploy in `.github/workflows/deploy.yml`. CI runs backend unit and E2E tests with PostgreSQL and Redis service containers, then performs Docker build checks for backend and frontend images. Deploy triggers only when the CI workflow on `main` succeeds.

Deploy-after-test was chosen to prevent shipping broken contracts or regressions into production environments. This is particularly important here because backend/frontend are tightly coupled through response envelope conventions and auth token flows.

Backend deployment targets Railway via CLI redeploy and secrets (`RAILWAY_TOKEN`, service ID). Railway was chosen for low-ops deployment of containerized Node services and simple GitHub Action integration. Compared alternatives: Render/Heroku provide similar PaaS simplicity; AWS offers deeper control but much higher operational complexity for this project scope.

Frontend deployment targets Vercel via CLI in the frontend working directory, which aligns naturally with Next.js standalone output and static asset delivery. Compared alternatives: Netlify works well for many frontend stacks but Vercel is tightly optimized for Next runtime behavior; self-hosting would increase operational overhead.

Both Dockerfiles use multi-stage builds. Backend `Dockerfile` has a `builder` stage (`npm ci`, `npm run build`) and a `production` stage that installs only production dependencies, copies `dist`, includes mail templates, and runs `node dist/main`. Frontend `Dockerfile` builds Next output then copies `.next/standalone` and `.next/static` into the production image and runs `server.js`. Multi-stage design reduces runtime image size, lowers attack surface, and avoids carrying dev/build tooling into production containers.

### Frontend Architecture

The frontend uses Next.js App Router structure under `frontend/src/app`, with route groups for auth and dashboard concerns. App Router was chosen over the legacy Pages Router because it provides clearer route colocation, modern layout composition, and aligns with current Next best practices. Compared to plain React + react-router, this setup reduces routing boilerplate and better supports production deployment patterns used by Vercel.

State management is organized around custom hooks (`useAuth`, `usePosts`, `usePost`, `useComments`, `useLikes`) instead of a global store library. This choice keeps state close to feature boundaries and avoids the complexity cost of Redux/Zustand for current app size. If cross-feature state complexity grows substantially, a shared store may become beneficial, but current hook-scoped state is maintainable and explicit.

HTTP concerns are centralized in `frontend/src/lib/api.ts` with Axios interceptors. Request interceptors attach access tokens; response interceptors detect 401, queue concurrent requests during refresh, call `/api/auth/refresh`, persist new tokens, and replay failed requests. This was chosen over repeating refresh logic in every hook because interceptor-level handling prevents duplicated auth error code and race-condition-heavy manual retry logic.

Dark mode uses Tailwind class strategy (`.dark` class) rather than media-query-only strategy. `layout.tsx` injects an early script to set the HTML class before hydration to reduce flash, and `Navbar`/`SettingsPage` toggle persisted theme state in `localStorage`. Class strategy was chosen because it allows user override independent of system preference and gives precise control over themed UI variants.

### Design Patterns Applied

Repository pattern appears through TypeORM repositories injected into services (`@InjectRepository(...)`), giving each service an explicit persistence boundary and making repository calls mockable in tests.

Dependency injection is foundational across modules: controllers consume services, services consume repositories and helpers (`JwtHelperService`, `MailService`, cache manager), and tests override providers easily with mocks.

DTO pattern is used for every major API surface (`auth/dto`, `posts/dto`, `users/dto`, `comments/dto`, etc.), enabling typed contracts, validation, and Swagger metadata from a single source.

Decorator pattern is used both for route metadata (`@Public`, `@Roles`) and for serialization control (`@Exclude` in entities, `@Expose` in response DTOs). This allows declarative behavior without imperative glue code in each handler.

Interceptor pattern handles cross-cutting concerns (`TransformInterceptor`, `LoggingInterceptor`) without polluting service logic. Module pattern encapsulates feature boundaries and provider exports. Services remain singleton-scoped by default in Nest, which is appropriate here because services are stateless coordinators over repositories and utility providers.

### Conventions & Code Quality

Naming conventions are consistent with TypeScript/Nest defaults: classes and DTOs in PascalCase, variables/functions in camelCase, and file names in kebab-case (`auth.service.ts`, `jwt-refresh.strategy.ts`, `parse-positive-int.pipe.ts`). Folder structure follows Nest feature modularity with `controllers`, `services`, `dto`, and `entities` subfolders.

Separation of concerns is enforced as controller -> service -> repository/data-source flow. Controllers primarily validate route context and delegate business logic, while services implement rules (ownership checks, token rotation, follow/like toggles, cache invalidation, transactional deletes). This keeps controllers thin and improves testability because business rules are exercised in service unit tests.

Environment configuration is centralized with `@nestjs/config` plus Joi validation in `backend/src/config/config.module.ts`. Startup validation was chosen so misconfiguration fails fast during boot (missing JWT secrets, invalid DB settings), preventing hard-to-debug runtime failures after deployment.


