---
name: api-conventions
description: "Use when writing controllers, DTOs, services, or responses to match the project's API conventions for response/error format, validation, imports, module structure, and snake_case mapping."
---

# API Conventions

## Response & Error Format

- **Success** (wrapped by `HttpResponseInterceptor`): `{ message: string, data: ... }`
- **Error** (wrapped by `HttpExceptionFilter`): `{ message: string }`
- Both in `utils/https/`

## snake_case Responses

All API responses use **snake_case** keys, manually mapped in controllers:

```typescript
// Controller returns:
return {
  message: 'success',
  data: { created_at: thing.createdAt, user_id: thing.userId }
}
```

Not using auto-transforms — the mapping is explicit in each controller method.

## DTO Validation

- DTO classes in `dto/` subdirectories per module
- Uses `class-validator` decorators + `class-transformer`
- Applied globally by `HttpCustomValidationPipe` from `utils/https/pipes.ts`

## Imports

- Prefer `src/` absolute paths over relative: `import { X } from 'src/database/database.module'`
- Relative imports from the `utils/` directory are also used: `import { AuthGuard } from 'utils/https/guards'`

## Module Pattern

Each feature module follows:

```
module/
├── module.ts          # NestJS module definition
├── controller.ts      # Route handlers
├── service.ts         # Business logic
├── dto/               # Validation DTOs
└── *.spec.ts          # Tests alongside source
```

## Injection Tokens

Modules that provide external service clients follow a consistent pattern:

```typescript
export const tokenName = 'INJECTION_TOKEN_STRING'
export type TokenType = { ... }

// In module:
providers: [{ provide: tokenName, ... }],
exports: [tokenName]

// In consumer:
@Inject(tokenName) private readonly service: TokenType
```

Key tokens: `DB_CONNECTION_TOKEN_PG`, `REDIS_CLIENT`, `PAYMENT_SERVICE_TOKEN`, `MAIL_TOKEN_RESEND`.

## CORS (from main.ts)

Origins: `http://localhost:3000`, `https://app-dev.pickblue.cloud`, `https://app.pickblue.cloud`
Credentials: true, methods: GET/POST/PUT/DELETE/OPTIONS/PATCH

## Server Port

Defaults to 3001 via `process.env.PORT ?? 3001`.
