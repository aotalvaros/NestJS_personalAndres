# 🎼 ORQUESTACIÓN - Cómo Usar Todo Junto

**Propósito**: Guía paso a paso para activar agents, skills, hooks y rules en un flujo cohesivo.

**Tiempo total**: 30 minutos (primer setup)

---

## 🎯 Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    SPEC.md (Fuente de Verdad)              │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    ┌─────────────┐      ┌──────────────┐
    │   Agents    │      │   Skills     │
    │  (6 tipos)  │      │  (10 tipos)  │
    └──────┬──────┘      └──────┬───────┘
           │                    │
           └────────┬───────────┘
                    ▼
         ┌─────────────────────┐
         │   Hooks Automáticos │
         │     (7 eventos)     │
         └────────┬────────────┘
                  ▼
         ┌─────────────────────┐
         │   Rules (Validación)│
         │   Errores Evitados  │
         └────────┬────────────┘
                  ▼
         ┌─────────────────────┐
         │  Código + Tests     │
         │  Desplegable        │
         └─────────────────────┘
```

---

## 📋 Pre-requisitos

Antes de orquestar, verificar:

```bash
# 1. Node.js instalado
node --version              # v18+

# 2. Docker instalado
docker --version            # 20.10+
docker-compose --version    # 2.10+

# 3. Git configurado
git config --global user.name
git config --global user.email

# 4. En el directorio correcto
cd ~/Cursos/Curso_nest
pwd                         # Debe terminar en /Curso_nest

# 5. Archivos de configuración
ls -la .claude/            # agents.md, skills.md, hooks.md, rules.md
ls -la CLAUDE.md
ls -la 02-examples/        # SPEC.md, README.md, HOJA-DE-RUTA.md
```

---

## 🚀 Flujo de Orquestación Completo

### **FASE 1: Preparación (5 minutos)**

#### Paso 1.1: Verificar especificación
```bash
# Abrir y leer SPEC.md
cat 02-examples/SPEC.md | head -50

# O en IDE:
# Abrir: 02-examples/SPEC.md
```

**Expectativa**:
- ✅ SPEC.md legible y clara
- ✅ Requisitos funcionales (RF) definidos
- ✅ Test cases documentados
- ✅ Entidades mapeadas

---

#### Paso 1.2: Activar spec-validator agent
```bash
# Opción A: Comando directo (si está configurado)
/spec-validator

# Opción B: Manual (usar agente)
claude spec-validator

# Opción C: Descripción (Claude entiende)
"Valida mi SPEC.md en 02-examples/ contra checklist completo"
```

**Expectativa**:
```
✅ SPEC VALIDATION REPORT
  ✅ RF-1 a RF-4: Requisitos claros
  ✅ Entidades: Order, OrderItem, Payment
  ✅ Test cases: 8 casos cubiertos
  ✅ GraphQL endpoints: Definidos
  ✅ Mocks identificados
  
Veredicto: ✅ APPROVED FOR IMPLEMENTATION
```

**Si falla**:
```
⚠️  NEEDS_REVIEW
  ├─ RF-2.5: TTL en Redis no especificado (24h implícito)
  ├─ Test case faltante: PaymentService timeout
  └─ Acción: Actualizar SPEC.md y reintentar

Después actualizar SPEC.md y reintentar /spec-validator
```

---

### **FASE 2: Code Generation (10 minutos)**

#### Paso 2.1: Activar spec-to-code agent
```bash
# Generar TODOS los componentes de una vez
/spec-to-code --all

# O por componente (si prefieres granular)
/spec-to-code OrderService
/spec-to-code PaymentService
/spec-to-code EmailConsumer
# etc...
```

**Qué sucede automáticamente**:
```
✅ Leyendo SPEC.md...
✅ Extrayendo requisitos...

✅ Generando src/entities/
  ✅ order.entity.ts (con relaciones)
  ✅ order-item.entity.ts
  ✅ payment.entity.ts
  ✅ audit-log.entity.ts
  ✅ email-log.entity.ts

✅ Generando src/repositories/
  ✅ order.repository.ts (custom queries)
  ✅ payment.repository.ts

✅ Generando src/services/
  ✅ order.service.ts (createOrder, getOrder, etc)
  ✅ payment.service.ts (processPayment IDEMPOTENTE)
  ✅ mocks/stripe.service.ts
  ✅ mocks/secrets.service.ts

✅ Generando src/graphql/
  ✅ types/order.type.ts
  ✅ types/payment.type.ts
  ✅ inputs/create-order.input.ts
  ✅ inputs/process-payment.input.ts
  ✅ resolvers/order.resolver.ts
  ✅ resolvers/payment.resolver.ts
  ✅ guards/auth.guard.ts

