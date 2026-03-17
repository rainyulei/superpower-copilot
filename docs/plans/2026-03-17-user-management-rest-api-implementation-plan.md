# User Management REST API — Implementation Plan

Date: 2026-03-17
Status: Ready for Execute
Based on: `docs/specs/2026-03-17-user-management-rest-api-design.md`

## Goal

在当前仓库新增一个独立后端模块 `user-api/`，实现用户管理 REST API v1：
- Auth: register/login
- Users: CRUD + 搜索筛选 + 分页
- JWT 保护 `/users` 路由
- 内存存储（原型）
- API 测试可运行并通过

## Architecture

- Runtime: Node.js + Express + TypeScript
- Storage: In-memory store (`Map` + service filtering)
- Validation: Zod
- Security: bcrypt + jsonwebtoken
- Tests: Vitest + Supertest

## Tech Stack

- Dependencies: `express`, `zod`, `bcryptjs`, `jsonwebtoken`, `uuid`, `dotenv`
- Dev dependencies: `typescript`, `ts-node`, `vitest`, `supertest`, `@types/*`

---

## Task 1 — Scaffold `user-api` + Health Endpoint

### Files
- Create: `user-api/package.json`
- Create: `user-api/tsconfig.json`
- Create: `user-api/vitest.config.ts`
- Create: `user-api/src/app.ts`
- Create: `user-api/src/server.ts`
- Create: `user-api/src/routes/index.ts`
- Create: `user-api/tests/health.test.ts`

### Step 1: Write failing test
- 在 `user-api/tests/health.test.ts` 添加：`GET /api/v1/health` 期望 200 + `{ status: 'ok' }`

### Step 2: Verify fail
- Command:
```bash
cd user-api && npm test -- tests/health.test.ts
```
- Expected:
  - 测试失败（路由未实现或 app 未导出）

### Step 3: Implement minimal code
- 创建基础 Express app
- 挂载 `GET /api/v1/health`
- 导出 app，server 负责监听

### Step 4: Verify pass
- Command:
```bash
cd user-api && npm test -- tests/health.test.ts
```
- Expected:
  - 1 test passed

### Step 5: Commit
```bash
git add user-api
git commit -m "feat(user-api): scaffold service and health endpoint"
```

---

## Task 2 — Define Domain Types + Error Contract

### Files
- Create: `user-api/src/models/user.ts`
- Create: `user-api/src/types/api.ts`
- Create: `user-api/src/middleware/error.middleware.ts`
- Update: `user-api/src/app.ts`
- Create: `user-api/tests/error-format.test.ts`

### Step 1: Write failing test
- 增加测试：访问不存在路由时返回统一错误结构
```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {} } }
```

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/error-format.test.ts
```
- Expected: 返回结构不匹配导致失败

### Step 3: Implement minimal code
- 定义 `UserRole`, `User`, `PublicUser`
- 定义 `ApiErrorBody`
- 实现 notFound + error handler
- 在 app 注册错误中间件

### Step 4: Verify pass
```bash
cd user-api && npm test -- tests/error-format.test.ts
```

### Step 5: Commit
```bash
git add user-api/src user-api/tests
git commit -m "feat(user-api): add core models and unified error contract"
```

---

## Task 3 — Build In-Memory User Store + Querying

### Files
- Create: `user-api/src/stores/user.store.ts`
- Create: `user-api/tests/user-store.test.ts`

### Step 1: Write failing tests
- 覆盖：
  - create/getById/getByEmail
  - update/delete
  - list with `q`, `role`, `page`, `pageSize`

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/user-store.test.ts
```

### Step 3: Implement minimal code
- `Map<string, User>` 作为存储
- `listUsers` 返回 `{ items, total }`
- 过滤规则：
  - `q` 匹配 email/name（case-insensitive）
  - `role` 精确匹配

### Step 4: Verify pass
```bash
cd user-api && npm test -- tests/user-store.test.ts
```

### Step 5: Commit
```bash
git add user-api/src/stores user-api/tests/user-store.test.ts
git commit -m "feat(user-api): implement in-memory user store with filtering and pagination"
```

---

## Task 4 — Add Validators (Auth + Users)

### Files
- Create: `user-api/src/validators/auth.validator.ts`
- Create: `user-api/src/validators/user.validator.ts`
- Create: `user-api/tests/validators.test.ts`

### Step 1: Write failing tests
- 校验规则：
  - email 格式
  - password 最短 8
  - name 1..50
  - role enum
  - update 为 partial schema

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/validators.test.ts
```

### Step 3: Implement minimal code
- 用 Zod 定义 schema
- 暴露 parse function（抛 ValidationError）

### Step 4: Verify pass
```bash
cd user-api && npm test -- tests/validators.test.ts
```

### Step 5: Commit
```bash
git add user-api/src/validators user-api/tests/validators.test.ts
git commit -m "feat(user-api): add zod validators for auth and users"
```

---

## Task 5 — Auth Service (Register/Login + JWT)

### Files
- Create: `user-api/src/config/env.ts`
- Create: `user-api/src/utils/password.ts`
- Create: `user-api/src/utils/jwt.ts`
- Create: `user-api/src/utils/id.ts`
- Create: `user-api/src/services/auth.service.ts`
- Create: `user-api/tests/auth-service.test.ts`

### Step 1: Write failing tests
- 覆盖：
  - register 成功（密码被 hash）
  - register 重复 email -> `EMAIL_ALREADY_EXISTS`
  - login 成功返回 token
  - login 密码错误 -> `UNAUTHORIZED`

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/auth-service.test.ts
```

