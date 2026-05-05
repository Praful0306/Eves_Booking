FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
COPY prisma/ ./prisma/

RUN npm ci

COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN cd apps/api && npx tsup src/server.ts --format cjs --clean

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/server.js"]
