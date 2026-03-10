# Local Surf

A file management application inspired by Google Drive. Users authenticate via Google, upload files directly to S3, organize them in folders, and share with others through user invites or public links.

## Tech Stack

| | Technology |
|---|---|
| **Runtime** | Bun |
| **Server** | Express 5, TypeScript (strict) |
| **Database** | PostgreSQL, Drizzle ORM |
| **Cache** | Redis |
| **Storage** | AWS S3 (presigned URLs) |
| **Auth** | Google OAuth 2.0, JWT, refresh token rotation |
| **Frontend** | React 19, Vite, TanStack Router & Query, Tailwind CSS 4, shadcn/ui |
| **Code Quality** | Biome (lint + format), Zod (validation) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL >= 15
- Redis >= 7
- [Google OAuth credentials](https://console.cloud.google.com/apis/credentials)
- AWS S3 bucket ([CORS setup below](#s3-bucket-cors))

### Installation

```bash
git clone <repo-url> local-surf
cd local-surf
bun install
```

### Configuration

```bash
cp server/.env.example server/.env
```

Fill in `server/.env` — the required values are:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `JWT_ACCESS_SECRET` | Min 32 chars. Generate: `openssl rand -base64 48` |
| `AWS_REGION` | S3 bucket region |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `S3_BUCKET` | Bucket name |
| `S3_ENDPOINT` | e.g. `https://s3.amazonaws.com` |

### Database

```bash
cd server
bun run db:migrate
```

### Run

```bash
# From project root — starts server (:8000) and web (:5173)
bun run dev
```

## Docker

All infrastructure included — Postgres, Redis, API server, and frontend:

```bash
# Fill in server/.env first
docker compose -f docker/docker-compose.yml up --build

# Run migrations
docker compose -f docker/docker-compose.yml exec server bun run db:migrate
```

## Google OAuth Setup

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
4. Copy Client ID and Client Secret into `.env`

## S3 Bucket CORS

Add this CORS configuration to your S3 bucket so the browser can upload via presigned URLs:

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET", "HEAD"],
  "AllowedOrigins": ["http://localhost:5173"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}]
```

Minimal IAM policy for the server:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:HeadObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
  }]
}
```

## API Overview

| Endpoint | Description |
|---|---|
| `GET /api/auth/google` | Start Google OAuth flow |
| `POST /api/auth/refresh` | Rotate tokens |
| `GET /api/users/me` | Current user profile |
| `POST /api/files/upload` | Initiate upload (returns presigned URL) |
| `POST /api/files/:id/confirm` | Confirm upload after S3 completes |
| `GET /api/files/:id/download` | Get presigned download URL |
| `PATCH /api/files/:id` | Rename file |
| `DELETE /api/files/:id` | Soft delete file |
| `GET /api/files/search?q=` | Search by name |
| `POST /api/folders` | Create folder |
| `GET /api/folders/root/contents` | List root contents |
| `GET /api/folders/:id/contents` | List folder contents |
| `PATCH /api/folders/:id` | Rename folder |
| `DELETE /api/folders/:id` | Soft delete (cascades to subtree) |
| `POST /api/shares/user` | Share file with user by email |
| `POST /api/shares/link` | Create public share link |
| `GET /api/shares/public/:token` | Access public link (no auth) |
| `DELETE /api/trash/files/:id` | Permanently delete file |
| `DELETE /api/trash/folders/:id` | Permanently delete folder |
| `DELETE /api/trash/empty` | Empty trash |
| `GET /api/health` | Health check |

## Scripts

### Server (`cd server`)

```bash
bun run dev          # dev with hot reload
bun run start        # production start
bun run db:migrate   # run migrations
bun run db:generate  # generate migration from schema changes
bun run db:studio    # Drizzle Studio GUI
bun run lint         # check lint + format
bun run lint:fix     # auto-fix
bun run typecheck    # type check
```

### Web (`cd web`)

```bash
bun run dev          # dev server
bun run build        # production build
```

## Project Structure

```
local-surf/
├── server/
│   └── src/
│       ├── config/          # db, redis, s3, env, passport
│       ├── db/schema/       # Drizzle table definitions
│       ├── lib/             # errors, jwt, validation, logger
│       ├── middleware/       # auth, rate-limit, validation, error handler
│       └── modules/         # auth, file, folder, share, trash, user, health
├── web/                     # React frontend
├── docker/                  # Dockerfiles + compose
└── README.md
```

## License

MIT
