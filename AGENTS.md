# Pickblue App (NestJS) — Agent Guide

## Prerequisites

- Node.js >= 18, **pnpm** (enable via `corepack enable pnpm`)
- PostgreSQL + Redis running locally
- `.env` with `DB_CONNECTION_STRING`, `REDIS_URL`, `RESEND_API_KEY`, `CLOUDINARY_*`, `MIDTRANS_SANDBOX_*`, `NGROK_AUTHTOKEN`

## Essential Commands

```bash
pnpm install              # install deps
pnpm run start:dev        # dev server on :3001 with watch
pnpm run lint             # ESLint with --fix
pnpm run format           # Prettier (arrowParens: avoid, printWidth: 150, singleQuote, tabWidth: 4, no semi)
pnpm run test             # Jest (rootDir: src, testRegex: .*\\.spec\\.ts$)
pnpm run test:e2e         # Jest with test/jest-e2e.json (regex: .e2e-spec.ts$)
pnpm run test:cov         # Jest with coverage
pnpm run build            # nest build (deleteOutDir: true)
pnpm run start:ngrok      # ngrok tunnel via src/endpoint.ts
pnpm run drop:db          # drops all tables via src/schema/drop_table.ts
npx drizzle-kit generate  # new migration after schema changes
npx drizzle-kit migrate   # apply migrations (reads DB_CONNECTION_STRING from .env)
npx drizzle-kit studio    # Drizzle Studio GUI
```

**Order**: `lint -> test` (no typecheck script exists).

## Architecture

- **NestJS 11** with `module:nodenext`, `experimentalDecorators`, `emitDecoratorMetadata`
- **Database**: Drizzle ORM + `node-postgres` pool. Schema in `src/schema/` — `index.ts` re-exports all tables and relations. `DatabaseModule` is `@Global` and provides a `PgDB` via injection token `DB_CONNECTION_TOKEN_PG`.
- **Redis**: `@Global` module providing `ioredis` client via injection token `REDIS_CLIENT`. Used for auth session caching (5min TTL) via key `auth:session:<hashed_token>`.
- **Auth**: Session-based (no JWT). Cookie set via `setSessionCookie()` in `utils/https/sessions.ts`. Uses `AuthGuard` which reads `withUser` from `req` (augmented via `types/express.d.ts`). `AuthGuardsIsOptional()` decorator for optional auth. `RolesGuard` with `@Roles(Role.Creator)` / `@Roles(Role.User)`.
- **Payments**: Midtrans (sandbox). Global module provides `snapApi` + `coreApi` via `PAYMENT_SERVICE_TOKEN`.
- **Email**: Resend + React Email. Global module provides `Resend` client via `MAIL_TOKEN_RESEND`.
- **Uploads**: Cloudinary. Module provides `UploadersService`. Upload limits: 5MB, 4 files, image/png|jpeg|jpg. Low-res transformation at 800px.
- **Scheduled Tasks**: `@nestjs/schedule` in `TasksModule` for session cleanup (`clearSession()`).
- **CORS**: origins `http://localhost:3000`, `https://app-dev.pickblue.cloud`, `https://app.pickblue.cloud`, credentials: true.

## Module Organization

```
src/
├── main.ts              # bootstrap: cookieParser, CORS, HttpExceptionFilter, HttpResponseInterceptor, HttpCustomValidationPipe
├── app.module.ts        # root — imports ConfigModule (global), ScheduleModule, all feature modules
├── authentication/      # register, login, logout, me, account-verification (POST /auth/*, GET /auth/*)
├── creators/            # creator dashboard/features
├── database/            # database.module.ts + redis.module.ts
├── mails/               # mails.module.ts (Resend init)
├── orders/              # order management
├── payments/            # payments.module.ts (Midtrans init)
├── products/            # CRUD, search, likes, upload/download/destroy files (GET|POST /products/*)
├── schema/              # Drizzle table definitions + relations + re-exports
├── tasks/               # scheduled tasks (session cleanup via @nestjs/schedule)
├── uploaders/           # Cloudinary upload/download/destroy
├── users/               # user profile & management
└── endpoint.ts          # ngrok tunnel entrypoint
```

Custom framework utilities in `utils/https/` — guards (`AuthGuard`, `RolesGuard`), pipes (`HttpCustomValidationPipe`), interceptors (`HttpResponseInterceptor`), exception filter (`HttpExceptionFilter`), sessions, headers.

## Style & Patterns

- **Code style** (Prettier): `arrowParens: "avoid"`, `printWidth: 150`, `singleQuote: true`, `trailingComma: "none"`, `tabWidth: 4`, `semi: false`
- **ESLint**: `@typescript-eslint/no-explicit-any: off`, `no-floating-promises: warn`, `no-unsafe-argument: warn`
- **Imports**: use `src/` absolute paths (tsconfig baseUrl + paths), not relative. Pattern: `import { X } from 'src/database/database.module'`
- **Injection tokens**: modules define named export const + type, used with `@Inject(token)`. See `dbConnection`, `REDIS_CLIENT`, `paymentService`, `mailService`.
- **Response format**: controllers return `{ message: string, data: ... }` — wrapped by `HttpResponseInterceptor`. Error format: `{ message: string }` — wrapped by `HttpExceptionFilter`.
- **Validation**: DTO classes in `dto/` subdirectories with `class-validator`/`class-transformer`. Global `HttpCustomValidationPipe` applies them.
- **DB errors**: caught in services, mapped to NestJS HTTP exceptions (PostgreSQL error codes: `23505` = unique violation, `23503` = FK violation, `22P02` = invalid input).
- **Response snake_case**: all API responses use `snake_case` keys, manually mapped in controllers (not auto-transformed).
- **New module pattern**: `module.ts` + `controller.ts` + `service.ts` + `dto/` + `*.spec.ts`. Tests co-located with source.
- **`user_wallets.ts`** schema exists in `src/schema/` but is NOT exported in `index.ts` — likely unused/incomplete.

## Migration Workflow

1. Edit schema files in `src/schema/`
2. `npx drizzle-kit generate` — writes SQL to `migrations/`
3. `npx drizzle-kit migrate` — applies to DB (reads `DB_CONNECTION_STRING`)
4. To reset: `pnpm run drop:db` (drops all tables & custom types) then re-migrate

## Testing

- Unit tests: `*.spec.ts` alongside source, `rootDir: src`, run with `pnpm run test`
- E2E tests: `*.e2e-spec.ts` in `test/`, separate jest config, run with `pnpm run test:e2e`
- Test files exist for: app, authentication, orders, products, creators, users, uploaders, tasks
