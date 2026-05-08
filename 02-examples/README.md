# 🎯 Spec-Driven Development: Ejemplo Completo

**Bienvenido a la implementación de un Sistema de Gestión de Pedidos** usando Spec-Driven Development con todos los conceptos aprendidos.

---

## 📚 ¿Qué es esto?

Este es un **ejemplo funcional** que integra:

- ✅ **TypeORM** - Data Layers, Entidades, Relaciones, Migraciones
- ✅ **Redis** - Caching, Idempotencia, Cache-Aside Pattern
- ✅ **Kafka** - Event Sourcing, Topics, Partitions
- ✅ **RabbitMQ** - Task Queue, Exchanges, Bindings, DLQ
- ✅ **GraphQL** - Queries, Mutations, Resolvers, Types
- ✅ **Jest** - Unit, Integration, E2E Tests
- ✅ **Docker** - Compose, Health Checks, Orchestration

**Diseño**: Spec-Driven Development
- Especificación primero (`SPEC.md`)
- Código desde especificación
- Tests desde requisitos
- Documentación automática

---

## 🚀 Empezar en 5 Minutos

### Opción 1: Automático (Recomendado)

```bash
# 1. Usar make (en Linux/Mac)
make setup

# O en Windows/sin make:
cd 02-examples
cp .env.example .env
docker-compose up -d
npm install
npm run build
npm run test
```

### Opción 2: Paso a Paso

```bash
# 1. Navegar a carpeta
cd 02-examples

# 2. Instalar dependencias
npm install

# 3. Crear .env
cp .env.example .env

# 4. Levantar servicios
docker-compose up -d

# 5. Esperar a que PostgreSQL esté listo
docker-compose exec postgres pg_isready -U postgres

# 6. Ejecutar migraciones
npm run typeorm:migration:run

# 7. Verificar salud
npm run start:dev
# Abre: http://localhost:3000/graphql

# 8. En otra terminal, ejecutar tests
npm run test
```

---

## 📋 Estructura

```
02-examples/
├── README.md (este archivo)
├── SPEC.md (especificación - punto de inicio)
├── IMPLEMENTATION.md (estado de desarrollo)
├── HOJA-DE-RUTA.md (próximos pasos)
│
├── src/
│   ├── entities/        ← TypeORM Entities
│   ├── repositories/    ← Custom repositories
│   ├── services/        ← Lógica de negocio
│   ├── services/__tests__/  ← Unit tests
│   ├── graphql/         ← GraphQL types, inputs, resolvers
│   ├── producers/       ← Kafka producers
│   ├── consumers/       ← Kafka + RabbitMQ consumers
│   ├── mocks/          ← Mock de APIs externas
│   └── main.ts         ← Entry point
│
├── tests/
│   ├── integration/    ← Tests con BD real
│   └── e2e/           ← Flujos completos
│
├── docker/
│   ├── docker-compose.yml
│   └── .env.example
│
├── package.json
└── tsconfig.json
```

---

## 🎮 Cómo Usar Este Ejemplo

### Paso 1: Leer Especificación
```bash
# Abrir y leer:
cat SPEC.md
```

**En SPEC.md encontrarás**:
- Descripción del sistema
- Requisitos funcionales (RF)
- Requisitos no-funcionales (RNF)
- Entidades (TypeORM)
- Test cases (Arrange-Act-Assert)
- Flujos principales (Kafka, RabbitMQ)
- APIs GraphQL

### Paso 2: Validar Especificación
```bash
# Usar Claude skills
/spec-validator
```

**Verifica**:
- Claridad de requisitos
- Completitud de test cases
- Implementabilidad
- Falta algún requirement

### Paso 3: Generar Código
```bash
# Opción A: Automático (genera TODO)
/spec-to-code

# Opción B: Por componente
/spec-to-code OrderService
/spec-to-code PaymentService
/spec-to-code EmailConsumer
```

**Genera**:
- TypeORM entities
- Repositories
- Services (con lógica)
- GraphQL resolvers
- Kafka/RabbitMQ producers y consumers
- Unit tests para cada componente

