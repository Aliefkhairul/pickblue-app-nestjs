---
name: auth-sessions
description: "Use when implementing or modifying authentication endpoints, guards, session handling, role-based access control, or the registration/login/logout flow."
---

# Auth & Sessions

## Architecture

- **Session-based auth** (no JWT). Tokens stored in DB `sessions` table, set as HTTP cookies.
- Cookie helpers in `utils/https/sessions.ts`: `setSessionCookie()`, `clearSessionCookie()`
- Express `Request` augmented with `withUser: AuthenticatedUserPayload | undefined` via `types/express.d.ts`

## Guards & Decorators

| Decorator                    | Purpose                            |
|------------------------------|------------------------------------|
| `@UseGuards(AuthGuard)`      | Require valid session              |
| `@AuthGuardsIsOptional()`    | Allow unauthenticated requests     |
| `@Roles(Role.Creator)`       | Require creator role               |
| `@Roles(Role.User)`          | Require user role                  |
| `@UseGuards(AuthGuard, RolesGuard)` | Auth + role check          |

All from `utils/https/guards.ts`.

## Redis Caching

- Auth session cached in Redis at key `auth:session:<hashed_token>` with 5-minute TTL
- `AuthenticationService.getAuthenticatedUser()` checks Redis first, falls back to DB
- Redis client injected via: `@Inject(REDIS_CLIENT) private readonly redisClient: Redis`
- Redis module at `src/database/redis.module.ts`, injection token `REDIS_CLIENT`

## Auth Endpoints

| Method | Path                       | Auth Required | Description              |
|--------|----------------------------|---------------|--------------------------|
| POST   | /auth/register             | No            | Initiate email registration |
| POST   | /auth/register-user        | No            | Complete registration with token |
| POST   | /auth/login                | No            | Login, sets session cookie |
| GET    | /auth/logout               | Yes           | Destroy session          |
| GET    | /auth/me                   | Yes           | Current user profile     |
| GET    | /auth/account-verification | No            | Verify account via token |

## Registration Flow

1. `POST /auth/register` — sends verification email via Resend with token link
2. User clicks link in email, frontend calls `POST /auth/register-user` with token + credentials
3. Backend validates token, creates user + account + user_role + optional creator_balance
4. Verification record deleted after successful registration

## Role System

- `roles` table seeded with `'creator'` and `'user'`
- `user_roles` join table maps users to roles
- On registration: creator role also creates a `creator_balances` row with `balance: 0`
