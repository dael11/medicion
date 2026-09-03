# ── Etapa 1: build del frontend (React) ──────────────────
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
# API en ruta relativa: el backend sirve la app en el mismo dominio
ENV REACT_APP_API_URL=/api
RUN npm run build

# ── Etapa 2: runtime (Node + backend + frontend build) ───
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY backend/ ./
COPY db/ /app/db/
COPY --from=frontend /app/frontend/build /app/frontend/build

# carpeta persistente para archivos subidos
RUN mkdir -p uploads/imagenes uploads/archivos

EXPOSE 4000
CMD ["node", "server.js"]
