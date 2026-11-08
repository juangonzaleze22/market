# syntax=docker/dockerfile:1

# ---- Build de Angular ----
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# El `postinstall` ejecuta scripts/generate-env.mjs, por eso necesita la carpeta.
COPY scripts ./scripts
RUN mkdir -p src/environments
RUN npm ci
COPY . .
RUN npm run build

# ---- Nginx: sirve el frontend y hace proxy al backend ----
FROM nginx:stable-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