✅ Generando src/producers/
  ✅ kafka.producer.ts

✅ Generando src/consumers/
  ✅ audit.consumer.ts
  ✅ email.consumer.ts

✅ Generando tests/
  ✅ services/__tests__/order.service.spec.ts
  ✅ services/__tests__/payment.service.spec.ts
  ✅ __tests__/e2e/order.e2e.spec.ts

✅ npm run build
  SUCCESS - 0 errors

✅ npm run lint
  SUCCESS - 0 warnings

✅ npm run format
  Applied to 24 files

Resultado: 24 archivos creados, código listo
```

**Validar**:
```bash
# Verificar que compiló
npm run build

# Verificar que linter pasó
npm run lint

# Verificar formato
npm run format

# Resultado esperado
# ✅ All files processed
# ✅ 0 errors
# ✅ 0 warnings
```

---

#### Paso 2.2: Revisar código generado
```bash
# Ver estructura creada
tree src/ -L 2

# Abrir archivos clave
# - src/services/order.service.ts (lógica)
# - src/services/payment.service.ts (IDEMPOTENCIA crítica)
# - src/graphql/resolvers/order.resolver.ts (API)

# Validar docstrings presentes
grep -r "/**" src/ | wc -l
# Esperado: 30+ docstrings

# Validar que mocks están en lugar
ls src/mocks/
# Esperado: stripe.service.ts, secrets.service.ts
```

---

### **FASE 3: Testing (8 minutos)**

#### Paso 3.1: Activar test-runner agent
```bash
# Ejecutar tests completos
npm run test

# Resultado esperado:
# PASS  src/services/__tests__/order.service.spec.ts (0.8s)
# PASS  src/services/__tests__/payment.service.spec.ts (1.1s)
# ...
# Test Suites: 8 passed, 8 total
# Tests: 64 passed, 64 total
# Snapshots: 0 total
# Time: 7.34s
```

#### Paso 3.2: Mejorar coverage
```bash
# Analizar gaps
/test-coverage --min-threshold=85

# Resultado esperado:
# ✅ Services: 85% coverage
# ✅ Repositories: 90% coverage
# ✅ Overall: 85% coverage

# Si coverage < 80%, generar tests faltantes
/test-coverage --improve

# Esto genera tests automáticos y retesta
# Iteración: hasta llegar a 85%+
```

#### Paso 3.3: Tests específicos
```bash
# Validar tests críticos (idempotencia)
npm run test -- payment.service.spec

# Validar E2E
npm run test:e2e

# Validar integration
npm run test:integration

# Esperado: todos PASS
```

**Si algún test falla**:
```
❌ FAIL: PaymentService › ProcessPayment › CACHE HIT

Error: Expected cache to return in < 10ms but took 150ms

Hook on-test-failure automáticamente:
  ✅ Diagnostica causa (mock de cacheManager lento?)
  ✅ Sugiere solución (usar jest.useFakeTimers?)
  ✅ Ofrece fix automático
  
Usuario responde "apply fix" → test reejecutado → PASS
```

---

### **FASE 4: Docker Orchestration (5 minutos)**

#### Paso 4.1: Levantar servicios
```bash
# Navegar a carpeta del ejemplo
cd 02-examples

# Crear .env si no existe
cp .env.example .env

# Levantar Docker
docker-compose up -d

# Resultado esperado:
# Creating order-db ... done
# Creating order-cache ... done
# Creating order-zk ... done
# Creating order-kafka ... done
# Creating order-rabbitmq ... done
# Creating order-api ... done
```

#### Paso 4.2: Verificar salud
```bash
# Activar docker-orchestrator agent
/docker-health

# Resultado esperado:
# 🐳 Docker Status
# ================
# 
# Services:
#   postgres       ✅ UP (healthy)    5432
#   redis          ✅ UP (healthy)    6379
#   zookeeper      ✅ UP (healthy)    2181
#   kafka          ✅ UP (healthy)    9092
#   rabbitmq       ✅ UP (healthy)    5672, 15672
#   app            ✅ UP (healthy)    3000
#
# Connectivity:
#   app → postgres       ✅ OK
#   app → redis          ✅ OK
#   app → kafka          ✅ OK
#   app → rabbitmq       ✅ OK
#
# ✅ All services healthy!
```

**Si algún servicio falla**:
```
❌ postgres: UNHEALTHY (timeout)

Hook on-docker-error automáticamente:
  ✅ Diagnostica (port 5432 in use?)
  ✅ Sugiere solución (kill proceso viejo)
  ✅ Ofrece fix con --fix flag
  
