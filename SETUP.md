# 🔧 SETUP & TROUBLESHOOTING.md

**Proyecto**: Curso NestJS - Spec-Driven Development  
**Estado**: Operativo | **Última actualización**: 3 mayo 2026

---

## ⚡ Setup Inicial (5 minutos)

### 1. Navegar al Proyecto
```bash
cd d:\Cursos\Curso_nest\02-examples
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Levantar Servicios Docker
```bash
docker-compose up -d
```

Verificar que todos los servicios están corriendo:
```bash
docker-compose ps
# Deberías ver: postgres, redis, kafka, rabbitmq con status "Up"
```

### 4. Ejecutar Migraciones
```bash
npm run typeorm:migration:run
```

### 5. Verificar Baseline
```bash
npm run test
# Todos los tests deben pasar en verde
```

✅ **Setup completado** - Ya puedes empezar a trabajar

---

## 🚨 Problemas Comunes & Soluciones

### ❌ Error: "Cannot find module '@nestjs/common'"
**Causa**: Dependencies no instaladas  
**Solución**:
```bash
npm install
npm run build
```

---

### ❌ Error: "Port 5432 already in use"
**Causa**: PostgreSQL ya está corriendo (o otro servicio en ese puerto)  
**Soluciones**:
```bash
# Opción 1: Detener contenedor anterior
docker-compose down
docker-compose up -d

# Opción 2: Matar proceso en puerto
# Windows
netstat -ano | findstr :5432
taskkill /PID [PID] /F

# macOS/Linux
lsof -i :5432
kill -9 [PID]
```

---

### ❌ Error: "redis.get is not a function"
**Causa**: Redis client no está correctamente inyectado  
**Solución**:
```typescript
// ✅ BIEN
constructor(@Inject('CACHE_MANAGER') private cache: Cache) {}
const value = await this.cache.get('key')

// ❌ MALO
constructor(private redis: Redis) {}
const value = this.redis.get('key')  // Redis es undefined
```

---

### ❌ Error: "Timed out waiting for Kafka to connect"
**Causa**: Kafka no está levantado o tarda en iniciar  
**Solución**:
```bash
# Ver logs de Kafka
docker-compose logs -f kafka

# Esperár 10-15 segundos después de docker-compose up
# Kafka es lento iniciando

# Si persiste: reiniciar todo
docker-compose down -v
docker-compose up -d
sleep 15
npm run test:integration
```

---

### ❌ Error: "Module not found: src/migrations/..."
**Causa**: Migración no fue generada o se perdió  
**Solución**:
```bash
# Regenerar migraciones
npm run typeorm:migration:generate -- --name CreateOrderTable

# Ejecutar
npm run typeorm:migration:run

# Si falla, revertir última
npm run typeorm:migration:revert
```

---

### ❌ Error: "EADDRINUSE: address already in use :::3000"
**Causa**: Servidor NestJS ya está corriendo en puerto 3000  
**Solución**:
```bash
# Opción 1: Matar proceso anterior
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Opción 2: Usar puerto diferente
PORT=3001 npm run start:dev

# Opción 3: Esperar a que el anterior termine
# (algunas veces tarda 10-20 segundos)
```

---

### ❌ Error: Test "Timeout - Async callback was not invoked"
**Causa**: Test espera evento que nunca llega (Kafka/RabbitMQ)  
**Solución**:
```typescript
// Aumentar timeout para integration tests
jest.setTimeout(10000)  // 10 segundos

// O en jest.integration.config.js:
testTimeout: 10000

// Verificar que el mock está correctamente configurado:
jest.mock('@nestjs/microservices', () => ({
  ...jest.requireActual('@nestjs/microservices'),
  // Mock aquí
}))
```

---

### ❌ Error: "Column does not exist" en BD
**Causa**: Migración no fue aplicada o se perdió  
**Solución**:
```bash
# Ver qué migraciones han sido aplicadas
npm run typeorm -- migration:show

# Aplicar todas pendientes
npm run typeorm:migration:run

# Si la migración no existe, generarla:
npm run typeorm:migration:generate -- --name AddColumnName

# Si necesitas revertir TODAS (⚠️ DESTRUCTIVO)
npm run typeorm -- migration:revert --all
```

---

### ❌ Error: "jest.mock() called while tests running"
**Causa**: Mock setupeado en test file en lugar de beforeAll  
**Solución**:
```typescript
// ✅ BIEN - fuera del test
jest.mock('../stripe.service')

describe('OrderService', () => {
  let mockStripe: jest.Mock
  
  beforeAll(() => {
    mockStripe = Stripe as jest.Mock
    mockStripe.mockResolvedValue({ ... })
  })
  
  it('should process payment', async () => {
    // Test aquí
  })
})

// ❌ MALO - dentro del test
it('should process payment', async () => {
  jest.mock('../stripe.service')  // ❌ Demasiado tarde
})
```

---

### ❌ Error: "ESLint: Missing trailing comma" / Prettier Issues
**Causa**: Código no fue formateado  
**Solución**:
```bash
# Aplicar formatter automático
npm run format

# Fijar linting issues
npm run lint

# Después verificar build:
npm run build
```

---

### ❌ Error: "RabbitMQ connection refused"
**Causa**: RabbitMQ no está corriendo o puerto 5672 ocupado  
**Solución**:
```bash
# Ver si RabbitMQ está en docker-compose.yml
cat docker-compose.yml | grep -A 5 rabbitmq

# Reiniciar RabbitMQ
docker-compose restart rabbitmq

