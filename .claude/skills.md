# 💡 Skills - Habilidades Específicas de Claude

Definición de skills (habilidades) que Claude puede ejecutar mediante el comando `/skill`.

---

## Skill: spec-to-code

**Descripción**: Convertir especificación en código funcional + tests

**Sintaxis**:
```
/spec-to-code [component]
```

**Parámetros**:
- `component`: OrderService, PaymentService, EmailConsumer, etc (opcional)
  - Si no se especifica: genera TODOS

**Qué hace**:
1. Lee `02-examples/SPEC.md`
2. Extrae requisitos del componente
3. Genera código TypeScript:
   - Estructura base
   - Métodos completos
   - Docstrings
   - Error handling
4. Genera tests unitarios en paralelo
5. Ejecuta `npm run build && npm run test`
6. Retorna: código compilado + tests verdes

**Ejemplo**:
```
Usuario: "/spec-to-code OrderService"

Claude:
✅ Leyendo SPEC.md...
✅ Extrayendo requisitos para OrderService...
✅ Generando src/services/order.service.ts
✅ Generando src/services/__tests__/order.service.spec.ts
✅ npm run build: SUCCESS
✅ npm run test -- order.service.spec.ts: 12 tests passed

Resultado: 2 archivos creados, tests verdes
```

---

## Skill: test-coverage

**Descripción**: Analizar y mejorar coverage de tests

**Sintaxis**:
```
/test-coverage [--improve] [--min-threshold=85]
```

**Parámetros**:
- `--improve`: Generar tests faltantes automáticamente
- `--min-threshold`: Umbral mínimo de coverage (default: 80)

**Qué hace**:
1. Ejecuta tests con coverage
2. Genera reporte por archivo
3. Identifica lineas no cubiertas
4. Si `--improve`: Genera tests para lineas no cubiertas
5. Ejecuta nuevamente para validar

**Ejemplo**:
```
Usuario: "/test-coverage --improve"

Claude:
✅ Ejecutando tests con coverage...

Archivos con baja cobertura:
  ❌ src/guards/auth.guard.ts        72% (necesita 8 líneas)
  ⚠️  src/mocks/stripe.service.ts    91% (necesita 1 línea)

✅ Generando tests faltantes...
✅ src/guards/__tests__/auth.guard.spec.ts: +8 tests
✅ npm run test: 72 passed

Nuevo coverage:
  ✅ src/guards/auth.guard.ts        92%
  ✅ src/mocks/stripe.service.ts     100%

Overall: 85% → 87% ✨
```

---

## Skill: docker-health

**Descripción**: Verificar salud de todos los servicios Docker

**Sintaxis**:
```
/docker-health [--fix] [--service=postgres]
```

**Parámetros**:
- `--fix`: Intenta fix automático de problemas
- `--service`: Verifica solo un servicio específico

**Qué hace**:
1. `docker-compose ps` (lista contenedores)
2. Para cada contenedor:
   - Ejecuta healthcheck
   - Verifica logs por errores
   - Testa conectividad
3. Genera reporte detallado
4. Si `--fix`: Intenta soluciones (restart, rebuild, etc)

**Ejemplo**:
```
Usuario: "/docker-health --fix"

Claude:
🔍 Verificando servicios Docker...

postgres:
  ✅ Contenedor: UP
  ✅ Healthcheck: PASS
  ✅ Conectividad: OK (app → postgres)
  
redis:
  ⚠️  Contenedor: UP
  ❌ Healthcheck: FAIL (timeout)
  
  Causa: Port 6379 already in use
  
  Solución: Matar proceso en 6379
  
  Ejecutando fix...
  ✅ Restarting redis...
  ✅ Healthcheck now: PASS

kafka:
  ✅ Contenedor: UP
  ✅ Healthcheck: PASS
  
rabbitmq:
  ✅ Contenedor: UP
  ✅ Healthcheck: PASS
  
app:
  ✅ Contenedor: UP
  ✅ Healthcheck: PASS (GET /health → 200)

Final Status: ✅ All services healthy
```

---

## Skill: spec-review

**Descripción**: Revisar especificación antes de implementar

**Sintaxis**:
```
/spec-review [--strict]
```

**Parámetros**:
- `--strict`: Validación más rigurosa

**Qué hace**:
1. Lee `02-examples/SPEC.md`
2. Verifica checklist:
   - Claridad de requisitos
   - Completitud de specs
   - Testabilidad
   - Implementabilidad
3. Busca ambigüedades
4. Sugiere mejoras
5. Da veredicto: APPROVED / NEEDS_REVIEW

