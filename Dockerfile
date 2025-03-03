FROM node:22.8-bookworm-slim AS builder

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

RUN npm uninstall -g yarn && \
    rm -rf /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    corepack enable && \
    yarn set version canary

USER node
WORKDIR /usr/src/app

COPY --chown=node:node ./src /usr/src/app

RUN yarn install --immutable

FROM node:22.8-bookworm-slim

USER node
WORKDIR /usr/src/app

COPY --from=builder --chown=node:node /usr/src/app /usr/src/app

CMD ["yarn", "dev", "--host"]
