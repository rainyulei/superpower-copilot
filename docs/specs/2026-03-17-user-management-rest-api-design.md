# User Management REST API Design (v1)

Date: 2026-03-17
Status: Draft Approved for Planning
Scope: Prototype-first

## 1. Problem Definition (Ge Wu)

The repository is currently a VS Code extension project, not a backend service. 
The requested "user management REST API" should therefore be introduced as a standalone backend module inside this repo, with clear folder boundaries and minimal coupling to extension runtime code.

### Real Need Behind the Idea
- Deliver a runnable user-management API quickly
- Keep architecture simple enough for rapid iteration
- Reserve a migration path for persistent storage later

### Non-goals (v1)
- Full RBAC/permission matrix
- Refresh token rotation strategy
- Database migrations and production deployment hardening

## 2. Selected Approach (Zhong Yong)

Chosen path: **A. Prototype-first**

- Framework: Express + TypeScript
- Storage: In-memory store (process-local)
- Auth: JWT access token
- Versioning: URL versioning (`/api/v1/...`)
- Features:
  - Auth endpoints (register/login)
  - User CRUD
  - Search/filter + pagination
  - Role field (`admin` | `user`), no full RBAC

### Why this approach
Pros:
- Fastest path from zero to usable API
- Lowest setup overhead
- Good fit for requirement exploration

Costs:
- Data is lost on restart
- Horizontal scaling is not supported yet
- Persistence migration required in next phase

## 3. Architectural Options Considered (Bian Zheng)

1. Prototype-first (selected)
- Benefit: speed
- Cost: weak persistence

2. Evolution-first (repository abstraction from day 1)
- Benefit: easier DB migration
- Cost: more initial abstraction/code

3. Production-preview (Postgres + ORM now)
- Benefit: production likeness
- Cost: heavy setup and slower iteration

## 4. API Surface

Base URL: `/api/v1`

### 4.1 Auth

1. `POST /api/v1/auth/register`
- Body:
```json
{
  "email": "user@example.com",
  "password": "Passw0rd!",
  "name": "Alice",
  "role": "user"
}
```
- Response `201`:
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "Alice",
  "role": "user",
  "createdAt": "2026-03-17T12:00:00.000Z"
}
```

2. `POST /api/v1/auth/login`
- Body:
```json
{
  "email": "user@example.com",
  "password": "Passw0rd!"
}
```
- Response `200`:
```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "Alice",
    "role": "user"
  }
}
```

### 4.2 Users (JWT required)

1. `GET /api/v1/users`
- Query:
  - `page` (default `1`)
  - `pageSize` (default `10`, max `100`)
  - `q` (search in name/email)
  - `role` (`admin` | `user`)
- Response `200`:
```json
{
  "items": [
    {
      "id": "usr_123",
      "email": "user@example.com",
      "name": "Alice",
      "role": "user",
      "createdAt": "2026-03-17T12:00:00.000Z",
      "updatedAt": "2026-03-17T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

2. `GET /api/v1/users/:id`
- Response `200` returns one user

3. `POST /api/v1/users`
- Body same as register payload (without token return)
- Response `201`

4. `PATCH /api/v1/users/:id`
- Body (partial):
```json
{
  "name": "Alice Updated",
  "role": "admin"
}
```
- Response `200`

5. `DELETE /api/v1/users/:id`
- Response `204`

## 5. Data Model

```ts
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
```

### Validation Rules
- `email`: required, valid format, unique
- `password`: required (for create/register), min 8 chars
- `name`: required, length 1..50
- `role`: enum `admin | user`, default `user`

## 6. Folder Structure (to implement)

```text
user-api/
  package.json
  tsconfig.json
  src/
    app.ts
    server.ts
    config/
      env.ts
    routes/
      index.ts
      auth.routes.ts
      user.routes.ts
    controllers/
      auth.controller.ts
      user.controller.ts
    services/
      auth.service.ts
      user.service.ts
    stores/
      user.store.ts
    middleware/
      auth.middleware.ts
      error.middleware.ts
    utils/
      jwt.ts
      password.ts
      id.ts
    models/
      user.ts
    validators/
      auth.validator.ts
      user.validator.ts
    types/
      api.ts
  tests/
    auth.test.ts
    users.test.ts
```

## 7. Error Handling Contract

Unified error format:
```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {}
  }
}
```

Suggested codes:
- `VALIDATION_ERROR` -> `400`
- `UNAUTHORIZED` -> `401`
- `FORBIDDEN` -> `403`
- `USER_NOT_FOUND` -> `404`
- `EMAIL_ALREADY_EXISTS` -> `409`
- `INTERNAL_ERROR` -> `500`

## 8. Security Baseline

- Hash passwords with bcrypt
- JWT signed with secret from environment variable
- Protect `/users` routes with auth middleware
- Never return password hash in responses

## 9. Testing Strategy

- Unit tests for services:
  - register/login logic
  - uniqueness checks
  - pagination/filter logic
- API tests (supertest):
  - auth happy path + failure path
  - protected route without token -> 401
  - full user CRUD flow

## 10. Observability (lightweight v1)

- Request logging middleware (method, path, status, duration)
- Health endpoint: `GET /api/v1/health` -> `{ "status": "ok" }`

## 11. Risks and Mitigation

1. Process restart loses all data
- Mitigation: Explicitly document prototype nature

2. Token misuse or weak secret in dev
- Mitigation: enforce minimum secret length; provide `.env.example`

3. Scope creep into production concerns
- Mitigation: defer DB and advanced auth to v2

## 12. Phase-2 Upgrade Path

- Introduce repository interface over `user.store.ts`
- Replace in-memory store with SQLite/Postgres implementation
- Add migration tool and seed scripts
- Add refresh-token and revoke flow

## 13. Status Protocol

Current status: `DONE` for brainstorm design.
Recommended next handoff: `plan` (implementation task breakdown).
