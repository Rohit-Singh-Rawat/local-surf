# Local Surf — Server

Express 5 API for Local Surf. Handles auth, files, folders, shares, and trash. Files upload directly to S3 via presigned URLs.

---

## Tech Stack

- **Runtime:** Bun
- **Framework:** Express 5, TypeScript (strict)
- **Database:** PostgreSQL, Drizzle ORM
- **Cache:** Redis (rate limiting)
- **Storage:** AWS S3 or S3-compatible (presigned PUT/GET)
- **Auth:** Google OAuth 2.0, JWT (jose), refresh token rotation

---

## Setup

### Prerequisites

- Bun ≥ 1.0
- PostgreSQL ≥ 15
- Redis ≥ 7

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_ACCESS_SECRET` | Min 32 chars (`openssl rand -base64 48`) |
| `AWS_REGION` | e.g. `us-east-1` or `auto` for R2 |
| `AWS_ACCESS_KEY_ID` | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | |
| `S3_BUCKET` | Bucket name |
| `S3_ENDPOINT` | S3/R2/MinIO endpoint |
| `CORS_ORIGIN` | Frontend origin, e.g. `http://localhost:3000` |
| `FRONTEND_URL` | Same as `CORS_ORIGIN` |

### 3. Run migrations

```bash
bun run db:migrate
```

### 4. Start server

```bash
bun run dev
```

Server runs at http://localhost:8000

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev with hot reload (`bun --watch`) |
| `bun run start` | Production |
| `bun run db:migrate` | Run migrations |
| `bun run db:generate` | Generate migrations from schema |
| `bun run db:push` | Push schema to DB (dev) |
| `bun run db:studio` | Drizzle Studio |
| `bun run lint` | Biome check |
| `bun run lint:fix` | Biome fix |
| `bun run typecheck` | TypeScript check |

---

## Project Structure

```
server/
├── src/
│   ├── config/       # env, db, redis, s3, passport
│   ├── db/
│   │   ├── schema/   # Drizzle tables (users, files, folders, shares, refresh-tokens)
│   │   └── migrations/
│   ├── lib/          # errors, jwt, validation, logger, constants
│   ├── middleware/   # auth, rate-limit, validation, error-handler, request-logger
│   ├── modules/
│   │   ├── auth/     # Google OAuth, exchange, refresh, logout
│   │   ├── file/     # upload, confirm, download, rename, delete, restore
│   │   ├── folder/   # CRUD, contents, trash, restore
│   │   ├── share/    # user share, public link, access
│   │   ├── trash/    # permanent delete, empty
│   │   ├── user/     # me
│   │   └── health/   # health check
│   ├── app.ts        # Express app
│   └── server.ts     # Entry point
├── drizzle.config.ts
├── package.json
└── .env.example
```

---

## Deployment (Vercel)

The server is configured for Vercel serverless deployment.

1. **Vercel project:** `vercel.json` specifies Bun 1.x
2. **Root directory:** Set to `server` in Vercel project settings
3. **Environment variables:** Add all required vars in Vercel dashboard
4. **Database:** Use a managed PostgreSQL (e.g. Neon) — Vercel serverless has no persistent connections
5. **Redis:** Use a managed Redis (e.g. Upstash, Redis Cloud)
6. **OAuth callback:** Add production callback URL in Google Console, e.g. `https://your-api.vercel.app/api/auth/google/callback`

> **Note:** Vercel serverless has execution time limits. For long-running operations (e.g. large multipart uploads), consider a dedicated server or edge runtime.

