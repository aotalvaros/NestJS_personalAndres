# 📏 Rules - Reglas de Código y Negocio

Reglas que Claude debe seguir en todo el proyecto.

---

## 🎯 Reglas de Negocio

### Rule: Payment Idempotency
**Requisito**: Nunca duplicar cargos, aunque el cliente reintente

**Implementación**:
1. Cliente genera `idempotencyKey` (UUID)
2. Sistema busca en Redis: `payment:{orderId}:{idempotencyKey}`
3. Si existe: retornar resultado previo (< 10ms)
4. Si no: procesar pago y guardar en Redis (TTL 24h)
5. Garantía: Exactly Once (uno y solo uno)

**Validación**:
- [ ] Test case: reintentar con mismo idempotencyKey (cache hit)
- [ ] Test case: cambiar idempotencyKey (nuevo intento)
- [ ] Test case: expirar TTL en Redis (reintentar después)
- [ ] No debe haber duplicaciones en DB

---

### Rule: Order Status Transitions
**Requisito**: Estados de orden deben transicionar en orden específico

**Máquina de estados**:
```
PENDING
  ├─ → PAID (pago procesado)
  └─ → CANCELLED (cancelado)

PAID
  ├─ → SHIPPED (envío iniciado)
  └─ → CANCELLED (cancelado)

SHIPPED
  └─ → DELIVERED (entregado al cliente)

DELIVERED
  └─ (final state, no transitions)

CANCELLED
  └─ (final state, no transitions)
```

**Validación**: El sistema debe rechazar transiciones inválidas
```typescript
// ✅ VÁLIDO
order.status = PENDING
order.status = PAID

// ❌ INVÁLIDO
order.status = PENDING
order.status = DELIVERED  // Falta PAID y SHIPPED

// ❌ INVÁLIDO
order.status = DELIVERED
order.status = PAID  // No puede retroceder
```

---

### Rule: Cache TTLs
**Requisito**: Diferentes tipos de datos tienen diferentes TTLs

```
Payment Results (idempotency): 24 horas (86400s)
├─ Razón: Legal requirement para conciliación

Orders: 1 hora (3600s)
├─ Razón: Cambios frecuentes en status

Product Catalogs: 1 día (86400s)
├─ Razón: Datos menos volátiles

User Sessions: 15 minutos (900s)
├─ Razón: Security (JWT similar)

Hot Data (trending): 5 minutos (300s)
├─ Razón: Necesita estar actualizado
```

**Validación**:
- [ ] Especificar TTL en cada cacheManager.set()
- [ ] Documentar por qué ese TTL
- [ ] Revisar periódicamente si TTLs son apropiados

---

### Rule: Error Classification
**Requisito**: Errores deben tener clasificación clara

```
Validation Errors (400 Bad Request):
├─ Input inválido (RF-1.2: validar items no vacío)
├─ Campo faltante (customerId requerido)
└─ Formato incorrecto (UUID inválido)

Not Found (404):
├─ Order no existe
├─ Payment no existe
└─ Customer no existe

Conflict (409):
├─ Order ya pagado (no puede pagar de nuevo)
├─ Payment procesándose (race condition)
└─ Transición de estado inválida

Internal Error (500):
├─ Fallo en BD
├─ Fallo en Kafka
├─ Fallo en API externa (Stripe, AWS)
└─ Error no esperado

Rate Limit (429):
├─ Usuario hizo muchos requests
└─ Throttle activado
```

**Validación**:
- [ ] Cada error lanzado tiene tipo específico
- [ ] Cliente recibe código HTTP correcto
- [ ] Error message es útil para debugging

---

## 🏗️ Reglas de Arquitectura

### Rule: Layered Architecture
**Requisito**: Código debe estar en capas claras

```
┌─────────────────────────────────────────┐
│  Presentación (GraphQL Resolvers)       │
│  - Autorización
│  - Validación de inputs
│  - Transformación a types GraphQL
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Aplicación (Services)                  │
│  - Lógica de negocio
│  - Orquestación de dependencias
│  - Transacciones
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Dominio (Repositories)                 │
│  - Acceso a datos
│  - Queries complejas
│  - Migraciones
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│  Persistencia (Entidades TypeORM)       │
│  - Mapeo de datos
│  - Relaciones
│  - Constraints
└─────────────────────────────────────────┘
```

**Validación**:
- [ ] Resolvers NO acceden directamente a Repository
- [ ] Services orquestan la lógica
- [ ] Repositories manejan SQL
- [ ] Entidades son mapped by TypeORM

---

### Rule: Dependency Injection
**Requisito**: Usar NestJS Dependency Injection, no `new`

```typescript
// ✅ CORRECTO
@Injectable()
export class OrderService {
  constructor(private orderRepository: OrderRepository) {}
}

// ❌ INCORRECTO
export class OrderService {
  private orderRepository = new OrderRepository()  // ❌ Manual instantiation
}

// ❌ INCORRECTO
export class OrderService {
  constructor(private orderRepository: OrderRepository) {
    orderRepository.getData()  // ❌ No inyectado, circular dependency
  }
}
```

