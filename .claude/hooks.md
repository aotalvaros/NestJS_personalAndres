# 🔗 Hooks - Automatización y Eventos

Definición de hooks que se ejecutan automáticamente en eventos.

---

## Hook: on-spec-change

**Evento**: Usuario modifica `02-examples/SPEC.md`

**Ejecución automática**:
```
1. spec-validator agent verifica cambios
2. Si hay breaking changes:
   ├─ Identifica qué código se vio afectado
   ├─ Marca tests que pueden fallar
   └─ Sugiere código que necesita actualizar
3. Si todo está OK:
   └─ ✅ Aprobado, código no necesita cambios
4. Generar reporte de impacto
```

**Ejemplo**:
```
Usuario edita SPEC.md y cambia:
  RF-2.3: "Validar que Order existe y status es PENDING"
  a
  RF-2.3: "Validar que Order existe y status es PENDING o PAID"

Hook ejecuta:
  ✅ spec-validator detecta cambio
  ✅ Identifica que PaymentService.processPayment() se vio afectado
  
  ⚠️  IMPACTO DETECTADO:
     - PaymentService.processPayment() RF-2.3
     - PaymentService test case TC-2.1 necesita actualizar
     - PaymentResolver mutation necesita revisar
     - SPEC.md cambio en RequirePaymentInput validation
  
  Sugiero:
    1. Actualizar PaymentService línea 78 (check de status)
    2. Actualizar test case TC-2.3 (orden en PAID puede pagar de nuevo?)
    3. Revisar idempotencia con nuevo flujo
    
  ✅ Auto-actualizar código? [Y/n]
```

---

## Hook: on-commit

**Evento**: Usuario ejecuta `git commit`

**Ejecución automática**:
```
1. Validar que cambios coinciden con SPEC.md
2. Ejecutar linter (eslint, prettier)
3. Ejecutar tests afectados
4. Si tests fallan:
   ├─ Bloquear commit
   ├─ Mostrar errores
   └─ Sugerir solución
5. Si todo OK:
   ├─ Verificar CHANGELOG.md actualizado
   ├─ Verificar commit message sigue formato
   └─ Permitir commit
6. Generar PR description sugerida
```

**Commit message format**:
```
<type>(<scope>): <subject>

<body>

<footer>

Ejemplos válidos:
✅ feat(order-service): Add idempotent payment processing
✅ fix(graphql): Handle null payment in order resolver
✅ test(payment-service): Add edge case for expired orders
✅ docs(spec): Update RF-2.3 validation logic
❌ update stuff
❌ wip: trying things
```

**Ejemplo**:
```
Usuario: git commit -m "feat(payment): Add idempotency key validation"

Hook ejecuta:
  ✅ Validando contra SPEC.md...
    → Cambios en PaymentService coinciden con RF-2.2, RF-2.5
    
  ✅ ESLint... PASS
  
  ✅ Prettier... PASS (2 files formatted)
  
  ✅ npm run test -- payment.service.spec.ts
    → 8/8 tests PASS
    
  ⚠️  CHANGELOG.md not updated
    Sugerencia: Agregar:
    - [FEATURE] Payment idempotency with 24h TTL
    - [BUGFIX] Prevent duplicate charges on retry
    
  ✅ Commit message format: VALID
  
  📝 PR description sugerida:
    ## Summary
    - Add idempotency key validation in processPayment()
    - Redis caching for 24 hours (exactly-once guarantee)
    - Tests: 8 new cases covering retry scenarios
    
    ## Test plan
    - [ ] Manual test: create payment, retry with same key
    - [ ] Manual test: retry with different key (new charge)
    - [ ] E2E test: full flow
    
  ✅ Commit permitido!
  
  💡 Próximo paso: Puedes hacer `git push` o `/generate-pr`
```

---

## Hook: on-test-failure

**Evento**: Tests fallan durante ejecución

**Ejecución automática**:
```
1. Capturar test que falló
2. Extraer stack trace
3. Análisis automático de causa:
   ├─ ¿Error de compilación?
   ├─ ¿Mock no configurado?
   ├─ ¿Servicio no inyectado?
   ├─ ¿Aserción incorrecta?
   ├─ ¿Race condition?
   └─ ¿Timeout?
4. Sugerir causa probable
5. Ofrecer fix automático
6. Si es regression: comparar con última versión que pasaba
```

**Ejemplo - Mock no configurado**:
```
❌ OrderService › createOrder › should cache order in Redis

Error: this.cacheManager.set is not a function

Stack trace:
  at OrderService.createOrder (order.service.ts:45)

Hook detecta:
  🔴 CAUSA PROBABLE: Mock de cacheManager no configurado
  
  En order.service.spec.ts línea 32:
    const mockCacheManager = { ... }
    // ❌ Falta: set: jest.fn()
  
  Solución automática:
    1. Agregar "set: jest.fn()" al mock
    2. Ejecutar test nuevamente
    
  ✅ Fix aplicado
  ✅ Test ahora pasa
```