/docker-health --fix
  ✅ Killed old postgres (PID 2847)
  ✅ Restarting container
  ✅ postgres now HEALTHY
```

#### Paso 4.3: Ejecutar migraciones
```bash
# Auto-ejecutado en docker-compose, pero si no:
docker-compose exec app npm run typeorm:migration:run

# Ver tablas creadas
docker-compose exec postgres psql -U postgres -d orderdb -c "\dt"

# Esperado:
# public | orders       | table
# public | order_items  | table
# public | payments     | table
# public | audit_logs   | table
# public | email_logs   | table
```

---

### **FASE 5: Validación End-to-End (2 minutos)**

#### Paso 5.1: Health check endpoint
```bash
curl http://localhost:3000/health

# Resultado esperado:
{
  "database": "UP",
  "redis": "UP",
  "kafka": "UP",
  "rabbitmq": "UP",
  "status": "UP"
}
```

#### Paso 5.2: Abrir GraphQL Playground
```bash
# En navegador:
http://localhost:3000/graphql

# Deberías ver:
# - Apollo Sandbox loaded
# - Schema available in left sidebar
# - Ready to execute queries
```

#### Paso 5.3: Ejecutar mutation de prueba
```graphql
mutation CreateTestOrder {
  createOrder(input: {
    customerId: "550e8400-e29b-41d4-a716-446655440000"
    items: [
      { productId: "prod-1", quantity: 2, unitPrice: 50 }
    ]
  }) {
    id
    customerId
    totalAmount
    status
  }
}
```

**Resultado esperado**:
```json
{
  "data": {
    "createOrder": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "customerId": "550e8400-e29b-41d4-a716-446655440000",
      "totalAmount": 100,
      "status": "PENDING"
    }
  }
}
```

**Si falla**:
```
❌ Error: Cannot connect to database

Debuggear:
  docker-compose logs app | grep -i error
  curl http://localhost:5432  # ¿PostgreSQL está UP?
  docker-compose exec postgres pg_isready
```

---

## 🔄 Ciclo Completo: Agregar Feature Nueva

Una vez que todo esté UP, aquí está el flujo para agregar una feature:

```
1. ESPECIFICAR
   ├─ Actualizar SPEC.md con nuevo requisito
   └─ /spec-validator --strict

2. GENERAR
   ├─ /spec-to-code [componente]
   └─ npm run build ✅

3. TESTAR
   ├─ npm run test
   └─ /test-coverage --improve

4. INTEGRAR
   ├─ docker-compose restart
   └─ /docker-health

5. VERIFICAR
   ├─ http://localhost:3000/graphql
   └─ Probar mutation/query

6. COMMIT
   ├─ git add .
   ├─ git commit -m "feat(spec): Add new feature"
   └─ Hook on-commit: automático
```

**Tiempo por ciclo**: 5-10 minutos (todo automático)

---

## 🎛️ Panel de Control - Comandos Principales

### **Agentes** (Grandes tareas)
```bash
/spec-validator          # ¿Spec está OK?
/code-generator          # Generar código
/test-runner             # Ejecutar tests
/docker-orchestrator     # Gestionar Docker
/spec-to-code            # Todo en uno
/deployment-ready        # Pre-flight check
```

### **Skills** (Tareas específicas)
```bash
/test-coverage --improve           # Mejorar coverage
/docker-health --fix               # Reparar Docker
/lint-and-fix                      # Formatear
/spec-review --strict              # Revisar spec
/generate-e2e-test full-lifecycle  # Test E2E
```

### **Comandos Manuales** (CLI)
```bash
npm run test                 # Unit tests
npm run test:integration     # Integration
npm run test:e2e            # E2E
npm run build               # Compilar
npm run start:dev           # Dev server
npm run lint                # ESLint
npm run format              # Prettier
docker-compose up -d        # Levantar
docker-compose ps           # Estado
docker-compose logs -f app  # Logs
```

---

## 📊 Monitoreo Durante Desarrollo

### **En Terminal 1: Dev Server**
```bash
npm run start:dev

# Salida esperada:
# [Nest] 12345 - 04/30/2026, 10:30:00 AM LOG [NestFactory] Starting Nest application
# [Nest] 12345 - 04/30/2026, 10:30:01 AM LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12345 - 04/30/2026, 10:30:02 AM LOG [NestFactory] Nest application successfully started
# [Nest] 12345 - 04/30/2026, 10:30:02 AM LOG [NestExpressApplication] Nest server listening on port 3000
```

### **En Terminal 2: Logs de Docker**
```bash
docker-compose logs -f app

# Ver logs en real-time de servicios internos
```

### **En Terminal 3: Tests en Watch Mode**
```bash
npm run test -- --watch

