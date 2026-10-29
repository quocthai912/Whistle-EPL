FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 AS build
WORKDIR /app
ENV COREPACK_HOME=/opt/corepack
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile
COPY backend backend
RUN pnpm db:generate && pnpm --filter @whistle-epl/backend build
FROM build AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
USER node
WORKDIR /app/backend
CMD ["node", "dist/main.js"]
