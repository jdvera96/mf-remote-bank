#
# Microfrontend Remote (Native Federation) - Docker build
#
# - Build: genera `dist/` (incluye `remoteEntry.json`) usando `npm run mf:build`
# - Runtime: sirve `dist/` por HTTP para que el Shell consuma `/remoteEntry.json`
#

############################
# 1) Build stage
############################
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos manifests primero (mejor cache)
COPY package.json ./

# `postinstall` ejecuta este script; debe existir ANTES de `npm install`
RUN mkdir -p tools
COPY tools/patch-native-federation.mjs ./tools/patch-native-federation.mjs

# Instala dependencias (no dependemos del lockfile, ya que puede estar ignorado o contener entradas por OS)
RUN npm install --no-audit --no-fund

# Copia el resto del proyecto
COPY . .

# Build MF Remote (Native Federation)
RUN npm run mf:build


############################
# 2) Runtime stage
############################
FROM node:20-alpine AS runtime

WORKDIR /app

# Server estático (solo Node stdlib)
COPY tools/serve-dist.mjs ./tools/serve-dist.mjs

# Artefactos build
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["node", "tools/serve-dist.mjs", "--dir", "dist"]


