FROM node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 AS node
FROM ubuntu:24.04@sha256:24737cef17f4e22b1977df7d9a05e77c4e28b7da5b8911f8d8ccda136bf3573c
COPY --from=node /usr/local/ /usr/local/
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl libatomic1 \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable pnpm && corepack prepare pnpm@10.33.2 --activate
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile
COPY backend/scripts/verify-native.cjs backend/scripts/verify-native.cjs
RUN pnpm --filter @whistle-epl/backend exec node scripts/verify-native.cjs
COPY eslint.config.mjs .prettierrc.json .prettierignore ./
COPY frontend/ frontend/
COPY backend/ backend/
COPY docs/verification/phase-1/root-commands.test.mjs docs/verification/phase-1/root-commands.test.mjs
RUN pnpm db:validate && pnpm lint && pnpm typecheck && pnpm format:check \
    && pnpm test && pnpm build && pnpm verify:commands
