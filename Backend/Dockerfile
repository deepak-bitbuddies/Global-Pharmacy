# syntax=docker/dockerfile:1

################################################################################
# Stage 1: install full dependency set (incl. devDependencies) for the build
################################################################################
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

################################################################################
# Stage 2: compile TypeScript -> dist/
################################################################################
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* tsconfig.json ./
COPY src ./src
RUN npm run build

################################################################################
# Stage 3: production-only dependencies (no devDependencies at all)
################################################################################
FROM node:22-alpine AS production-deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

################################################################################
# Stage 4: minimal runtime image
################################################################################
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root execution — never run the app as root inside the container.
RUN addgroup -S nodejs && adduser -S fastify -G nodejs

COPY --from=production-deps --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=fastify:nodejs /app/dist ./dist
COPY --chown=fastify:nodejs package.json ./

USER fastify

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