# Ver logs
docker-compose logs -f rabbitmq

# Esperar 10+ segundos después de up (es lento)
```

---

### ❌ Error: "FATAL: database does not exist"
**Causa**: PostgreSQL levantó pero BD no fue creada  
**Solución**:
```bash
# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Si la BD no existe, crearla manualmente:
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE order_service;"

# Luego ejecutar migraciones:
npm run typeorm:migration:run
```

---

### ❌ Error: "Cannot find test files" / Tests not running
**Causa**: Jest config incorrecto o archivos no existen  
**Solución**:
```bash
# Verificar jest config
cat package.json | grep -A 20 '"jest"'

# Verificar que los .spec.ts existen:
find src -name "*.spec.ts"

# Ejecutar con verbose:
npm run test -- --verbose

# Si hay glob issues, especificar archivo:
npm run test -- src/services/order.service.spec.ts
```

---

## 🏥 Health Check (Verificar Estado)

### Verificar que TODO está bien

```bash
#!/bin/bash
cd 02-examples

echo "1. Verificando Docker..."
docker-compose ps

echo "2. Verificando compilación TypeScript..."
npm run build

echo "3. Ejecutando unit tests..."
npm run test

echo "4. Ejecutando integration tests..."
npm run test:integration

echo "5. Ejecutando E2E tests..."
npm run test:e2e

echo "✅ TODO OK!"
```

**Alternativa rápida**:
```bash
cd 02-examples
npm run test:cov  # Unit + coverage
docker-compose ps  # Services levantados?
```

---

## 🔄 Reinicio Completo (Nuclear Option)

Cuando nada funcione, hacer reset completo:

```bash
# 1. Parar todo
docker-compose down -v
npm cache clean --force

# 2. Limpiar build
rm -rf dist node_modules coverage

# 3. Reinstalar
npm install

# 4. Recrear servicios
docker-compose up -d
sleep 15

# 5. Migraciones
npm run typeorm:migration:run

# 6. Verificar
npm run test
```

---

## 📊 Verificación de Servicios

### PostgreSQL

```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d order_service

# Listar tablas
\dt

# Ver esquema de una tabla
\d orders

# Salir
\q
```

### Redis

```bash
# Conectar a Redis CLI
docker-compose exec redis redis-cli

# Listar todas las claves
KEYS *

# Ver valor de una clave
GET payment:order-123:idempotency-key-456

# Eliminar caché (DEBUG)
FLUSHALL

# Salir
EXIT
```

### Kafka

```bash
# Ver topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Crear topic (si no existe)
docker-compose exec kafka kafka-topics --create --topic order.created \
  --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# Consumir mensajes en tiempo real
docker-compose exec kafka kafka-console-consumer --topic order.created \
  --bootstrap-server localhost:9092 --from-beginning
```

### RabbitMQ

```bash
# UI RabbitMQ (en navegador):
http://localhost:15672
# Usuario: guest
# Password: guest

# CLI: Ver queues
docker-compose exec rabbitmq rabbitmqctl list_queues

# Ver bindings
docker-compose exec rabbitmq rabbitmqctl list_bindings
```

---

## 📝 Logs Útiles

### Ver logs del app
```bash
npm run start:dev
# Se muestra en consola automáticamente
```

### Ver logs de Docker
```bash
# Todos los servicios
docker-compose logs -f

# Solo uno
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f kafka
docker-compose logs -f rabbitmq
```

### Ver logs de tests
```bash
# Con verbose output
npm run test -- --verbose

# Con detectOpenHandles (detecta conexiones no cerradas)
npm run test -- --detectOpenHandles

# Debug específico de test
npm run test:debug -- src/services/order.service.spec.ts
```

---

## 🎯 Commandos de Emergencia

| Situación | Comando |
|-----------|---------|
| **Tests flakys** | `npm run test -- --forceExit` |
| **Caché corrupta** | `docker-compose exec redis redis-cli FLUSHALL` |
| **BD corrupta** | `docker-compose down -v && docker-compose up -d` |
| **Puerto ocupado** | `netstat -ano \| findstr :PORT` (Windows) |
| **Ver qué cambió** | `git status` |
| **Descartar cambios** | `git checkout -- .` |
| **Rebuild Docker** | `docker-compose build --no-cache` |
| **Limpiar node_modules** | `rm -rf node_modules && npm install` |

---

## ✅ Pre-Commit Checklist

Antes de hacer `git commit`:

```bash
# 1. ¿Compila?
npm run build

# 2. ¿Linter OK?
npm run lint

# 3. ¿Tests pasan?
npm run test
npm run test:integration
npm run test:e2e

# 4. ¿Coverage >= 80%?
npm run test:cov

# 5. ¿Sin console.log?
grep -r "console.log" src/  # Debe retornar nada

# 6. ¿Sin TODO comments?
grep -r "TODO:" src/  # Mejor tenerlos resueltos

# Si todo pasó:
git add .
git commit -m "feat: descripción clara"
git push
```

---

## 🚀 Próximos Pasos

1. **Ejecuta health check** arriba para verificar setup
2. **Lee SPEC.md** para entender requisitos
3. **Revisa los tests** existentes (`src/**/*.spec.ts`)
4. **Sigue el flujo** en AGENTS.md → Implementa → Valida → Commit

---

**Creado para**: Agentes IA y desarrolladores  
**Última revisión**: 3 mayo 2026  
**Soporte**: Ver RULES.md para rules de código obligatorias
