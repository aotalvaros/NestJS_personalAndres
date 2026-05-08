# 📋 SPEC.md - Especificación: Sistema de Gestión de Pedidos

**Estado**: DRAFT → READY FOR DEVELOPMENT
**Última actualización**: 2026-04-30

---

## 📌 Descripción General

**Sistema**: E-commerce Order Management con múltiples integraciones
**Objetivo**: Demostrar Spec-Driven Development integrando:
- TypeORM (Data Layers)
- Redis (Caching + Idempotencia)
- Kafka (Event Sourcing)
- RabbitMQ (Task Queue)
- GraphQL (API)
- Jest (Testing)
- Docker (Orchestration)

**Usuarios**: Desarrolladores juniores aprendiendo NestJS

---

## 🎯 Requisitos Funcionales

### RF-1: Crear Pedido

**Descripción**: Cliente crea pedido con múltiples items

**Entrada** (GraphQL Mutation):
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    customerId
    totalAmount
    status
    items { productId quantity unitPrice }
  }
}
```

**Validaciones**:
- ✅ customerId no vacío (UUID válido)
- ✅ items no vacío (mín 1 item)
- ✅ quantity > 0
- ✅ unitPrice > 0
- ✅ totalAmount = SUM(quantity * unitPrice)

**Salida**: Order creado en status PENDING

**Eventos**: Publica `order.created` en Kafka

**Cache**: Guarda en Redis (TTL 1 hora)

---

### RF-2: Procesar Pago (IDEMPOTENTE)

**Descripción**: Cliente paga pedido con garantía de no-duplicación

**Entrada** (GraphQL Mutation):
```graphql
mutation ProcessPayment($input: ProcessPaymentInput!) {
  processPayment(input: $input) {
    paymentId
    status
    transactionId
    amount
  }
}

