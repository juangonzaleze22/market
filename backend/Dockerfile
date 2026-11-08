# syntax=docker/dockerfile:1

# ---- Dependencias (incluye devDependencies para compilar) ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Compilacion TypeScript ----
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Imagen final: solo produccion ----
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# La carpeta de uploads la monta docker-compose como volumen.
# Se crea con permisos del usuario "node" para que el volumen nazca escribible.
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
