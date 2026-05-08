#!/bin/bash

echo "🔍 Verificando setup del proyecto..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -n "1. Node.js: "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ No instalado${NC}"
    echo "   Descarga desde: https://nodejs.org/"
fi
echo ""

# 2. Verificar npm
echo -n "2. npm: "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} $NPM_VERSION"
else
    echo -e "${RED}✗ No instalado${NC}"
fi
echo ""

# 3. Verificar dependencies instaladas
echo -n "3. Dependencias instaladas: "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Ejecuta: npm install --legacy-peer-deps${NC}"
fi
echo ""

# 4. Verificar PostgreSQL
echo -n "4. PostgreSQL: "
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✓${NC} $PG_VERSION"

    # Verificar si puede conectar
    echo -n "   - Conectar a orderdb: "
    if psql -U postgres -d orderdb -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} No puede conectar (¿contraseña correcta?)"
        echo "     Verifica: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD en .env"
    fi
else
    echo -e "${RED}✗ No instalado${NC}"
    echo "   Descarga desde: https://www.postgresql.org/download/"
    echo "   O ejecuta: wsl apt-get install postgresql"
fi
echo ""

# 5. Verificar Redis (opcional)
echo -n "5. Redis (opcional): "
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version)
    echo -e "${GREEN}✓${NC} $REDIS_VERSION"

    # Verificar si puede conectar
    echo -n "   - Conectar: "
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${YELLOW}⚠${NC} No disponible (app usará caché en memoria)"
    fi
else
    echo -e "${YELLOW}⚠${NC} No instalado (app usará caché en memoria)"
fi
echo ""

# 6. Verificar .env
echo -n "6. .env configurado: "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC}"
    echo "   - KAFKA_ENABLED: $(grep KAFKA_ENABLED .env | cut -d= -f2)"
    echo "   - RABBITMQ_ENABLED: $(grep RABBITMQ_ENABLED .env | cut -d= -f2)"
    echo "   - DB_HOST: $(grep DB_HOST .env | cut -d= -f2)"
    echo "   - DB_NAME: $(grep DB_NAME .env | cut -d= -f2)"
else
    echo -e "${RED}✗ No existe${NC}"
    echo "   Ejecuta: cp .env.development .env"
fi
echo ""

# 7. Verificar proyecto compilado
echo -n "7. Proyecto compilado: "
if [ -d "dist" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Ejecuta: npm run build"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Resumen:"
echo ""
echo "REQUERIDO:"
echo "  ✓ Node.js 18+"
echo "  ✓ npm"
echo "  ✓ PostgreSQL 12+ (local o remoto)"
echo ""
echo "OPCIONAL:"
echo "  ⚠ Redis (sino, usa caché en memoria)"
echo "  ⚠ Docker (para Kafka/RabbitMQ, pero no es necesario)"
echo ""
echo "🚀 Próximo paso:"
echo "  npm run start:dev"
echo ""
