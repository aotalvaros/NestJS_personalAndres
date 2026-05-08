# ========================================
# Dockerfile - Order Service
# ========================================
# Build multi-stage: dependencias → código → imagen final

# STAGE 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build NestJS
RUN npm run build

# STAGE 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Instalar solo production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copiar compiled code del builder
COPY --from=builder /app/dist ./dist

# Crear usuario non-root por seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=30s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