**Validación**:
- [ ] Todos los servicios son @Injectable()
- [ ] Dependencias vienen en constructor
- [ ] No hay `new` keywords para servicios
- [ ] Módulos registran providers correctamente

---

### Rule: Error Handling at Boundaries
**Requisito**: Validar inputs en límites del sistema, no internamente

```
Límites:
├─ Resolver GraphQL (entrada de usuario)
├─ HTTP endpoints (entrada de usuario)
├─ Kafka consumers (entrada de eventos)
└─ RabbitMQ consumers (entrada de tareas)

❌ MAL:
Service A llama Service B
  → Service B valida inputs

✅ BIEN:
Resolver valida inputs
  → Service A (asume inputs válidos)
  → Service B (asume inputs válidos)
```

**Validación**:
- [ ] Validación en Resolver/Controller/Consumer
- [ ] Servicios asumen inputs válidos
- [ ] No validar dos veces

---

## 🧪 Reglas de Testing

### Rule: Test Pyramid
**Requisito**: Distribución correcta de tests

```
          E2E (5%)        ← Flujos completos desde GraphQL
         / \
        /   \
     Int (15%)            ← Servicios + BD real
    /       \
   /         \
Unit (80%)                ← Funciones aisladas con mocks
```

**Números esperados**:
- Unit tests: 60-80
- Integration tests: 15-20
- E2E tests: 5-10
- Total: 80-110 tests

**Validación**:
- [ ] Unit > Integration > E2E (en cantidad)
- [ ] Unit tests < 100ms cada uno
- [ ] Integration tests < 1s cada uno
- [ ] E2E tests < 5s cada uno

---

### Rule: Test Isolation
**Requisito**: Tests no deben depender unos de otros

```typescript
// ✅ CORRECTO
describe('OrderService', () => {
  let service: OrderService
  let mockRepository: jest.Mocked<OrderRepository>
  
  beforeEach(() => {
    // Setup limpio para cada test
    mockRepository = { save: jest.fn() }
    service = new OrderService(mockRepository)
  })
  
  it('should create order', () => {
    // Test independiente
  })
  
  it('should cache order', () => {
    // Test independiente
  })
})

// ❌ INCORRECTO
describe('OrderService', () => {
  let service: OrderService
  let orders: Order[] = []
  
  it('should create order', () => {
    const order = service.createOrder(...)
    orders.push(order)  // Estado compartido ❌
  })
  
  it('should find created order', () => {
    const found = service.getOrder(orders[0].id)  // Depende del test anterior ❌
  })
})
```

---

### Rule: Mocking External Services
**Requisito**: NUNCA llamar APIs externas en tests

```typescript
// ✅ CORRECTO
jest.mock('@stripe/stripe-js')
const stripeMock = require('@stripe/stripe-js')

describe('PaymentService', () => {
  beforeEach(() => {
    stripeMock.charges.create = jest.fn().mockResolvedValue({
      id: 'ch_test_123'
    })
  })
  
  it('should process payment', async () => {
    const result = await service.processPayment(...)
    expect(stripeMock.charges.create).toHaveBeenCalled()
  })
})

// ❌ INCORRECTO
describe('PaymentService', () => {
  it('should process payment', async () => {
    const result = await service.processPayment(...)
    // Este test llama VERDADERO Stripe ❌
  })
})
```

---

### Rule: Test Coverage Minimum
**Requisito**: Mínimo 80% coverage en áreas críticas

```
Critical (90%+):
├─ Services (lógica de negocio)
├─ Repositories (queries)
└─ Entidades (mapeos)

Important (80%+):
├─ Resolvers (excepto logging)
├─ Guards (autenticación)
└─ DTOs (validación)

Nice-to-have (70%+):
├─ Mocks (testing utilities)
├─ Decorators (infraestructura)
└─ Pipes (transformación)
```

**Validación**: `npm run test -- --coverage`
- [ ] Services: 85%+
- [ ] Repositories: 90%+
- [ ] Overall: 80%+

---

## 📝 Reglas de Documentación

### Rule: Docstring Standards
**Requisito**: Métodos públicos tienen docstring

```typescript
// ✅ CORRECTO
/**
 * Crear un pedido nuevo.
 * 
 * Flujo:
 * 1. Valida items no vacío
 * 2. Calcula totalAmount
 * 3. Guarda en BD
 * 4. Cachea en Redis
 * 5. Publica evento Kafka
 * 
 * @param input CreateOrderInput (customerId + items)
 * @returns Pedido creado con status PENDING
 * @throws BadRequestException si items vacío
 */
async createOrder(input: CreateOrderInput): Promise<Order> {
  // ...
}

// ❌ INCORRECTO
// Crear order
async createOrder(input: CreateOrderInput): Promise<Order> {
  // ...
}

// ❌ INCORRECTO
async createOrder(input: CreateOrderInput): Promise<Order> {
  // Sin docstring
}
```

---

