ARG CADDY_IMAGE=caddy:2.11.7@sha256:5e5286cb37d44086d651a5363f05f43a692ce4d649d88fb1bd844579f45fa9e8
FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile
COPY frontend frontend
RUN pnpm --filter @whistle-epl/frontend build
FROM ${CADDY_IMAGE} AS runtime
COPY --from=build /app/frontend/dist /srv
COPY ops/Caddyfile /etc/caddy/Caddyfile
