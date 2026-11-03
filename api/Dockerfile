FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
# Prisma no se conecta para generar el cliente; la URL solo satisface el config.
ENV DATABASE_URL="postgresql://dasi:dasi@db:5432/dasi?schema=public"
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000
CMD ["sh", "docker-entrypoint.sh"]
