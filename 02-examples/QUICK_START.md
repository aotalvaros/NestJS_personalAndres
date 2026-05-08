# 🚀 Quick Start Guide - Order Service

## Requisitos Previos
- Docker & Docker Compose
- Node.js 18+
- npm

## Instalación (5 minutos)

```bash
# 1. Clonar/entrar al proyecto
cd 02-examples

# 2. Instalar dependencias
npm install

# 3. Crear archivo de configuración
cp .env.example .env

# 4. Levantar servicios Docker
docker-compose up -d

# 5. Esperar a que PostgreSQL esté listo
docker-compose exec postgres pg_isready -U postgres

# 6. Iniciar servidor en modo desarrollo
npm run start:dev
```

Una vez completado, el servidor está en **http://localhost:3000**

---

## Pruebas

### Unit Tests (2 segundos)
```bash
npm run test
```

Resultado esperado:
```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

### Lint & Format
```bash
npm run lint
npm run format
```

### Build (Compilación)
```bash
npm run build
```

---

## Usar la API GraphQL

Abrir en navegador: **http://localhost:3000/graphql**

### 1️⃣ Crear un Pedido

```graphql
mutation {
  createOrder(input: {
    customerId: "550e8400-e29b-41d4-a716-446655440000"
    items: [
      { productId: "PROD-001", quantity: 2, unitPrice: 50 }
      { productId: "PROD-002", quantity: 1, unitPrice: 100 }
    ]
  }) {
    id
    status
    totalAmount
    items { productId quantity unitPrice }
  }
}
```

Respuesta:
```json
{
  "data": {
    "createOrder": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "PENDING",
      "totalAmount": 200,
      "items": [
        { "productId": "PROD-001", "quantity": 2, "unitPrice": 50 },
        { "productId": "PROD-002", "quantity": 1, "unitPrice": 100 }
      ]
    }
  }
}
```

**¿Qué pasó?**
- ✅ Order creado en BD
- ✅ Evento `order.created` publicado a Kafka
- ✅ Orden cacheada en Redis (1 hora)
- ✅ AuditConsumer registró en audit_logs

---

### 2️⃣ Procesar Pago (IDEMPOTENTE)

```graphql
mutation {
  processPayment(input: {
    orderId: "550e8400-e29b-41d4-a716-446655440001"
    idempotencyKey: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    paymentMethodId: "stripe_pm_12345"
  }) {
    paymentId
    status
    transactionId
    amount
  }
}
```

Respuesta:
```json
{
  "data": {
    "processPayment": {
      "paymentId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "COMPLETED",
      "transactionId": "stripe_ch_12345",
      "amount": 200
    }
  }
}
```

**¿Qué pasó?**
- ✅ Pago procesado a través de Stripe (mocked)
- ✅ Resultado guardado en Redis (24h) para IDEMPOTENCIA
- ✅ Evento `order.paid` publicado a Kafka
- ✅ Order actualizado a status PAID

**🔑 IDEMPOTENCIA**: Si ejecutas la misma mutation (mismo `idempotencyKey`):
- ⚡ Retorna resultado cacheado en < 10ms
- 🚫 NO duplica el cargo
- ✅ Garantía de "Exactly Once"

---

### 3️⃣ Consultar Pedido

```graphql
query {
  order(id: "550e8400-e29b-41d4-a716-446655440001") {
    id
    customerId
    totalAmount
    status
    items { 
      productId 
      quantity 
      unitPrice 
    }
    payment {
      id
      status
      transactionId
      amount
    }
  }
}
```

**Cache**: Primera vez consulta BD, siguientes < 10ms desde Redis

---

### 4️⃣ Mis Pedidos

```graphql
query {
  myOrders {
    id
    totalAmount
    status
    createdAt
  }
}
```

---

## Monitorear Eventos

### Ver logs del servidor

```bash
docker-compose logs -f app
```

Búsqueda de eventos:
```bash
docker-compose logs app | grep "order.created"
docker-compose logs app | grep "order.paid"
```

### Acceder a PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d orderdb
```

Queries útiles:
```sql
SELECT * FROM "order";
SELECT * FROM "order_item";
SELECT * FROM payment;
SELECT * FROM email_logs;
SELECT * FROM audit_logs;
```

### Acceder a Redis

```bash
docker-compose exec redis redis-cli

# Ver todas las claves
KEYS *

# Ver una orden cacheada
GET order:550e8400-e29b-41d4-a716-446655440001

# Ver un pago idempotente
GET payment:550e8400-e29b-41d4-a716-446655440001:f47ac10b-58cc-4372-a567-0e02b2c3d479
```

---

## Health Check

Verificar que todo está funcionando:

```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "UP",
  "database": "UP",
  "redis": "UP",
  "kafka": "UNKNOWN",
  "rabbitmq": "UNKNOWN",
  "timestamp": "2026-05-03T09:53:18.000Z"
}
```