**Ejemplo**:
```
Usuario: "/spec-review --strict"

Claude:
📋 Spec Review: CreateOrder Feature

✅ Aprobado:
  ✅ RF-1.1 a RF-1.5: Requisitos claros
  ✅ RNF-1.1 a RNF-1.3: Cuantificables
  ✅ Test cases: 3 casos cubiertos
  ✅ Entidades: Order, OrderItem, Payment (completas)
  ✅ Validaciones: Especificadas
  
⚠️  Revisar:
  ⚠️  RF-1.4 "Publica evento Kafka" - ¿Qué sucede si Kafka falla?
  → Sugiero: Especificar retry policy (3 intentos + DLQ)
  
  ⚠️  RNF-1.1 "< 500ms" - ¿Incluye Kafka publish?
  → Sugiero: Aclarar que es < 500ms ANTES de Kafka (async)
  
❌ Faltante:
  ❌ Qué sucede si totalAmount > 1,000,000
  → Sugiero: Agregar validación de límite máximo

Veredicto: ⚠️  NEEDS_REVIEW
Blocker: No (puedo empezar, pero después actualizar)

Recomendación: 
1. Aclarar qué sucede si Kafka falla
2. Especificar timeout exacto
→ Entonces: APPROVED
```

---

## Skill: lint-and-fix

**Descripción**: Ejecutar linter y formatter automáticamente

**Sintaxis**:
```
/lint-and-fix [--path=src] [--check-only]
```

**Parámetros**:
- `--path`: Directorio específico a formatear
- `--check-only`: Solo reporta, no modifica

**Qué hace**:
1. Ejecuta ESLint
2. Ejecuta Prettier
3. Ejecuta TypeScript compiler check
4. Reporta issues
5. Si no `--check-only`: Arregla automáticamente

**Ejemplo**:
```
Usuario: "/lint-and-fix"

Claude:
✅ Ejecutando ESLint...
  ⚠️  src/services/order.service.ts:45 - Unused variable 'temp'
  ⚠️  src/guards/auth.guard.ts:12 - console.log found

✅ Ejecutando Prettier...
  ⚠️  src/graphql/resolvers/order.resolver.ts - 3 lineas mal indentadas

✅ Ejecutando TypeScript check...
  ✅ All type checks pass

Arreglando issues...
  ✅ Removido variable unused
  ✅ Removido console.log (usar logger)
  ✅ Aplicado Prettier format

Resultado: 0 errors, 0 warnings ✨
```

---

## Skill: generate-e2e-test

**Descripción**: Generar test E2E para flujo completo

**Sintaxis**:
```
/generate-e2e-test [flujo]
```

**Parámetros**:
- `flujo`: create-order, process-payment, full-lifecycle

**Qué hace**:
1. Leer spec para entender flujo
2. Generar test que:
   - Levanta aplicación en test mode
   - Conecta a test DB
   - Ejecuta pasos del flujo
   - Verifica resultados en cada paso
3. Agregar a `src/__tests__/e2e/`
4. Ejecutar test

**Ejemplo**:
```
Usuario: "/generate-e2e-test full-lifecycle"

Claude:
✅ Generando E2E test para: Crear orden → Pagar → Verificar estado

Test generado: src/__tests__/e2e/order.lifecycle.e2e.spec.ts

Ejecutando test...

  ✅ Paso 1: Crear orden via GraphQL
    Query: createOrder(...)
    Resultado: Order creado en PENDING status
    
  ✅ Paso 2: Procesar pago
    Mutation: processPayment(...)
    Resultado: Payment completado
    
  ✅ Paso 3: Verificar cambio de estado
    Query: order(id)
    Resultado: Order en PAID status
    
✅ Full lifecycle test passed (3.4s)

Archivo: src/__tests__/e2e/order.lifecycle.e2e.spec.ts
Coverage: +5% (new test)
```

---

## Skill: mock-external-api

**Descripción**: Crear mock de API externa

**Sintaxis**:
```
/mock-external-api [service]
```

**Parámetros**:
- `service`: stripe, aws-secrets, kafka, rabbitmq, etc

**Qué hace**:
1. Crear archivo mock en `src/mocks/[service].mock.ts`
2. Implementar métodos clave del servicio
3. Retornar respuestas realistas
4. Registrar en test config
5. Documentar expected calls

**Ejemplo**:
```
Usuario: "/mock-external-api stripe"

Claude:
✅ Creando mock para Stripe API...

Archivo: src/mocks/stripe.service.ts

Métodos implementados:
  ✅ createCharge(amount, paymentMethod) → {id, status}
  ✅ createPaymentMethod(card) → {id, card_brand}
  ✅ refund(chargeId, amount) → {status}

Comportamiento:
  ✅ 90% pagos exitosos (random failure 10% para tests)
  ✅ Latencia realista (500ms)
  ✅ Idempotency key support
  
Test file created: src/mocks/__tests__/stripe.mock.spec.ts
  ✅ Tests para happy path
  ✅ Tests para error cases
  ✅ Tests para idempotencia

Uso en tests:
  jest.mock('@stripe/stripe-js', () => stripeServiceMock)
  
Próximo paso:
  Importar en PaymentService tests
```

---

## Skill: migration-generator

**Descripción**: Generar migraciones TypeORM automáticamente