# Re-ejecuta tests cuando cambias archivos
```

### **En Browser: GraphQL Playground**
```
http://localhost:3000/graphql

Probar queries mientras codeas
```

---

## ⚡ Automatizaciones Activas

Una vez que todo está UP, estos hooks se ejecutan automáticamente:

```
on-spec-change:
  ├─ Detecta cambios en SPEC.md
  ├─ Valida completitud
  └─ Sugiere código a actualizar
  
on-commit:
  ├─ npm run lint automático
  ├─ Ejecuta tests afectados
  ├─ Valida mensaje de commit
  └─ Genera PR description

on-test-failure:
  ├─ Captura error
  ├─ Diagnostica causa
  ├─ Sugiere fix
  └─ Ofrece aplicar automático

on-docker-error:
  ├─ Identifica problema
  ├─ Sugiere solución
  ├─ Con --fix: aplica automático
  └─ Reintenta

on-pr-ready:
  ├─ Pre-flight check
  ├─ Ejecuta test suite
  ├─ Genera CHANGELOG
  └─ Crea PR automáticamente
```

---

## 🎯 Métricas de Éxito

Sabes que la orquestación funciona cuando:

### **Fase 1: Spec Ready**
- ✅ /spec-validator retorna APPROVED
- ✅ No hay ambigüedades
- ✅ Test cases cubiertos

### **Fase 2: Code Ready**
- ✅ npm run build: SUCCESS
- ✅ npm run lint: 0 errors
- ✅ 20+ archivos generados

### **Fase 3: Tests Ready**
- ✅ npm run test: 64+ passed
- ✅ Coverage: 85%+
- ✅ npm run test:e2e: todos pasan

### **Fase 4: Docker Ready**
- ✅ docker-compose ps: todos UP
- ✅ /docker-health: todos OK
- ✅ curl /health: todos UP

### **Fase 5: API Ready**
- ✅ http://localhost:3000/graphql: accessible
- ✅ Mutation createOrder: funciona
- ✅ Respuesta < 500ms

---

## 🚨 Troubleshooting Rápido

| Problema | Comando | Solución |
|----------|---------|----------|
| Build falla | `npm run build` | Ver errores TypeScript, `/lint-and-fix` |
| Tests fallan | `npm run test` | `/test-runner` sugiere fixes |
| Docker no inicia | `docker-compose logs` | `/docker-health --fix` |
| GraphQL no responde | `curl http://localhost:3000/health` | Verificar app container |
| Cache no funciona | `docker-compose exec redis redis-cli ping` | Reiniciar Redis |
| Kafka offline | `docker-compose logs kafka` | Ver tema creation logs |
| RabbitMQ admin no accesible | Ver :15672 | Port puede estar en uso |

**Usar**: `make health` para diagnóstico automático de todo

---

## 📈 Después de Orquestar

Una vez que todo está funcionando:

1. **Monitorear**
   - Logs en terminal 2
   - GraphQL en browser
   - Tests en watch mode

2. **Iterar**
   - Cambiar código
   - Hooks se ejecutan automáticamente
   - Tests retestean automáticamente

3. **Expandir**
   - Agregar nuevos requisitos a SPEC.md
   - /spec-to-code para nuevos componentes
   - Tests automáticos
   - Deploy automático

4. **Documentar**
   - IMPLEMENTATION.md actualizado
   - Diagramas generados
   - Cambios loguados

---

## 🎉 Checklist Final

Cuando TODO está en lugar, marcar:

- [ ] ✅ SPEC.md validada
- [ ] ✅ Código generado
- [ ] ✅ Tests 85%+ coverage
- [ ] ✅ Docker todos UP
- [ ] ✅ GraphQL funciona
- [ ] ✅ Migraciones ejecutadas
- [ ] ✅ Health checks OK
- [ ] ✅ Logs visibles
- [ ] ✅ Automation activa
- [ ] ✅ Listo para desarrollo

**Cuando todo ✅**: Sistema listo para ser usado en producción (con mocks)

---

## 🔗 Próximo Nivel

Si quieres ir más allá:

1. **Agregar autenticación real** (JWT, Passport)
2. **Integrar Stripe real** (reemplazar mock)
3. **Kubernetes** (en lugar de Docker local)
4. **CI/CD** (GitHub Actions, deploy automático)
5. **Monitoring** (Prometheus, Grafana)
6. **Load testing** (k6, Apache JMeter)

Pero por ahora, **tienes un sistema production-ready** 🚀

---

**Tiempo de setup**: 30 minutos (automático)
**Tiempo de iteración**: 5-10 minutos por feature
**Sistema**: Completamente orquestado y automático

¡Listo para usar! 🎊