### Rule: Spec Synchronization
**Requisito**: Código debe coincidir con SPEC.md

**Antes de mergear PR**:
- [ ] Leer SPEC.md
- [ ] Verificar que código implementa requisitos
- [ ] Que no haya implementaciones no especificadas
- [ ] Que no falten requisitos

**Si cambios menores en SPEC**:
- Hook on-spec-change identifica
- Code updated automáticamente

**Si cambios mayores en SPEC**:
- Requiere revisión manual
- Generar PR separado

---

## 🚀 Reglas de Deployment

### Rule: Database Migrations
**Requisito**: Cambios en BD deben tener migración

```
Flujo:
1. Modificar entity (ej: Order.ts)
2. Generar migration: npm run typeorm:migration:generate
3. Revisar migration generada
4. Ejecutar: npm run typeorm:migration:run
5. Commit migration + entity
```

**Validación**:
- [ ] No hay cambios no-migrados en entidades
- [ ] Migrations son reversibles (undo/down)
- [ ] Migrations no rompen datos existentes
- [ ] Índices creados donde necesario

---

### Rule: Environment Variables
**Requisito**: Configuración via .env, no en código

```
❌ INCORRECTO:
const stripeKey = 'sk_live_abc123'  // Hardcoded ❌

✅ CORRECTO:
const stripeKey = process.env.STRIPE_API_KEY
// .env: STRIPE_API_KEY=sk_live_abc123
```

**Validación**:
- [ ] .env.example tiene todas las variables
- [ ] No hay secrets en código
- [ ] Diferentes .env para dev/test/prod
- [ ] GitHub no tiene .env tracked

---

### Rule: Graceful Shutdown
**Requisito**: Aplicación debe apagar gracefully

```typescript
// En main.ts
const app = await NestFactory.create(AppModule)
await app.listen(3000)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  // 1. Stop accepting new requests
  // 2. Close DB connections
  // 3. Close Kafka producer
  // 4. Close RabbitMQ connection
  // 5. Exit
  await app.close()
  process.exit(0)
})
```

---

## 🔍 Reglas de Code Review

### Rule: Review Checklist
Antes de mergear PR, reviewer debe validar:

```
Spec Compliance:
  ☐ Implementa los requisitos del SPEC.md
  ☐ No hay scope creep
  ☐ No hay deuda técnica introducida

Code Quality:
  ☐ Linter pasa (eslint)
  ☐ Formatter aplicado (prettier)
  ☐ Type checking OK (TypeScript)
  ☐ No hay dead code

Testing:
  ☐ Tests unitarios (80%+ coverage)
  ☐ Tests de integración
  ☐ Tests E2E para flujos críticos
  ☐ Todos los tests pasan

Documentation:
  ☐ Docstrings presentes
  ☐ SPEC.md actualizado si cambia behavior
  ☐ CHANGELOG.md actualizado
  ☐ README actualizado si necesario

Performance:
  ☐ Sin queries N+1
  ☐ Sin loops innecesarios
  ☐ Caching aprovechado
  ☐ Transacciones correctas

Security:
  ☐ Sin SQL injection
  ☐ Sin XSS
  ☐ Autorización validada
  ☐ Inputs sanitizados
```

---

## ⚠️ Anti-Patterns

Cosas que **NUNCA** debemos hacer:

```typescript
// ❌ NUNCA: console.log
console.log('Creating order...')

✅ USAR: Logger
this.logger.log('Creating order...')

---

// ❌ NUNCA: any type
function process(data: any) { }

✅ USAR: Tipos específicos
function process(data: Order) { }

---

// ❌ NUNCA: try-catch silencioso
try {
  await this.orderRepository.save(order)
} catch (e) {
  // Silently ignore ❌
}

✅ USAR: Handle or log
try {
  await this.orderRepository.save(order)
} catch (e) {
  this.logger.error('Failed to save order:', e)
  throw e
}

---

// ❌ NUNCA: Magic numbers
if (order.totalAmount > 1000) { }

✅ USAR: Constantes
const MAX_ORDER_AMOUNT = 1000
if (order.totalAmount > MAX_ORDER_AMOUNT) { }

---

// ❌ NUNCA: API calls en tests
it('should process payment', async () => {
  const result = await stripeApi.createCharge(...) // ❌ Real API
})

✅ USAR: Mocks
jest.mock('stripe')
it('should process payment', async () => {
  const result = await service.processPayment(...) // ✅ Mocked
})
```

---

## 📋 Rules Checklist

Antes de cada commit, validar:

- [ ] Código cumple SPEC.md
- [ ] Tests pasan (unit, integration, e2e)
- [ ] Coverage 80%+
- [ ] Linter pasando
- [ ] Formatter aplicado
- [ ] Docstrings presentes en métodos públicos
- [ ] No hay console.log
- [ ] No hay hardcoded values
- [ ] Errores clasificados correctamente
- [ ] Mocks en lugar de llamadas reales
- [ ] CHANGELOG.md actualizado

---

**Próximo**: Ejemplo práctico en `02-examples/`