**Ejemplo - Race condition**:
```
⚠️  OrderService › getCustomerOrders › flaky test

Test pasó: 14/20 veces
Test falló: 6/20 veces

Hook detecta:
  🟡 CAUSA PROBABLE: Race condition en cache
  
  En orden.service.ts línea 52:
    const cached = await this.cacheManager.get(key)
    if (cached) return cached
    const order = await this.orderRepository.find() // ← Race: otro thread borra caché aquí
  
  Solución sugerida:
    1. Usar cache.getOrSet() (atomic)
    2. O: Usar lock en Redis
    3. O: Ignorar si cache expiró (aceptable trade-off)
  
  ¿Cual prefieres? [1/2/3]
```

---

## Hook: on-docker-error

**Evento**: docker-compose falla

**Ejecución automática**:
```
1. Capturar error de Docker
2. Analizar tipo de error:
   ├─ Port already in use?
   ├─ Image not found?
   ├─ Container crashed?
   ├─ Volume permission denied?
   ├─ Network error?
   └─ Health check timeout?
3. Sugerir solución
4. Si permitido (--fix): aplicar automático
5. Reintentar
```

**Ejemplo - Puerto en uso**:
```
❌ docker-compose up -d

Error: Port 5432 already in use
  → Cannot allocate port 5432:5432

Hook ejecuta:
  🔍 Investigando puerto 5432...
  
  Proceso actual en puerto 5432:
    PID 2847: /usr/lib/postgresql/15/bin/postgres (proceso viejo)
  
  Opciones:
    1. Matar proceso viejo: kill 2847
    2. Usar puerto diferente: change docker-compose.yml
    3. docker-compose down (si contenedor nuestro está stuck)
  
  ¿Cual? [1/2/3]
  
  Usuario: 1
  
  ✅ Matando proceso...
  ✅ docker-compose up -d: SUCCESS
  ✅ postgres healthcheck: PASS
  ✅ All services UP
```

**Ejemplo - Container crashed**:
```
❌ docker-compose up -d

app container exited with code 137 (OOM killed)
postgres container UP
redis container UP

Hook ejecuta:
  🔴 CAUSA: Out of Memory (OOM)
  
  Investigación:
    - Contenedor app: limit 512MB
    - Memory at crash: 623MB
    - Node heap: too high
  
  Sugerencias:
    1. Aumentar memory limit en docker-compose.yml (512 → 1GB)
    2. Reducir NODE_OPTIONS heap
    3. Investigar memory leak en código
  
  Solución rápida:
    docker-compose.yml → memory: 1G
    docker-compose up -d
  
  ✅ Aplicar? [Y/n]
  
  Usuario: Y
  
  ✅ Updated docker-compose.yml
  ✅ docker-compose up -d: SUCCESS
  
  ⚠️  Revisar memory leak en código:
     - Ver logs: docker-compose logs -f app
     - Profile memory: /performance-profile --duration=120
```

---

## Hook: on-pr-ready

**Evento**: Usuario dice "PR lista" o hace `git push`

**Ejecución automática**:
```
1. Validar pre-flight checklist
2. Ejecutar tests completos
3. Generar coverage report
4. Generar CHANGELOG entry
5. Sugerir PR title y description
6. Ofrecer crear PR automáticamente
```

**Ejemplo**:
```
Usuario: git push origin payment-idempotency

Hook ejecuta:
  ✅ Pre-flight check...
    ✅ Specs aprobadas
    ✅ Tests 85% coverage
    ✅ Build OK
    ✅ Linter OK
    ✅ Docs updated
  
  ✅ Ejecutando test suite...
    ✅ Unit: 47 passed (0.8s)
    ✅ Integration: 12 passed (2.1s)
    ✅ E2E: 5 passed (4.2s)
  
  ✅ Generando CHANGELOG...
    [Feature] Payment idempotency with 24h Redis cache
    [Bugfix] Prevent duplicate charges on network retry
    [Test] 8 new test cases
  
  📝 PR Title sugerido:
    "feat(payment): Add idempotent payment processing with Redis cache"
  
  📝 PR Description sugerida:
    ## Summary
    - Implement idempotency key validation
    - Redis caching of payment results (24h TTL)
    - Exactly-once guarantee for payment processing
    - Handles network retries without duplicating charges
    
    ## Changes
    - src/services/payment.service.ts: +45 lines (processPayment with cache)
    - src/services/__tests__/payment.service.spec.ts: +8 test cases
    - docs/IMPLEMENTATION.md: Added section on idempotency
    
    ## Test Coverage
    - Unit: 47 tests passing (85% coverage)
    - Integration: Payment + Order repository
    - E2E: Full lifecycle test
    
    ## Related
    - Closes #42 (Payment retry issue)
    - RFC: https://... (if exists)
  
  ✅ Crear PR automáticamente? [Y/n]
  
  Usuario: Y
  
  ✅ PR created: #128
  ✅ URL: https://github.com/user/repo/pull/128
```

---

## Hook: on-code-review

**Evento**: Usuario recibe feedback en PR review