input ProcessPaymentInput {
  orderId: ID!
  idempotencyKey: String!  # UUID generado por cliente
  paymentMethodId: String!
}
```

**Flujo**:
1. Buscar en Redis: `payment:{orderId}:{idempotencyKey}`
2. Si existe: Retornar resultado previo (CACHE HIT)
3. Si no existe:
   - Validar Order existe y status = PENDING
   - Crear Payment con status PROCESSING
   - Llamar Stripe API (mocked)
   - Actualizar Payment.status = COMPLETED
   - Guardar en Redis (TTL 24h)
   - Publicar `order.paid` en Kafka

**Garantía**: Exactly Once (nunca duplicar cargo)

---

### RF-3: RabbitMQ - Enviar Email

**Descripción**: Consumidor que envía email de confirmación

**Escucha**: Queue `email-queue` (routing key: `order.*.email`)

**Flujo**:
1. Recibe mensaje de RabbitMQ
2. Obtiene email del cliente (API mocked)
3. Valida email no esté en blacklist
4. Envía email (mock)
5. Registra en `email_logs` table
6. ACK mensaje

**Reintentos**:
- Si falla: Reintenta hasta 3 veces
- Si sigue fallando: Envía a Dead Letter Queue (DLQ)

---

### RF-4: Kafka Consumer - Auditoría

**Descripción**: Consumidor que registra todos los eventos

**Escucha**: Topic `events` (consumer group: `audit-service`)

**Eventos capturados**:
- order.created
- order.paid
- order.shipped

**Flujo**:
1. Recibe evento de Kafka
2. Guarda en `audit_logs` table
3. Guarda offset para permitir replay

---

## 🎯 Requisitos No-Funcionales

### RNF-1: Performance
- CreateOrder: < 500ms (excluye async Kafka)
- ProcessPayment (first): < 2000ms (incluye Stripe)
- ProcessPayment (cache hit): < 10ms
- Email processing: < 5 segundos

### RNF-2: Database
- PostgreSQL 15
- TypeORM migrations
- Constraints en BD (NOT NULL, CHECK)
- Índices en queries frecuentes

### RNF-3: Caching
- Redis para caché y idempotencia
- Diferentes TTLs por tipo de dato
- Invalidar caché en UPDATE

### RNF-4: Mensajería
- Kafka para eventos (inmutables)
- RabbitMQ para tareas (con reintentos)
- Healthchecks en ambos
- Dead Letter Queues para fallos

### RNF-5: Testing
- Unit: 80% coverage
- Integration: 15% tests
- E2E: 5% tests
- Todos los tests < 30 segundos total

---

## 📊 Entidades

### Order
```
id: UUID PK
customerId: UUID FK
totalAmount: DECIMAL (CHECK > 0)
status: ENUM (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
createdAt: TIMESTAMP
updatedAt: TIMESTAMP

Relations:
- 1:N Order → OrderItem (cascade delete)
- 1:1 Order ↔ Payment
```

### OrderItem
```
id: UUID PK
orderId: UUID FK
productId: UUID
quantity: INT (CHECK > 0)
unitPrice: DECIMAL (CHECK > 0)

Relations:
- N:1 OrderItem → Order
```

### Payment
```
id: UUID PK
orderId: UUID FK UNIQUE
amount: DECIMAL (CHECK > 0)
status: ENUM (PENDING, PROCESSING, COMPLETED, FAILED)
transactionId: VARCHAR (external ID from Stripe)
paymentMethodId: VARCHAR
createdAt: TIMESTAMP
updatedAt: TIMESTAMP

Relations:
- 1:1 Payment ↔ Order
```

### email_logs
```
id: UUID PK
orderId: UUID FK
email: VARCHAR
status: ENUM (SUCCESS, FAILED, SKIPPED)
error_message: TEXT (nullable)
createdAt: TIMESTAMP
```

### audit_logs
```
id: UUID PK
event_type: VARCHAR (order.created, order.paid, etc)
entity_type: VARCHAR (Order, Payment)
entity_id: UUID
data: JSONB
timestamp: TIMESTAMP
createdAt: TIMESTAMP
```

---

## 🧪 Test Cases

### TC-1: CreateOrder - Exitoso
```
Given: Cliente autenticado, inputs válidos
When: Envía mutation createOrder
Then: 
  ✅ Order creado en status PENDING
  ✅ totalAmount calculado correctamente (200 = 2*50 + 1*100)
  ✅ Items guardados en BD
  ✅ Evento order.created publicado en Kafka
  ✅ Order cacheado en Redis
  ✅ Respuesta < 500ms
```

### TC-2: CreateOrder - Items Vacío
```
Given: Cliente autenticado
When: Envía mutation con items vacío
Then:
  ✅ Lanza BadRequestException
  ✅ BD no afectada
  ✅ Respuesta 400
```

### TC-3: ProcessPayment - Exitoso
```
Given: Order existe en status PENDING, idempotencyKey único
When: Envía mutation processPayment
Then:
  ✅ Stripe API llamada (mocked)
  ✅ Payment creado en status COMPLETED
  ✅ transactionId guardado
  ✅ Resultado guardado en Redis (TTL 24h)
  ✅ Evento order.paid publicado en Kafka
  ✅ Respuesta < 2000ms
```

### TC-4: ProcessPayment - CACHE HIT (Reintentar)
```
Given: Pagó con idempotencyKey X hace 1 minuto
When: Reenviá mutation con MISMO idempotencyKey
Then:
  ✅ Redis cache hit
  ✅ Retorna resultado previo (< 10ms)
  ✅ Stripe API NO es llamada (no duplicar)
  ✅ transactionId es el original
  ✅ Respuesta < 10ms
```

### TC-5: ProcessPayment - Stripe Falla
```
Given: Order existe, Stripe simulará error
When: Envía mutation processPayment
Then:
  ✅ Payment creado con status FAILED
  ✅ Resultado NO guardado en Redis (permitir reintentos)
  ✅ Order sigue en status PENDING
  ✅ Respuesta es error
```

### TC-6: Email Enviado
```
Given: Mensaje llega a email-queue
When: EmailConsumer procesa
Then:
  ✅ Email obtenido del cliente
  ✅ Email validado (no en blacklist)
  ✅ Email enviado (mocked)
  ✅ Registrado en email_logs con status SUCCESS
  ✅ Mensaje ACK
```

### TC-7: Email Falla - Reintentos
```
Given: API de email falla (simular error 5xx)
When: EmailConsumer intenta 3 veces
Then:
  ✅ Reintenta 3 veces
  ✅ Si sigue fallando: mensaje a DLQ
  ✅ Registrado en email_logs con status FAILED
  ✅ Error guardado en email_logs.error_message
```

### TC-8: Auditoría - Evento Guardado
```
Given: Evento order.created llega a Kafka
When: AuditConsumer procesa
Then:
  ✅ Guardado en audit_logs
  ✅ event_type = "order.created"
  ✅ data JSONB contiene datos evento
  ✅ Offset actualizado (para replay)
```

---

## 🔄 Flujos Principales

### Flujo 1: Crear Pedido
```
Cliente GraphQL
  ↓ (mutation createOrder)
OrderResolver
  ├─ AuthGuard (validar JWT)
  └─ Validar input (class-validator)
  ↓
OrderService.createOrder()
  ├─ Validar items no vacío
  ├─ Calcular totalAmount
  ├─ Guardar en BD (TypeORM + transaction)
  ├─ Cachear en Redis (1h)
  └─ Publicar order.created en Kafka
  ↓
Kafka (async)
  ├─ EmailConsumer: enviar confirmación
  ├─ NotificationConsumer: notificar
  └─ AuditConsumer: registrar evento
  ↓
Respuesta al cliente (Order JSON)
```

### Flujo 2: Procesar Pago (Idempotente)
```
Cliente GraphQL
  ↓ (mutation processPayment + idempotencyKey)
PaymentResolver
  ├─ AuthGuard (validar JWT)
  └─ Validar input (UUID, etc)
  ↓
PaymentService.processPayment()
  ├─ Buscar en Redis: payment:{orderId}:{idempotencyKey}
  │  ├─ SI: Retornar resultado previo (< 10ms) ✅
  │  └─ NO: Continuar
  ├─ Validar Order existe + status PENDING
  ├─ Crear Payment (status PROCESSING)
  ├─ Llamar Stripe API (mocked)
  ├─ Actualizar Payment (status COMPLETED)
  ├─ Guardar en Redis (TTL 24h)
  ├─ Actualizar Order (status PAID)
  └─ Publicar order.paid en Kafka
  ↓
Garantía: Exactly Once (no duplicar cargos)
  ↓
Respuesta al cliente (Payment JSON)
```

---

## 📱 APIs GraphQL

### Queries
```graphql
# Obtener un pedido
query GetOrder($id: ID!) {
  order(id: $id) {
    id, customerId, totalAmount, status
    items { productId, quantity, unitPrice }
    payment { status, transactionId }
  }
}

# Obtener pedidos del cliente autenticado
query {
  myOrders {
    id, totalAmount, status, createdAt
  }
}
```

### Mutations
```graphql
# Crear pedido
mutation {
  createOrder(input: {
    customerId: "uuid",
    items: [
      { productId: "p1", quantity: 2, unitPrice: 50 }
    ]
  }) {
    id, status, totalAmount
  }
}

# Procesar pago
mutation {
  processPayment(input: {
    orderId: "uuid",
    idempotencyKey: "uuid",
    paymentMethodId: "stripe_pm_123"
  }) {
    paymentId, status, transactionId, amount
  }
}
```

---

## 🐳 Docker Services

```
postgres:5432     - Base de datos
redis:6379        - Cache + Idempotencia
kafka:9092        - Event broker
rabbitmq:5672     - Task queue
app:3000          - NestJS API
```

---

## 📁 Estructura de Código

```
02-examples/
├── SPEC.md (este archivo)
├── IMPLEMENTATION.md (estado de desarrollo)
├── src/
│   ├── entities/
│   │   ├── order.entity.ts
│   │   ├── order-item.entity.ts
│   │   └── payment.entity.ts
│   ├── repositories/
│   │   ├── order.repository.ts
│   │   └── payment.repository.ts
│   ├── services/
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   └── __tests__/
│   ├── graphql/
│   │   ├── types/
│   │   ├── inputs/
│   │   ├── resolvers/
│   │   └── guards/
│   ├── producers/
│   │   └── kafka.producer.ts
│   ├── consumers/
│   │   ├── email.consumer.ts
│   │   └── audit.consumer.ts
│   ├── mocks/
│   │   ├── stripe.mock.ts
│   │   └── aws-secrets.mock.ts
│   └── main.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## ✅ Definition of Done

Feature se considera COMPLETA cuando:

- [ ] Especificación en SPEC.md (este archivo)
- [ ] Código implementado (services, resolvers)
- [ ] Tests unitarios (80%+ coverage)
- [ ] Tests de integración (con BD real)
- [ ] Tests E2E (flujos completos)
- [ ] Documentación actualizada
- [ ] Linter pasando (eslint, prettier)
- [ ] Build exitoso (npm run build)
- [ ] docker-compose up -d sin errores
- [ ] Health checks todos pasan
- [ ] CHANGELOG.md actualizado

---

## 🚀 Próximos Pasos

1. ✅ SPEC.md completada (este archivo)
2. → Usar `/spec-validator` para validar
3. → Usar `/spec-to-code` para generar código
4. → Usar `/test-coverage` para validar tests
5. → Usar `/docker-health` para levantar servicios
6. → Hacer PR y mergear

---

## 📌 Estado de Implementación

| Componente | Status | PR | Reviewer |
|-----------|--------|----|---------| 
| Spec.md | ✅ DONE | - | - |
| Entities | 🔄 IN_PROGRESS | #1 | @reviewer |
| Services | 🔄 IN_PROGRESS | #1 | @reviewer |
| Resolvers | ⏳ TODO | - | - |
| Tests | ⏳ TODO | - | - |
| Docker | ⏳ TODO | - | - |

---

**Creado por**: Spec-Driven Development con Claude
**Versión**: 1.0
**Última actualización**: 2026-04-30