### Paso 4: Verificar Tests
```bash
npm run test                    # Unit tests
npm run test:integration       # Con BD real
npm run test:e2e              # Flujos completos
npm run test -- --coverage    # Coverage report
```

**Esperado**: 80%+ coverage, todos los tests pasan

### Paso 5: Levantar Servicios
```bash
docker-compose up -d
docker-compose ps              # Ver estado
docker-compose logs -f app     # Ver logs
```

**Verifica**: 
- PostgreSQL ✅
- Redis ✅
- Kafka ✅
- RabbitMQ ✅
- App ✅

### Paso 6: Probar API GraphQL
```bash
# Abrir en navegador:
http://localhost:3000/graphql

# O con curl:
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ myOrders { id totalAmount status } }"
  }'
```

---

## 🤖 Claude Code Integration

Este proyecto está diseñado para trabajar con Claude Code.

### Agents Disponibles

```bash
# Validar especificación
/spec-validator

# Generar código desde spec
/spec-to-code [component]

# Ejecutar tests
/test-runner

# Verificar Docker
/docker-health

# Revisar spec antes de implementar
/spec-review

# Generar tests E2E
/generate-e2e-test full-lifecycle

# Pre-flight check antes de deploy
/deployment-ready
```

### Skills Disponibles

```bash
# Convertir spec a código
/skill:spec-to-code

# Analizar coverage
/skill:test-coverage

# Health check Docker
/skill:docker-health

# Generar migraciones
/skill:migration-generator

# Formatear código
/skill:lint-and-fix
```

### Hooks Automáticos

```
on-spec-change    → Valida cambios en SPEC.md
on-commit        → Ejecuta tests antes de commit
on-test-failure  → Sugiere fixes para tests fallidos
on-docker-error  → Diagnostica problemas Docker
on-pr-ready      → Pre-flight check automático
```

---

## 📡 GraphQL Queries y Mutations

### Crear Pedido
```graphql
mutation CreateOrder {
  createOrder(input: {
    customerId: "550e8400-e29b-41d4-a716-446655440000"
    items: [
      { productId: "prod-1", quantity: 2, unitPrice: 50 }
      { productId: "prod-2", quantity: 1, unitPrice: 100 }
    ]
  }) {
    id
    customerId
    totalAmount  # 200
    status       # PENDING
    items {
      productId
      quantity
      unitPrice
    }
  }
}
```

### Procesar Pago (Idempotente)
```graphql
mutation ProcessPayment {
  processPayment(input: {
    orderId: "550e8400-e29b-41d4-a716-446655440001"
    idempotencyKey: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    paymentMethodId: "stripe_pm_12345"
  }) {
    paymentId
    status      # COMPLETED
    transactionId
    amount
  }
}
```

### Obtener Pedido
```graphql
query GetOrder {
  order(id: "550e8400-e29b-41d4-a716-446655440001") {
    id
    customerId
    totalAmount
    status
    items {
      productId
      quantity
    }
    payment {
      status
      transactionId
    }
    createdAt
  }
}
```

---

## 🧪 Ejecutar Tests

### Unit Tests (rápidos, sin dependencias externas)
```bash
npm run test                    # Todos
npm run test -- --watch       # Watch mode
npm run test -- order.service # Específico
npm run test -- --coverage    # Con coverage
```

**Esperado**: 47 tests, < 1 segundo

### Integration Tests (con BD real)
```bash
npm run test:integration
```

**Esperado**: 12 tests, < 3 segundos

### E2E Tests (flujos completos)
```bash
npm run test:e2e
```

**Esperado**: 5 tests, < 10 segundos

### Coverage Report
```bash
npm run test -- --coverage

# Genera:
# src/services/order.service.ts        85%
# src/services/payment.service.ts      90%
# src/graphql/resolvers/               80%
# Overall                              85%
```

---

## 🐳 Docker Troubleshooting

