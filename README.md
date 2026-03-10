# Local Surf

Cloud storage app with Google auth, folder hierarchies, and sharing. Files upload directly to S3 via presigned URLs — the server never touches file bytes.

## Features

- **Auth** — Google OAuth 2.0, JWT + refresh token rotation
- **Files** — Upload (100MB max), download, rename, search, soft delete
- **Folders** — Create, rename, nested hierarchy, cascade delete
- **Sharing** — Share with users by email or create public links (view/download)
- **Trash** — Soft delete with restore; permanent delete when emptying trash

## Tech Stack

| Layer | Stack |
|-------|-------|
| Runtime | Bun |
| API | Express 5, TypeScript (strict) |
| Database | PostgreSQL, Drizzle ORM |
| Cache | Redis (rate limiting) |
| Storage | AWS S3 (presigned PUT/GET) |
| Frontend | React 19, TanStack Start, TanStack Query, Tailwind CSS 4, shadcn/ui |
| Tooling | Biome, Zod, Vitest |

## Quick Start

**Prerequisites:** Bun ≥1.0, PostgreSQL ≥15, Redis ≥7

```bash
git clone <repo-url> local-surf && cd local-surf
bun install
cp server/.env.example server/.env
# Edit server/.env — see Configuration below
cd server && bun run db:migrate && cd ..
bun run dev
```

Server: `http://localhost:8000` · Web: `http://localhost:3000`

### Docker

```bash
# Fill in server/.env first, then:
docker compose -f docker/docker-compose.yml up --build

# Run migrations
docker compose -f docker/docker-compose.yml exec server bun run db:migrate
```

Postgres :5432, Redis :6379, API :8000, Web :3000. No nginx — web runs TanStack Start server.

## Configuration

### Server (`server/.env`)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✓ | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | ✓ | `redis://localhost:6379` |
| `GOOGLE_CLIENT_ID` | ✓ | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | ✓ | Same |
| `JWT_ACCESS_SECRET` | ✓ | Min 32 chars. `openssl rand -base64 48` |
| `AWS_REGION` | ✓ | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` | ✓ | IAM user with S3 access |
| `AWS_SECRET_ACCESS_KEY` | ✓ | |
| `S3_BUCKET` | ✓ | Bucket name |
| `S3_ENDPOINT` | ✓ | `https://s3.amazonaws.com` |
| `CORS_ORIGIN` | ✓ | `http://localhost:3000` |
| `FRONTEND_URL` | ✓ | Same as CORS_ORIGIN |

### Web (`web/.env`)

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `http://localhost:8000` | API base URL |

## External Services

### Google OAuth

1. [Create OAuth 2.0 Client ID](https://console.cloud.google.com/apis/credentials) (Web application)
2. Add redirect URI: `http://localhost:8000/api/auth/google/callback`
3. Copy Client ID and Secret to `server/.env`

### AWS S3

**CORS** (bucket → Permissions → CORS):

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET", "HEAD"],
  "AllowedOrigins": ["http://localhost:3000"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}]
```

**IAM** (minimal policy for server):

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

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| **Auth** |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| POST | `/api/auth/refresh` | Rotate tokens |
| **User** |
| GET | `/api/users/me` | Current user + storage |
| **Files** |
| POST | `/api/files/upload` | Initiate upload → presigned URL |
| POST | `/api/files/:id/confirm` | Confirm after S3 upload |
| GET | `/api/files/:id/download` | Presigned download URL |
| PATCH | `/api/files/:id` | Rename |
| DELETE | `/api/files/:id` | Soft delete |
| GET | `/api/files/search?q=` | Search by name |
| **Folders** |
| POST | `/api/folders` | Create |
| GET | `/api/folders/root/contents` | Root contents |
| GET | `/api/folders/:id/contents` | Folder contents |
| PATCH | `/api/folders/:id` | Rename |
| DELETE | `/api/folders/:id` | Soft delete (cascade) |
| **Shares** |
| POST | `/api/shares/user` | Share with user |
| POST | `/api/shares/link` | Create public link |
| GET | `/api/shares/public/:token` | Access public link |
| **Trash** |
| DELETE | `/api/trash/files/:id` | Permanent delete file |
| DELETE | `/api/trash/folders/:id` | Permanent delete folder |
| DELETE | `/api/trash/empty` | Empty trash |
| GET | `/api/health` | Health check |

## Scripts

| Workspace | Command | Description |
|-----------|---------|-------------|
| Root | `bun run dev` | Start server + web |
| **Server** | `bun run dev` | Dev with hot reload |
| | `bun run start` | Production |
| | `bun run db:migrate` | Run migrations |
| | `bun run db:studio` | Drizzle Studio |
| | `bun run lint:fix` | Biome fix |
| **Web** | `bun run dev` | Dev (:3000) |
| | `bun run build` | Production build |
| | `bun run preview` | Preview build |
| | `bun run test` | Vitest |
| | `bun run check` | Biome |

## Project Structure

```
local-surf/
├── server/src/
│   ├── config/       # db, redis, s3, env, passport
│   ├── db/schema/    # Drizzle tables
│   ├── lib/          # errors, jwt, validation, logger
│   ├── middleware/   # auth, rate-limit, validation, error handler
│   └── modules/      # auth, file, folder, share, trash, user, health
├── web/src/
│   ├── components/   # drive (FileCard, FolderCard, ShareDialog), ui (shadcn)
│   ├── routes/       # _public, _drive (drive, folders, trash, shared, search)
│   ├── lib/          # api client, drive queries, auth guards
│   ├── store/        # auth, toast, ui
│   └── integrations/ # TanStack Query
└── README.md
```

## License

MIT