**Sintaxis**:
```
/migration-generator [--entities=Order,Payment] [--name=AddOrderTable]
```

**Parámetros**:
- `--entities`: Entidades a migrar
- `--name`: Nombre de la migración

**Qué hace**:
1. Analizar entities actuales
2. Comparar con última migración
3. Generar cambios (ALTER, CREATE, INDEX)
4. Crear archivo en `src/migrations/`
5. Ejecutar `npm run typeorm:migration:run` (opcional)

**Ejemplo**:
```
Usuario: "/migration-generator --name=CreateOrderTables"

Claude:
✅ Detectando entidades...
  ✅ Order (creada)
  ✅ OrderItem (creada)
  ✅ Payment (creada)

✅ Comparando con BD actual...
  ✅ Tablas orden: no existen
  ✅ Índices: pendientes crear

✅ Generando migración...

Archivo: src/migrations/1704067200000-CreateOrderTables.ts

Cambios:
  CREATE TABLE orders (...)
  CREATE TABLE order_items (...)
  CREATE TABLE payments (...)
  CREATE INDEX idx_orders_customer_id (...)
  CREATE INDEX idx_order_items_order_id (...)

¿Ejecutar migración ahora? [Y/n]
```

---

## Skill: performance-profile

**Descripción**: Analizar performance de la aplicación

**Sintaxis**:
```
/performance-profile [--duration=60] [--load=100]
```

**Parámetros**:
- `--duration`: Duración en segundos
- `--load`: Requests por segundo

**Qué hace**:
1. Levantar aplicación con profiler
2. Ejecutar load test
3. Recolectar métricas:
   - Response times (p50, p95, p99)
   - Memory usage
   - CPU usage
   - Database query times
   - Cache hit rates
4. Identificar bottlenecks
5. Sugerir optimizaciones

**Ejemplo**:
```
Usuario: "/performance-profile --duration=30 --load=100"

Claude:
⏱️  Running performance profile (30s, 100 req/s)...

📊 Results:

Response Times:
  p50: 45ms
  p95: 120ms
  p99: 350ms
  Max: 890ms ⚠️

Throughput:
  Successful: 2,998/3,000 (99.9%)
  Errors: 2 (timeout)

Memory:
  Start: 120MB
  Peak: 245MB ✅
  End: 135MB

Database:
  Queries: 15,234
  Avg time: 8ms
  Slowest: 145ms (createOrder) ⚠️

Cache:
  Hits: 8,234 (54%)
  Misses: 6,764 (46%)

🔴 Bottleneck identificado:
  createOrder query lento (145ms)
  → Sugerencia: Agregar índice en customer_id
  → Sugerencia: Cachear por más tiempo (actualmente 1h)

Reporte guardado: .claude/profiles/perf-20260430.json
```

---

## Skill: dependency-audit

**Descripción**: Verificar y actualizar dependencias

**Sintaxis**:
```
/dependency-audit [--fix] [--security-only]
```

**Parámetros**:
- `--fix`: Actualiza automáticamente
- `--security-only`: Solo vulnerabilidades

**Qué hace**:
1. `npm audit`
2. Verifica actualizaciones disponibles
3. Identifica vulnerabilidades
4. Si `--fix`: Actualiza versiones
5. Ejecuta tests después

**Ejemplo**:
```
Usuario: "/dependency-audit --fix"

Claude:
🔍 Auditando dependencias...

Vulnerabilities:
  ⚠️  MEDIUM - lodash < 4.17.21 (update available)
  🔴 HIGH - express < 4.18.2 (update available)

Updates Available:
  ✅ jest: 29.0.0 → 29.5.0 (minor)
  ✅ typescript: 5.0.0 → 5.1.0 (minor)
  ✅ prettier: 3.0.0 → 3.0.1 (patch)

Aplicando fixes...
  ✅ Updated 5 packages
  ✅ npm run build: SUCCESS
  ✅ npm run test: 64 passed

package.json actualizado
✅ All vulnerabilities fixed
```

---

## Skills Disponibles - Resumen

| Skill | Descripción | Comando |
|-------|-------------|---------|
| spec-to-code | Spec → Código | `/spec-to-code [component]` |
| test-coverage | Analizar coverage | `/test-coverage [--improve]` |
| docker-health | Verificar Docker | `/docker-health [--fix]` |
| spec-review | Revisar spec | `/spec-review [--strict]` |
| lint-and-fix | Formatear código | `/lint-and-fix [--check-only]` |
| generate-e2e-test | Test E2E | `/generate-e2e-test [flujo]` |
| mock-external-api | Crear mock | `/mock-external-api [service]` |
| migration-generator | Generar migración | `/migration-generator [--name=X]` |
| performance-profile | Analizar perf | `/performance-profile [--load=100]` |
| dependency-audit | Auditar deps | `/dependency-audit [--fix]` |

---

**Próximo**: Definir Hooks en `.claude/hooks.md`
