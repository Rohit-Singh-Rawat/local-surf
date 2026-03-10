/**
 * TanStack Start production server for Bun.
 * Loads the built handler and serves on PORT (default 3000).
 */
const PORT = Number(process.env.PORT ?? 3000)
const SERVER_ENTRY = './dist/server/server.js'

async function main() {
  const mod = await import(SERVER_ENTRY)
  const handler = mod.default as { fetch: (req: Request) => Response | Promise<Response> }

  Bun.serve({
    port: PORT,
    fetch: handler.fetch,
  })

  console.log(`[TanStack Start] Server listening on http://localhost:${PORT}`)
}

main().catch((err) => {
  console.error('[TanStack Start] Failed to start:', err)
  process.exit(1)
})
