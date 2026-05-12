# Pickblue App (NestJS)

Backend API for Pickblue marketplace platform — built with [NestJS](https://nestjs.com), [Drizzle ORM](https://orm.drizzle.team), and PostgreSQL.

## Prerequisites

- **Node.js** >= 18
- **pnpm** — install via `corepack enable pnpm` or `npm i -g pnpm`
- **PostgreSQL** running locally (or a remote connection string)

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd pickblue-app-nestjs

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env   # or use the existing .env

# 4. Run database migrations
pnpm drizzle:migrate

# 5. Start the dev server
pnpm run start:dev
```

The server starts at `http://localhost:3001`.

## Environment Variables

Key variables in `.env`:

| Variable               | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `DB_CONNECTION_STRING` | PostgreSQL connection string                   |
| `RESEND_API_KEY`       | Email provider (Resend) API key                |
| `CLOUDINARY_URL`       | Cloudinary URL for image uploads               |
| `MIDTRANS_SANDBOX_*`   | Midtrans payment gateway (sandbox)             |
| `NGROK_AUTHTOKEN`      | Ngrok tunnel auth token                        |
| `APP_URL`              | Backend URL (default `http://localhost:3001`)  |
| `APP_FE_URL`           | Frontend URL (default `http://localhost:3000`) |

## Available Scripts

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `pnpm run start:dev`   | Start dev server with hot-reload (watch mode) |
| `pnpm run start`       | Start without watch mode                      |
| `pnpm run start:prod`  | Start production build                        |
| `pnpm run start:debug` | Start with debugger                           |
| `pnpm run start:ngrok` | Start ngrok tunnel via `src/endpoint.ts`      |
| `pnpm run build`       | Compile the project                           |
| `pnpm run lint`        | Lint and auto-fix                             |
| `pnpm run format`      | Format with Prettier                          |
| `pnpm run test`        | Run unit tests                                |
| `pnpm run test:e2e`    | Run end-to-end tests                          |
| `pnpm run test:cov`    | Run tests with coverage                       |

## Drizzle ORM Commands

Since the project uses Drizzle ORM with `drizzle.config.ts`, here are common commands:

```bash
# Generate a new migration after schema changes
pnpm drizzle-kit generate

# Apply migrations to the database
pnpm drizzle-kit migrate

# Drizzle Studio (GUI for your database)
pnpm drizzle-kit studio

# Drop all tables (custom script)
pnpm run drop:all
```

> **Note:** These Drizzle commands can also be run with `npx drizzle-kit <command>`.
> The Drizzle config reads `DB_CONNECTION_STRING` from your `.env` file.

## Database

- **ORM:** Drizzle ORM (with `node-postgres` pool)
- **Dialect:** PostgreSQL
- **Schema:** `src/schema/` — all table definitions grouped by entity
- **Migrations:** `migrations/` — auto-generated SQL files
- **Module:** `src/database/database.module.ts` — provides the Drizzle `db` instance globally

### Schema Files

| File                        | Table                    |
| --------------------------- | ------------------------ |
| `accounts.ts`               | `accounts`               |
| `users.ts`                  | `users`                  |
| `sessions.ts`               | `sessions`               |
| `roles.ts`                  | `roles`                  |
| `products.ts`               | `products`               |
| `product_files.ts`          | `product_files`          |
| `product_preview_images.ts` | `product_preview_images` |
| `product_likes.ts`          | `product_likes`          |
| `cart_items.ts`             | `cart_items`             |
| `orders.ts`                 | `orders`                 |
| `payments.ts`               | `payments`               |
| `user_purchases.ts`         | `user_purchases`         |
| `creator_balances.ts`       | `creator_balances`       |
| `creator_earnings.ts`       | `creator_earnings`       |
| `withdrawals.ts`            | `withdrawals`            |
| `verifications.ts`          | `verifications`          |

Includes a `relations.ts` file for Drizzle relations and `index.ts` for re-exports.

## Project Structure

```
src/
├── main.ts                  # App entry point
├── app.module.ts            # Root module
├── app.controller.ts        # Root controller
├── app.service.ts           # Root service
├── authentication/          # Auth module (register, login, etc.)
├── creators/                # Creator dashboard/features
├── database/                # Database module (Drizzle connection)
├── mails/                   # Email templates & sending (React Email + Resend)
├── orders/                  # Order management
├── payments/                # Payment processing (Midtrans)
├── products/                # Product CRUD & search
├── schema/                  # Drizzle table definitions
├── uploaders/               # File/image upload (Cloudinary)
├── users/                   # User profile & management
├── endpoint.ts              # Ngrok tunnel setup
```

## Tech Stack

- **Runtime:** Node.js, TypeScript
- **Framework:** NestJS 11
- **Database:** PostgreSQL + Drizzle ORM
- **Email:** Resend + React Email
- **Payments:** Midtrans (snap)
- **File Storage:** Cloudinary
- **Auth:** bcrypt + session-based (cookies)
- **Validation:** class-validator + class-transformer
