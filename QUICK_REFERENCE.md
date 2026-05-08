# ⚡ QUICK_REFERENCE.md - Tarjeta de Referencia Rápida

**Proyecto**: Curso NestJS - Spec-Driven Development | **v1.0** | 3 mayo 2026

---

## 🎯 EL MANTRA

```
📖 LEE SPEC → 🧪 ESCRIBE TEST → 💻 CODIFICA → ✅ VALIDA → 📤 COMMIT
```

---

## 🚀 Comandos MÁXIMO 10

```bash
npm run start:dev              # Desarrollo (watch mode)
npm run test                   # Tests unitarios
npm run test:integration       # Tests integración (con BD real)
npm run test:cov               # Coverage report (objetivo: 80%)
npm run lint && npm run format # Linter + Prettier
npm run build                  # Compilar TypeScript
docker-compose up -d           # Levantar servicios (Postgres, Redis, Kafka, RabbitMQ)
docker-compose down            # Bajar servicios
npm run typeorm:migration:run  # Aplicar migraciones BD
npm run typeorm:migration:generate -- --name NombreTabla  # Crear migración
```

---

## 📍 UBICACIONES CRÍTICAS

| Qué | Dónde |
|-----|-------|
| Especificación | `02-examples/SPEC.md` ← **LEE PRIMERO** |
| Reglas de código | Aquí mismo: `RULES.md` |
| Troubleshooting | `SETUP.md` |
| Agentes IA detalles | `AGENTS.md` |
| Lineamientos completos | `CLAUDE.md` |
| Código ejemplo | `02-examples/src/` |
| Tests ejemplo | `02-examples/tests/` |

---

## 🔴 NEVER (PROHIBIDO ABSOLUTO)

```
❌ NO leer SPEC.md antes de codificar
❌ NO usar console.log (usar Logger)
❌ NO modificar entities manualmente (usar migrations)
❌ NO llamar APIs externas en unit tests (mockear)
❌ NO saltarse tests (siempre verde antes de commit)
❌ NO commitear sin npm run build exitoso
❌ NO cambiar Kafka events después de producción
❌ NO almacenar secrets en código
❌ NO usar any type en TypeScript
❌ NO tests sin assert/expectation
```

---

## ✅ ALWAYS (OBLIGATORIO)

```
✅ Especificación PRIMERO
✅ Test ANTES que código (TDD)
✅ Validación en Controllers/Resolvers
✅ Logger para eventos importantes
✅ Transacciones para multi-entidad
✅ Cache invalidation tras UPDATE
✅ Idempotencia en pagos/transfers
✅ Excepciones específicas (no Error generic)
✅ JSDoc en métodos públicos
✅ Coverage >= 80%
```

---

## 🧪 TEST RECIPE (TDD)

```typescript
// 1️⃣ TEST FAILING (RED)
describe('OrderService', () => {
  it('should create order with valid input', async () => {
    const result = await service.createOrder({
      customerId: 'uuid',
      items: [{ productId: '123', quantity: 1, unitPrice: 100 }]
    })
    expect(result.status).toBe('PENDING')
    expect(result.totalAmount).toBe(100)
  })
})
// npm run test → FAIL (expected, service no existe aún)

// 2️⃣ CODE (GREEN) - Implementar mínimo
@Injectable()
export class OrderService {
  createOrder(input: CreateOrderInput): Promise<Order> {
    return { id: uuid(), status: 'PENDING', totalAmount: 100 }
  }
}
// npm run test → PASS ✅

// 3️⃣ REFACTOR - Mejorar sin romper test
// npm run test → Aún PASS ✅
```

---

## 🏗️ ARCHITECTURE LAYERS

```
Controller/Resolver (GraphQL/REST)
    ↓ (validación de input)
Service (lógica negocio + caching + eventos)
    ↓
Repository (queries + transacciones)
    ↓
TypeORM Entities (BD)

Consumers (Kafka/RabbitMQ) → Service
Logger (en todo lado)
```

---

## 🔐 IDEMPOTENCIA PATTERN

```typescript
// ¡CRÍTICO para pagos!

// 1. Buscar en caché
const cached = await redis.get(`payment:${orderId}:${idempotencyKey}`)
if (cached) return cached  // Cache HIT

// 2. Procesar una sola vez
const payment = await stripe.charge(amount)  // ← UNA SOLA VEZ

// 3. Cachear resultado (24 horas)
await redis.set(`payment:${orderId}:${idempotencyKey}`, payment, 'EX', 86400)

return payment
```

---

## 📊 TEST RATIO (obligatorio)

