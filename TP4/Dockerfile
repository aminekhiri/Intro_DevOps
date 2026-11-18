# ---- Builder : deps de prod uniquement ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src

# ---- Runner ----
FROM node:22-alpine
# npm/npx ne servent pas au runtime : on les retire (surface d'attaque + CVE remontees par trivy)
RUN apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