### Step 3: Implement minimal code
- bcrypt hash/compare
- jwt sign/verify
- auth service 使用 user store

### Step 4: Verify pass
```bash
cd user-api && npm test -- tests/auth-service.test.ts
```

### Step 5: Commit
```bash
git add user-api/src user-api/tests/auth-service.test.ts
git commit -m "feat(user-api): implement auth service with bcrypt and jwt"
```

---

## Task 6 — User Service (CRUD + Pagination Envelope)

### Files
- Create: `user-api/src/services/user.service.ts`
- Create: `user-api/tests/user-service.test.ts`

### Step 1: Write failing tests
- 覆盖：
  - create/get/update/delete
  - list 返回 pagination（page/pageSize/total/totalPages）
  - not found -> `USER_NOT_FOUND`

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/user-service.test.ts
```

### Step 3: Implement minimal code
- 组合 store + validator
- 响应数据去除 `passwordHash`

### Step 4: Verify pass
```bash
cd user-api && npm test -- tests/user-service.test.ts
```

### Step 5: Commit
```bash
git add user-api/src/services user-api/tests/user-service.test.ts
git commit -m "feat(user-api): implement user service and pagination response"
```

---

## Task 7 — Controllers + Routes (`/auth`, `/users`)

### Files
- Create: `user-api/src/controllers/auth.controller.ts`
- Create: `user-api/src/controllers/user.controller.ts`
- Create: `user-api/src/routes/auth.routes.ts`
- Create: `user-api/src/routes/user.routes.ts`
- Update: `user-api/src/routes/index.ts`
- Create: `user-api/tests/auth-api.test.ts`
- Create: `user-api/tests/users-api.test.ts`

### Step 1: Write failing API tests
- Auth API:
  - `POST /api/v1/auth/register` -> 201
  - `POST /api/v1/auth/login` -> 200 + token
- Users API:
  - 未带 token 访问 `/users` -> 401（暂时先写，当前未实现中间件）

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/auth-api.test.ts tests/users-api.test.ts
```

### Step 3: Implement minimal code
- 控制器仅做请求/响应映射
- 路由注册所有 endpoint

### Step 4: Verify partial pass
```bash
cd user-api && npm test -- tests/auth-api.test.ts
```
- Expected: auth tests pass；users auth tests 仍 fail（等待下一任务）

### Step 5: Commit
```bash
git add user-api/src/controllers user-api/src/routes user-api/tests
git commit -m "feat(user-api): add auth and user controllers/routes"
```

---

## Task 8 — JWT Auth Middleware

### Files
- Create: `user-api/src/middleware/auth.middleware.ts`
- Update: `user-api/src/routes/user.routes.ts`
- Create: `user-api/tests/auth-middleware.test.ts`

### Step 1: Write failing tests
- 无 token -> 401
- 非法 token -> 401
- 合法 token -> 放行

### Step 2: Verify fail
```bash
cd user-api && npm test -- tests/auth-middleware.test.ts tests/users-api.test.ts
```

### Step 3: Implement minimal code
- 从 `Authorization: Bearer <token>` 解析
- verify jwt，写入 `req.user`
- 挂载到 `/users` 路由组

### Step 4: Verify pass
```bash
cd user-api && npm test -- tests/auth-middleware.test.ts tests/users-api.test.ts
```

### Step 5: Commit
```bash
git add user-api/src/middleware user-api/src/routes/user.routes.ts user-api/tests
git commit -m "feat(user-api): protect user routes with jwt middleware"
```

---

## Task 9 — Final Integration + Scripts + Env Example

### Files
- Update: `user-api/package.json`
- Create: `user-api/.env.example`
- Create: `user-api/README.md`
- Optional Update: `README.md`
- Optional Update: `readme-zh.md`

### Step 1: Write failing check
- 尝试启动命令前先验证脚本存在：
```bash
cd user-api && npm run dev
```
- Expected: 若脚本未配置则失败

### Step 2: Implement minimal code
- scripts:
  - `dev`: `ts-node src/server.ts`
  - `build`: `tsc -p .`
  - `test`: `vitest run`
- `.env.example`:
  - `PORT=3000`
  - `JWT_SECRET=replace-with-long-random-string`
  - `JWT_EXPIRES_IN=3600`

### Step 3: Verify pass
```bash
cd user-api && npm install
cd user-api && npm run build
cd user-api && npm test
```
- Expected:
  - build 通过
  - 全量测试通过

### Step 4: Commit
```bash
git add user-api README.md readme-zh.md
git commit -m "chore(user-api): finalize scripts env docs and full test pass"
```

---

## Execute Order

1. Task 1-2: 运行骨架 + 错误协议（基础地形）
2. Task 3-6: 领域核心（store/validator/service）
3. Task 7-8: API 层和鉴权保护
4. Task 9: 收尾验证与文档

## Verification Gate (must pass before finish)

Run all commands:
```bash
cd user-api && npm run build
cd user-api && npm test
```

Expected:
- TypeScript compile success
- All tests passing
- No endpoint leaks password hash

## Review Checklist

- API 路径是否全部使用 `/api/v1`
- 错误响应是否统一结构
- 用户响应是否移除 `passwordHash`
- `/users` 是否全部受 JWT 保护
- 分页字段是否完整且正确

## Rollback Strategy

- 模块隔离在 `user-api/`，必要时可整体回滚该目录，不影响扩展主逻辑。
- 每个任务独立 commit，支持逐步回退。

## Status Protocol

Current status: `DONE` (plan complete)
Recommended next handoff: `execute`
