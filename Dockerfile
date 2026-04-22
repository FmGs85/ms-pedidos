FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Dependências de produção ──────────────────────────────────
FROM base AS deps
RUN npm ci --omit=dev

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Imagem final ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3002

CMD ["node", "dist/server.js"]
