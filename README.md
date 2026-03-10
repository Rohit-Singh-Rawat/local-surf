# Local Surf

A cloud storage application with Google authentication, folder hierarchies, and sharing. Files upload directly to S3 via presigned URLs — the server never touches file bytes.

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Google OAuth 2.0, JWT with refresh token rotation |
| **Files** | Upload (100MB single PUT, up to 5GB multipart), download, rename, search, soft delete |
| **Folders** | Create, rename, nested hierarchy (max depth 10), cascade delete |
| **Sharing** | Share with users by email or create public links (view/download) |
| **Trash** | Soft delete with restore; permanent delete when emptying trash |

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Runtime | Bun |
| API | Express 5, TypeScript (strict) |
| Database | PostgreSQL, Drizzle ORM |
| Cache | Redis (rate limiting) |
| Storage | AWS S3 or S3-compatible (presigned PUT/GET; R2, MinIO supported) |
| Frontend | React 19, Vite, TanStack Router, TanStack Query, Tailwind CSS 4, shadcn/ui |
| Tooling | Biome, Zod, Vitest |

---

## Prerequisites

- **Bun** ≥ 1.0 — [Install Bun](https://bun.sh)
- **PostgreSQL** ≥ 15
- **Redis** ≥ 7
- **Google Cloud** — OAuth 2.0 credentials
- **AWS** (or S3-compatible) — S3 bucket and IAM credentials

---

## Setup & Run

### 1. Clone and install

```bash
git clone <repo-url> local-surf
cd local-surf
bun install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values. See [Configuration](#configuration) for required variables.

> **Important:** Set `CORS_ORIGIN` and `FRONTEND_URL` to `http://localhost:3000` (the web app runs on port 3000).

### 3. Start PostgreSQL and Redis

Ensure PostgreSQL and Redis are running locally.

### 4. Run database migrations

```bash
cd server && bun run db:migrate && cd ..
```

### 5. Start the application

```bash
bun run dev
```

| Service | URL |
|---------|-----|
| API Server | http://localhost:8000 |
| Web App | http://localhost:3000 |

---

## Configuration

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | | `development` or `production` (default: development) |
| `PORT` | | Server port (default: 8000) |
| `DATABASE_URL` | ✓ | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/localsurf` |
| `REDIS_URL` | ✓ | Redis connection string, e.g. `redis://localhost:6379` |
| `LOG_SQL` | | `true` to log SQL queries (debug only) |
| `CORS_ORIGIN` | ✓ | Frontend origin(s), comma-separated. Local: `http://localhost:3000` |
| `FRONTEND_URL` | ✓ | Same as `CORS_ORIGIN` for redirects |
| `GOOGLE_CLIENT_ID` | ✓ | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | ✓ | Same |
| `GOOGLE_CALLBACK_URL` | | OAuth callback (default: `http://localhost:8000/api/auth/google/callback`) |
| `JWT_ACCESS_SECRET` | ✓ | Min 32 chars. Generate: `openssl rand -base64 48` |
| `AWS_REGION` | ✓ | e.g. `us-east-1` (use `auto` for Cloudflare R2) |
| `AWS_ACCESS_KEY_ID` | ✓ | IAM user with S3 access |
| `AWS_SECRET_ACCESS_KEY` | ✓ | |
| `S3_BUCKET` | ✓ | Bucket name |
| `S3_ENDPOINT` | ✓ | `https://s3.amazonaws.com` or R2/MinIO endpoint |

### Web (`web/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | API base URL |

Create `web/.env` only if you need to override the default.

---

## Deployment

### Server (Vercel)

The server is configured for Vercel serverless deployment. See [server/README.md](server/README.md) for details.

---

## External Services

### Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** (Web application)
3. Add redirect URI: `http://localhost:8000/api/auth/google/callback` (and production URL if deployed)
4. Copy Client ID and Secret to `server/.env`

### AWS S3 (or S3-compatible)

**Bucket CORS** (bucket → Permissions → CORS):

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET", "HEAD"],
  "AllowedOrigins": ["http://localhost:3000"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}]
```

**IAM policy** (minimal for server):

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

---

## Scripts

| Workspace | Command | Description |
|-----------|---------|-------------|
| Root | `bun run dev` | Start server + web concurrently |
| **Server** | `bun run dev` | Dev with hot reload |
| | `bun run start` | Production |
| | `bun run db:migrate` | Run migrations |
| | `bun run db:generate` | Generate migrations |
| | `bun run db:push` | Push schema (dev) |
| | `bun run db:studio` | Drizzle Studio |
| | `bun run lint:fix` | Biome fix |
| | `bun run typecheck` | TypeScript check |
| **Web** | `bun run dev` | Dev (:3000) |
| | `bun run build` | Production build |
| | `bun run start` | Serve production build |
| | `bun run preview` | Preview build |
| | `bun run test` | Vitest |
| | `bun run check` | Biome |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| **Auth** | | |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| POST | `/api/auth/exchange` | Exchange code for tokens |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/logout-all` | Logout all devices |
| GET | `/api/auth/failed` | Auth failed (JSON) |
| **User** | | |
| GET | `/api/users/me` | Current user + storage |
| **Files** | | |
| POST | `/api/files/upload` | Initiate upload → presigned URL |
| POST | `/api/files/:id/confirm` | Confirm single PUT upload |
| POST | `/api/files/:id/complete` | Complete multipart upload |
| POST | `/api/files/:id/abort` | Abort multipart upload |
| GET | `/api/files/:id` | Get file metadata |
| GET | `/api/files/:id/download` | Presigned download URL |
| GET | `/api/files/:id/view` | Presigned view URL |
| PATCH | `/api/files/:id` | Rename |
| DELETE | `/api/files/:id` | Soft delete |
| POST | `/api/files/:id/restore` | Restore from trash |
| GET | `/api/files/search?q=` | Search by name |
| **Folders** | | |
| POST | `/api/folders` | Create |
| GET | `/api/folders/root/contents` | Root contents |
| GET | `/api/folders/:id/contents` | Folder contents |
| GET | `/api/folders/:id/path` | Breadcrumb path |
| GET | `/api/folders/trash` | List trash |
| PATCH | `/api/folders/:id` | Rename |
| DELETE | `/api/folders/:id` | Soft delete (cascade) |
| POST | `/api/folders/:id/restore` | Restore from trash |
| **Shares** | | |
| GET | `/api/shares/public/:token` | Access public link (no auth) |
| GET | `/api/shares/shared-with-me` | Files shared with me |
| GET | `/api/shares/my-shares` | My shares |
| GET | `/api/shares/:id/access` | Access shared file |
| POST | `/api/shares/user` | Share with user |
| POST | `/api/shares/link` | Create public link |
| PATCH | `/api/shares/:id` | Update share |
| DELETE | `/api/shares/:id` | Revoke share |
| **Trash** | | |
| DELETE | `/api/trash/files/:id` | Permanent delete file |
| DELETE | `/api/trash/folders/:id` | Permanent delete folder |
| DELETE | `/api/trash/empty` | Empty trash |
| **Health** | | |
| GET | `/api/health` | Health check |

---

## Project Structure

```
local-surf/
├── server/           # Express API — see server/README.md
├── web/              # React frontend — see web/README.md
└── README.md
```

---

## License

MIT