### Puerto en uso
```bash
# Matar proceso en puerto (ej: 5432)
lsof -i :5432
kill -9 <PID>

# O cambiar puerto en .env
DB_PORT=5433
```

### PostgreSQL no conecta
```bash
# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Ver logs
docker-compose logs postgres

# Reconstruir
docker-compose down -v
docker-compose up -d
```

### Kafka no funciona
```bash
# Ver topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Ver mensajes
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic events \
  --from-beginning
```

### RabbitMQ Management UI
```
URL: http://localhost:15672
User: guest
Pass: guest

Ver:
- Connections
- Channels
- Queues
- Dead Letter Queues
```

---

## 📊 Monitoring

### Logs de la aplicación
```bash
docker-compose logs -f app
```

### Health Check
```bash
curl http://localhost:3000/health

# Retorna:
{
  "database": "UP",
  "redis": "UP",
  "kafka": "UP",
  "rabbitmq": "UP",
  "status": "UP"
}
```

### Performance Profiling
```bash
/performance-profile --duration=30 --load=100
```

---

## 🎓 Learning Path

1. **Leer SPEC.md** - Entender qué hay que hacer
2. **Leer src/entities/** - Cómo están modelados los datos
3. **Leer src/services/** - Lógica de negocio
4. **Leer src/graphql/** - API hacia el cliente
5. **Leer src/__tests__/** - Cómo testear
6. **Leer tests/e2e/** - Flujos completos
7. **Ejecutar tests** - Validar que todo funciona
8. **Jugar con GraphQL** - Crear pedidos, pagar, etc

---

## 🔗 Documentación Relacionada

- **CLAUDE.md** - Lineamientos para Claude Code
- **.claude/agents.md** - Agentes personalizados
- **.claude/skills.md** - Habilidades de Claude
- **.claude/hooks.md** - Automatización
- **.claude/rules.md** - Reglas de código
- **docs/02-Example-Spec-Driven-Development/** - Documentación teórica

---

## ❓ FAQ

### ¿Por qué Redis para idempotencia?
- Rápido (< 10ms lookup)
- TTL automático (24 horas)
- Pattern: Exactly Once
- Fácil de escalar

### ¿Por qué Kafka y RabbitMQ?
- **Kafka**: Eventos (order.created, order.paid) - inmutables
- **RabbitMQ**: Tareas (email, notificaciones) - procesamiento garantizado
- No es sobre escoger uno, ambos tienen casos de uso diferentes

### ¿Por qué Spec-First?
- Especificación = Contrato
- Tests derivan de spec
- Código cumple spec
- Menos bugs, más clarity

### ¿Puedo usar esto en producción?
- Este es un EJEMPLO educativo
- Tiene mocks (Stripe, AWS)
- Pero estructura es production-ready
- Para prod: reemplazar mocks, agregar autenticación real, etc

---

## 🚀 Próximos Pasos

1. ✅ Setup completado
2. ✅ Tests verdes
3. ✅ Docker up
4. → Leer cada archivo `src/` para entender el flujo
5. → Jugar con GraphQL queries
6. → Leer tests para entender patrones
7. → Intentar agregar un nuevo endpoint
8. → Crear PR con cambios

---

## 📞 Necesitas Ayuda?

```bash
# Ver estado general
make health

# Ver logs
docker-compose logs -f app

# Ejecutar tests con verbose
npm run test -- --verbose

# Validator la spec
/spec-validator

# Pre-flight check
/deployment-ready
```

---

## ✨ Resumen

Este ejemplo demuestra un **flujo completo de Spec-Driven Development**:

```
SPEC.md (requisitos)
    ↓
Code generated (/spec-to-code)
    ↓
Tests written (80%+ coverage)
    ↓
Docker compose up (todos los servicios)
    ↓
GraphQL API listo en :3000/graphql
    ↓
Production-ready (con mocks)
```

**Happy coding! 🎉**

---

**Creado**: 2026-04-30
**Versión**: 1.0
**Mantenido por**: Spec-Driven Development with Claude
