# syntax=docker/dockerfile:1
# Build: imagen Node con Angular CLI → artefactos SSR en /dist
# Uso: docker build -t sitio-estudiantes:prod --build-arg BUILD_CONFIGURATION=production .

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
ARG BUILD_CONFIGURATION=production
ENV NODE_OPTIONS=--max-old-space-size=4096
COPY . .
RUN npx ng build --configuration=${BUILD_CONFIGURATION}

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
# Solo dependencias de producción para Express (ya incluido en el bundle SSR o instalar express si hace falta)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 4000
# Punto de entrada del servidor SSR generado por Angular
CMD ["node", "dist/Angular_Sitio_Estudiantes/server/server.mjs"]