**Ejecución automática** (si feedback es automático):
```
1. Leer comentarios del reviewer
2. Si son cambios simples (format, lint):
   ├─ Aplicar automáticamente
   ├─ Commit cambios
   └─ Push
3. Si son cambios complejos:
   ├─ Listar cambios requeridos
   ├─ Sugerir cómo implementarlos
   └─ Marcar TODO en código
4. Generar commit message sugerido
```

**Ejemplo**:
```
Reviewer: "Please add error handling for Stripe API timeout"

Hook ejecuta:
  📝 Feedback analizado...
  
  Cambio requerido:
    - Ubicación: src/services/payment.service.ts:78
    - Causa actual: No hay timeout handling en createCharge()
    - Solución: Agregar try-catch con retry logic
  
  ¿Aplicar automáticamente? [Y/n]
  
  Usuario: Y
  
  ✅ Actualizando código...
    ├─ Agregar timeout detection (stripe error)
    ├─ Implementar retry (max 3 veces)
    ├─ Loguear cada intento
    └─ Actualizar tests
  
  ✅ npm run test: 64 passed
  
  💬 Commit message sugerido:
    "review(payment): Add Stripe API timeout handling with retries
    
    - Handle timeout errors from Stripe API
    - Retry up to 3 times before failing
    - Log each attempt for debugging
    - Update tests to cover timeout scenario"
  
  ✅ Commit? [Y/n]
  
  Usuario: Y
  
  ✅ Committed and pushed
  ✅ Resolve conversation
```

---

## Hook: on-merge

**Evento**: PR se mergea a main

**Ejecución automática**:
```
1. Crear git tag con versión
2. Actualizar CHANGELOG.md
3. Ejecutar tests en main (validar merge)
4. Si tests OK:
   ├─ Actualizar documentación
   ├─ Crear release notes
   └─ Notificar equipo
5. Si tests fallan:
   ├─ Revertar merge
   ├─ Alertar equipo
   └─ Crear issue para investigar
```

**Ejemplo**:
```
PR #128 merged to main

Hook ejecuta:
  ✅ Running CI/CD pipeline on main...
  
  ✅ Tests on main: 64 passed
  ✅ Build: SUCCESS
  ✅ Coverage: 85%
  
  ✅ Creando git tag...
    Tag: v1.2.0
    Descripción: Payment idempotency feature
  
  ✅ Actualizando CHANGELOG.md
  
  📋 Release notes generadas:
    ## v1.2.0 - Payment Idempotency
    
    **Features:**
    - Payment idempotency with Redis cache (24h TTL)
    - Exactly-once guarantee prevents duplicate charges
    - Network retry support without side effects
    
    **Test Coverage:**
    - 8 new unit tests
    - 3 new integration tests
    - 1 new E2E test
    
    **Performance:**
    - Cache hit: <10ms response
    - Paymentprocessing: <2s first time
  
  ✅ Publicar a Slack?
    Channel: #deployments
    Mensaje: "🚀 v1.2.0 released with payment idempotency!"
```

---

## Hook: on-daily-summary

**Evento**: 9:00 AM cada mañana (configurable)

**Ejecución automática**:
```
1. Recolectar métricas del día anterior:
   ├─ Tests ejecutados
   ├─ Commits hechos
   ├─ PRs merged
   ├─ Issues cerrados
   ├─ Code coverage trend
   └─ Performance metrics
2. Generar reporte
3. Enviar a Slack/Email
```

**Ejemplo**:
```
📊 Daily Summary - 2026-04-30

Code Activity:
  Commits: 12
  PRs merged: 3
  Tests: 64 passed (0 failed)
  Coverage: 85% (↑ from 84%)
  
Issues & PRs:
  Issues closed: 2
  New issues: 1
  PRs in review: 2
  
Code Quality:
  Linter warnings: 0
  Type errors: 0
  CVE vulnerabilities: 0
  
Performance:
  API P95: 120ms (↓ from 140ms)
  Database P95: 8ms (→ same)
  Cache hit rate: 54% (↑ from 48%)

🟢 All metrics healthy!

Próximos pasos:
  - 2 PRs esperan review
  - Mejorar cache hit rate en OrderService
  - Considerar índice DB para customer queries
```

---

## Hooks - Configuración

Para habilitar/deshabilitar hooks:

```bash
# Ver hooks activos
claude hooks list

# Deshabilitar un hook
claude hooks disable on-test-failure

# Habilitar un hook
claude hooks enable on-spec-change

# Ver logs de hooks
claude hooks logs --filter=on-docker-error
```

---

## Hooks - Validación

```yaml
# .claude/hooks-config.yaml
hooks:
  on-spec-change:
    enabled: true
    auto-fix: false
    notify: true
    
  on-commit:
    enabled: true
    auto-format: true
    run-tests: true
    
  on-test-failure:
    enabled: true
    auto-fix: false
    suggest-solutions: true
    
  on-docker-error:
    enabled: true
    auto-fix: false
    retry: true
    
  on-pr-ready:
    enabled: true
    auto-create-pr: false
    
  on-merge:
    enabled: true
    create-tag: true
    update-docs: true
```

---

**Próximo**: Definir Rules en `.claude/rules.md`
