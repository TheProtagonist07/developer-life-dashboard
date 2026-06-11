FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY package.json ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