---

## Detener Servicios

```bash
# Detener contenedores
docker-compose down

# Detener y eliminar volúmenes (reset total)
docker-compose down -v
```

---

## Arquitectura

```
┌─────────────────┐
│   GraphQL API   │ ← Cliente hace mutations/queries
│  localhost:3000 │
└────────┬────────┘
         │
    ┌────▼────────────────────────────────┐
    │         NestJS Application          │
    ├─────────────────────────────────────┤
    │ • OrderService      • PaymentService│
    │ • KafkaProducer     • Stripe (mock) │
    └────┬──────────────┬──────────────┬──┘
         │              │              │
    ┌────▼──┐      ┌────▼───┐    ┌────▼──────┐
    │PostgreSQL   Redis     Kafka   RabbitMQ
    │(BD)        (Cache)   (Events) (Email)
    │  │           │         │         │
    │  └──────┬────┘         │         │
    │       ├─── TypeORM     │         │
    │       │   Relations    │         │
    │     Query ├────────────┤         │
    │    Cache  │ AuditConsumer        │
    │     Hit   │ (registra eventos)   │
    │           │                      │
    │           └──────────────────────┤
    │                                  │
    │                         ┌────────▼──┐
    │                         │EmailConsumer
    │                         │(envía emails)
    │                         └─────────────┘
```

---

## Flujo Completo: Crear & Pagar Pedido

```
1. Cliente → GraphQL: createOrder(...)
   ↓
2. OrderService: validar, calcular, guardar en BD
   ↓
3. Redis: cachear Order (1h TTL)
   ↓
4. KafkaProducer: publicar order.created
   ↓
5. AuditConsumer: registrar en audit_logs (async)
   ↓
6. EmailConsumer: enviar email confirmación (async via RabbitMQ)
   ↓
7. Cliente recibe respuesta: Order JSON (< 500ms)

---

8. Cliente → GraphQL: processPayment(orderId, idempotencyKey)
   ↓
9. PaymentService: buscar en Redis
   ├─ HIT: retornar resultado previo (< 10ms) ✅
   └─ MISS: procesar pago
     ↓
10. Stripe API: createCharge (mocked, 500ms)
    ↓
11. Redis: guardar Payment + Order.status=PAID (24h TTL)
    ↓
12. KafkaProducer: publicar order.paid
    ↓
13. AuditConsumer: registrar evento
    ↓
14. Cliente recibe: PaymentResult JSON (< 2000ms, first time)
```

---

## Código Importante

### Order Service
- 📄 Ubicación: `src/services/order.service.ts`
- 📝 Tests: `src/services/order.service.spec.ts`
- ⚡ Patrón: Cache-Aside + Kafka Events

### Payment Service
- 📄 Ubicación: `src/services/payment.service.ts`
- 📝 Tests: `src/services/payment.service.spec.ts`
- 🔐 Patrón: Idempotencia con Redis (Exactly Once)

### Consumers
- 📄 AuditConsumer: `src/services/consumers/audit.consumer.ts`
- 📄 EmailConsumer: `src/services/consumers/email.consumer.ts`

---

## Troubleshooting

### Error: "PostgreSQL no está listo"
```bash
# Esperar un poco más
docker-compose exec postgres pg_isready -U postgres

# Ver logs
docker-compose logs postgres
```

### Error: "Port 3000 already in use"
```bash
# Cambiar en .env
PORT=3001

# O matar el proceso
lsof -i :3000 | tail -1 | awk '{print $2}' | xargs kill -9
```

### Error: "Redis connection refused"
```bash
# Reiniciar Redis
docker-compose restart redis

# Ver si está en funcionamiento
docker-compose exec redis redis-cli ping
```

### Tests fallan
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm test
```

---

## Próximos Pasos

1. ✅ **Fase 1**: Setup completado
2. ✅ **Fase 2**: Code Generation completado
3. 🟡 **Fase 3**: Testing (agregar E2E tests)
4. ❌ **Fase 4**: Messaging (mejorar Kafka/RabbitMQ)
5. ❌ **Fase 5**: Polish (migraciones, auth real)

Ver `IMPLEMENTATION.md` para más detalles.

---

## Recursos

- 📚 Documentación: `SPEC.md`
- 🔍 Estado: `IMPLEMENTATION.md`
- 🛣️ Roadmap: `HOJA-DE-RUTA.md`
- 📖 README: `README.md`

---

¡Listo! 🎉 Tienes un sistema de pedidos funcional con:
- ✅ GraphQL API
- ✅ TypeORM + PostgreSQL
- ✅ Redis Cache + Idempotencia
- ✅ Kafka Events
- ✅ RabbitMQ Tasks
- ✅ Unit Tests
- ✅ Docker Orchestration
