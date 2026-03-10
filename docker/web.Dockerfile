FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist/client /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
