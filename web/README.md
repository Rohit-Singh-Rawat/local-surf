# Local Surf — Web

React 19 frontend for Local Surf. Drive UI with folders, files, sharing, trash, and search.

---

## Tech Stack

- **Runtime:** Bun
- **Build:** Vite 7
- **Framework:** React 19, TanStack Router, TanStack Query
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Forms:** TanStack Form
- **State:** TanStack Store
- **Testing:** Vitest, Testing Library

---

## Setup

### Prerequisites

- Bun ≥ 1.0
- Local Surf API server running (see [server/README.md](../server/README.md))

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment (optional)

Create `web/.env` only if you need to override the default API URL:

```env
VITE_API_URL=http://localhost:8000
```

Default is `http://localhost:8000`.

### 3. Start dev server

```bash
bun run dev
```

Web app runs at http://localhost:3000

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server on port 3000 |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run preview` | Preview production build |
| `bun run test` | Vitest |
| `bun run lint` | Biome lint |
| `bun run format` | Biome format |
| `bun run check` | Biome check |

---

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── drive/      # FileCard, FolderCard, ShareDialog, DropZone, Breadcrumb, etc.
│   │   └── ui/         # shadcn components (button, dialog, dropdown, etc.)
│   ├── contexts/       # share-dialog, file-preview
│   ├── integrations/   # TanStack Query (devtools, root-provider)
│   ├── lib/            # api client, drive-queries, auth-guards, auth-functions
│   ├── routes/         # TanStack Router
│   │   ├── _public/    # login, auth callback, auth error
│   │   ├── _drive/     # drive, folders, trash, shared, search, starred, recent
│   │   └── share.$token.tsx  # Public share view
│   ├── store/          # auth, toast, ui, uploads
│   ├── styles.css
│   ├── env.ts          # VITE_ env validation
│   └── router.tsx
├── package.json
└── vite.config.ts
```

---

## Routes

| Path | Description |
|------|-------------|
| `/login` | Login (Google OAuth) |
| `/auth/callback` | OAuth callback |
| `/auth/error` | Auth error |
| `/` | Drive root |
| `/folders/:folderId` | Folder contents |
| `/trash` | Trash |
| `/shared` | Shared with me |
| `/shared/:shareId` | Shared folder/file |
| `/search` | Search |
| `/starred` | Starred items |
| `/recent` | Recent items |
| `/share/:token` | Public share (no auth) |