```
80% Unit tests    (< 100ms c/u, sin I/O)
15% Integration   (< 5s c/u, con BD real)
5%  E2E           (< 10s c/u, flujo completo)

Total: npm run test:cov ≥ 80%
```

---

## 🎯 WORKFLOW TÍPICO (10 minutos)

```bash
# 1. Leer req
vim 02-examples/SPEC.md  # Buscar "RF-2: ProcessPayment"

# 2. Crear rama
git checkout -b feat/process-payment

# 3. Escribir test fallando
cat > src/services/order.service.spec.ts <<'EOF'
it('should process payment idempotently', async () => {
  const payment = await service.processPayment({
    orderId, idempotencyKey, amount
  })
  expect(payment.status).toBe('COMPLETED')
})
EOF
npm run test  # FAIL

# 4. Implementar
vim src/services/order.service.ts
# ... código ...
npm run test  # PASS

# 5. Format + Lint
npm run format && npm run lint

# 6. Integration test
npm run test:integration

# 7. Commit
git add .
git commit -m "feat: RF-2 - Process payment idempotently"
git push
```

---

## 🚨 COMMON ERRORS IN 30 SECONDS

| Error | Fix |
|-------|-----|
| "Module not found" | `npm install` |
| "Port 5432 in use" | `docker-compose down && docker-compose up -d` |
| "Tests timeout" | `jest.setTimeout(10000)` |
| "Cannot find entity" | `npm run typeorm:migration:run` |
| "Redis undefined" | Check @Inject('CACHE_MANAGER') |
| "Prettier error" | `npm run format` |
| "console.log warning" | Use Logger de NestJS |

---

## 🔍 DEBUG CHECKLIST

```
1. ¿El test describe claramente QUÉ espera?
2. ¿El mock está setup en beforeAll, NO en el test?
3. ¿Las transacciones se hacen rollback en catch?
4. ¿Se invalida caché tras UPDATE?
5. ¿Hay validación en el resolver?
6. ¿Se publican eventos Kafka tras cambios?
7. ¿El logger registra la acción?
8. ¿Se usan excepciones específicas?
9. ¿Coverage >= 80%?
10. ¿npm run build compila sin errores?
```

---

## 📚 REFERENCE DOCS (leer si necesitas detalles)

| Tema | Archivo | Sección |
|------|---------|---------|
| Spec-Driven Dev | CLAUDE.md | "Objetivos del Proyecto" |
| Rules completas | RULES.md | "Rules CRÍTICAS" |
| Setup + Troubleshoot | SETUP.md | "Problemas Comunes" |
| Agentes workflow | AGENTS.md | "Flujo de Trabajo Típico" |
| Teoría Kafka | docs/Kafka...md | "¿Qué es Kafka?" |
| Teoría RabbitMQ | docs/RabbitMQ...md | "¿Qué es RabbitMQ?" |
| NestJS basics | docs/NestJS_Core.md | "Módulos y Providers" |

---

## 💡 TIPS (Shortcuts)

```bash
# Ver si tests pasan rápido (sin coverage)
npm run test -- --no-coverage

# Run solo UN test file
npm run test -- src/services/order.service.spec.ts

# Watch mode (re-run en cada cambio)
npm run test:watch

# Ver logs de Docker en tiempo real
docker-compose logs -f

# Conectar a BD para debug
docker-compose exec postgres psql -U postgres -d order_service

# Flush Redis cache (⚠️ SOLO EN DEV)
docker-compose exec redis redis-cli FLUSHALL

# Ver qué cambió desde último commit
git diff
```

---

## ⏱️ TIME ESTIMATES

| Tarea | Tiempo |
|-------|--------|
| Setup inicial | 5 min |
| Leer SPEC.md | 10-15 min |
| Implementar feature simple | 30-45 min |
| Tests + debugging | 30-60 min |
| Refactor + review | 15-30 min |
| Todo listo para commit | ~2 horas |

---

## 🎬 GET STARTED NOW

```bash
# 1. Goto project
cd d:\Cursos\Curso_nest\02-examples

# 2. Setup (first time only)
npm install && docker-compose up -d && npm run typeorm:migration:run

# 3. Verify it works
npm run test

# 4. Read the spec
cat SPEC.md | head -100

# 5. Start coding!
npm run start:dev
```

---

## ❓ WHEN IN DOUBT

1. **Read SPEC.md** (RF-X requirements)
2. **Check RULES.md** (what's allowed)
3. **Look at example** (src/services/order.service.ts)
4. **Run tests** (npm run test)
5. **Ask CLAUDE.md** (detailed explanations)

---

**Last updated**: 3 mayo 2026  
**For**: Agentes IA & Developers  
**Status**: Ready to Code ✅
