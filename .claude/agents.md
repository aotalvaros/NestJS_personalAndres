# 🤖 Agents - Agentes Personalizados para Spec-Driven Development

Definición de agentes que Claude utiliza para automatizar tareas complejas.

---

## Agent 1: spec-validator

**Propósito**: Validar que las especificaciones sean claras, completas y implementables.

**Cuándo activar**: 
- Usuario: "valida mi spec"
- Usuario: "¿está lista la spec para implementar?"
- Hook: on-spec-change

**Flujo**:
```
1. Leer 02-examples/SPEC.md
2. Validar checklist:
   ├─ RF (Requisitos Funcionales) claros y sin ambigüedad
   ├─ RNF (Requisitos No-Funcionales) medibles
   ├─ Entidades TypeORM definidas
   ├─ Relaciones (1:1, 1:N, N:M) mapeadas
   ├─ Test cases con Arrange-Act-Assert
   ├─ Casos de error contemplados
   ├─ Flujos de integración (Kafka, RabbitMQ)
   ├─ Mocks identificados
   └─ Endpoints GraphQL definidos

3. Generar reporte:
   ✅ Items completos
   ⚠️  Items incompletos
   ❌ Items faltantes

4. Retornar:
   - Estado: APPROVED / NEEDS_REVIEW
   - Sugerencias de mejora
   - Blockers para implementar
```

**Output esperado**:
```markdown
# Spec Validation Report

## Status: ✅ APPROVED

### ✅ Aprobado
- RF-1.1 a RF-1.5: Crear orden (claro)
- RNF-1.1 a RNF-1.3: Performance y BD (cuantificado)
- Test cases: 5 casos cubiertos
- Entidades: Order, OrderItem, Payment (completas)

### ⚠️  Revisar
- RF-2.5: Idempotencia - especificar TTL en Redis (actualmente implícito)

### ❌ Faltante
- Nada identificado

## Recomendaciones
1. Aclarar en RF-2.5 el TTL exacto (24 horas)
2. Agregar test case para timeout de idempotencia

## Veredicto
✅ LISTO PARA IMPLEMENTAR (con sugerencias opcionales)
```

---

## Agent 2: code-generator

**Propósito**: Generar código funcional desde especificaciones.

**Cuándo activar**:
- Usuario: "implementa OrderService"
- Usuario: "genera todos los servicios"
- Después de spec-validator APPROVED

**Flujo**:
```
1. Leer especificación (SPEC.md)
2. Generar por componentes:
   ├─ Entities (TypeORM)
   ├─ Repositories (custom methods)
   ├─ Services (lógica de negocio)
   ├─ Resolvers (GraphQL)
   ├─ DTOs/Inputs
   ├─ Producers (Kafka/RabbitMQ)
   ├─ Consumers (Kafka/RabbitMQ)
   └─ Mocks (Stripe, AWS, etc)

3. Para cada componente:
   ├─ Estructura base con tipos
   ├─ Métodos del spec
   ├─ Docstrings explicativos
   ├─ Error handling
   ├─ Logging
   ├─ Validación de inputs
   └─ Integración entre capas

4. Generar tests unitarios paralelos:
   ├─ Setup con mocks
   ├─ Test exitoso
   ├─ Casos de error
   ├─ Edge cases
   └─ Pattern Arrange-Act-Assert

5. Verificar:
   ├─ npm run build
   ├─ npm run lint
   ├─ npm run format
   └─ Tests compilan

6. Output:
   └─ Directorio src/ con código listo
      └─ Directorio src/__tests__/ con tests
```

**Parámetros**:
```
/code-generator --component OrderService
/code-generator --all (genera todo)
/code-generator --with-tests (incluye tests)
```

**Calidad esperada**:
- ✅ Código compila
- ✅ Tests pasan
- ✅ 80%+ coverage
- ✅ Linter sin errores
- ✅ Formatter aplicado
- ✅ Docstrings presentes

---

## Agent 3: test-runner

**Propósito**: Ejecutar tests, reportar resultados, identificar regressions.

**Cuándo activar**:
- Usuario: "ejecuta tests"
- User: "¿cuál es el coverage?"
- Hook: on-commit
- Hook: on-push

**Flujo**:
```
1. Ejecutar test suite por nivel:
   ├─ npm run test (unit)
   │  └─ Tiempo máx: 30s
   ├─ npm run test:integration (integration)
   │  └─ Tiempo máx: 60s
   ├─ npm run test:e2e (e2e)
   │  └─ Tiempo máx: 120s
   └─ npm run test -- --coverage

2. Recolectar resultados:
   ├─ Total tests ejecutados
   ├─ Passed / Failed
   ├─ Skipped / Disabled
   ├─ Coverage por archivo
   ├─ Tiempo total
   └─ Fallos por categoría

3. Análisis:
   ├─ Tests fallidos: diagnosticar causa
   ├─ Coverage < 80%: identificar gaps
   ├─ Regressions: comparar contra baseline
   └─ Flaky tests: alertar

4. Reportar:
   ├─ Resumen ejecutivo (1 línea)
   ├─ Tabla de resultados
   ├─ Archivos con bajo coverage
   ├─ Errores específicos
   └─ Recomendaciones

5. Si tests fallan:
   ├─ Mostrar stack trace
   ├─ Sugerir causa raíz
   ├─ Ofrecer fix automático (si aplica)
   └─ Blocker para commit
```

**Output esperado**:
```
🧪 Test Results
===============

Unit Tests:       ✅ 47/47 passed (0.8s)
Integration:      ✅ 12/12 passed (2.1s)
E2E:              ✅ 5/5 passed (4.2s)

Total:            ✅ 64/64 passed (7.1s)

Coverage:
  Statements:     85.2% (↑ from 84.1%)
  Branches:       82.1% (→ same)
  Functions:      88.3% (↑ from 87.9%)
  Lines:          84.9% (↑ from 83.5%)

Files with gaps:
  src/guards/auth.guard.ts      72% (← revisar)
  src/mocks/stripe.service.ts   91% (aceptable)

✅ All green! Ready to merge.
```

**En caso de fallo**:
```
❌ Test Failed: src/services/order.service.spec.ts

  ❌ OrderService › createOrder › should throw when items empty

Error: Expected BadRequestException but got nothing

  at Object.<anonymous> (order.service.spec.ts:145:12)

Causa probable:
  - validateCreateOrderInput() no se ejecuta antes de service.createOrder()
  - O el mock de repository.save no está configurado

Solución sugerida:
  - Verificar que validateCreateOrderInput() se llama en createOrder()
  - Mocker correctamente dependencies
```

---

## Agent 4: docker-orchestrator

**Propósito**: Gestionar composición Docker, servicios, migraciones.

**Cuándo activar**:
- Usuario: "levanta servicios"
- Usuario: "revisa salud"
- Usuario: "ejecuta migraciones"
- Hook: on-docker-error

**Flujo**:
```
1. Verificar prerequisitos:
   ├─ Docker está instalado
   ├─ docker-compose versión ✅
   ├─ Puertos 3000, 5432, 6379, etc disponibles
   ├─ .env existe
   └─ Suficiente espacio en disco

2. Ejecutar docker-compose up -d:
   ├─ Crear redes
   ├─ Crear volúmenes
   ├─ Pull/build imágenes
   ├─ Iniciar contenedores
   └─ Esperar healthchecks

3. Esperar servicios:
   ├─ PostgreSQL (pg_isready)
   ├─ Redis (PING)
   ├─ Zookeeper (port 2181)
   ├─ Kafka (broker API)
   ├─ RabbitMQ (AMQP)
   └─ App (GET /health)

4. Ejecutar inicialización:
   ├─ npm run typeorm:migration:run
   ├─ npm run typeorm:seed (opcional)
   └─ Crear topics Kafka (si no existen)

5. Verificar conectividad:
   ├─ App ↔ DB
   ├─ App ↔ Redis
   ├─ App ↔ Kafka
   ├─ App ↔ RabbitMQ
   └─ Services entre sí

6. Retornar status detallado
```

**Parámetros**:
```
/docker up                    # Levanta todo
/docker down                  # Apaga todo
/docker health                # Verifica salud
/docker migrate              # Solo migraciones
/docker logs [service]       # Ver logs
/docker reset               # Limpia volúmenes y recrea
```

**Status esperado**:
```
🐳 Docker Status
================

Services:
  postgres       ✅ UP (healthy)    5432
  redis          ✅ UP (healthy)    6379
  zookeeper      ✅ UP (healthy)    2181
  kafka          ✅ UP (healthy)    9092
  rabbitmq       ✅ UP (healthy)    5672, 15672
  app            ✅ UP (healthy)    3000

Connectivity:
  app → postgres       ✅ OK
  app → redis          ✅ OK
  app → kafka          ✅ OK
  app → rabbitmq       ✅ OK

Database:
  Migrations run:      ✅ 3 applied
  Tables created:      ✅ 5 tables
  
URLs disponibles:
  API GraphQL:         http://localhost:3000/graphql
  RabbitMQ Admin:      http://localhost:15672 (guest/guest)
  Health Check:        http://localhost:3000/health

✅ System ready!
```

---

## Agent 5: spec-to-code

**Propósito**: Conversor completo: especificación → código funcional + tests.

**Cuándo activar**:
- Usuario: "spec-to-code OrderService"
- Usuario: "implementa todo"
- Después de spec-validator APPROVED

**Flujo**:
```
1. Leer especificación (SPEC.md)
2. Extraer requisitos:
   ├─ Entidades y relaciones
   ├─ Métodos de servicio
   ├─ Casos de error
   ├─ Validaciones
   └─ Integraciones

3. Generar:
   ├─ src/entities/*.entity.ts
   ├─ src/repositories/*.repository.ts
   ├─ src/services/*.service.ts
   ├─ src/services/__tests__/*.spec.ts
   ├─ src/graphql/types/*.type.ts
   ├─ src/graphql/inputs/*.input.ts
   ├─ src/graphql/resolvers/*.resolver.ts
   ├─ src/producers/*.producer.ts
   ├─ src/consumers/*.consumer.ts
   └─ src/mocks/*.mock.ts

4. Validar:
   ├─ npm run build
   ├─ npm run test (todos pasan)
   ├─ npm run lint
   └─ npm run format

5. Documentar:
   ├─ Agregar a IMPLEMENTATION.md
   ├─ Actualizar SPEC.md con status
   └─ Sugerir PR description

6. Output:
   └─ Código completo compilando
      └─ Tests verdes (80%+ coverage)
```

**Ejemplo de uso**:
```
Usuario: "spec-to-code todos los servicios"

Claude:
1. ✅ spec-validator aprobó
2. ✅ Generando OrderService...
3. ✅ Generando PaymentService...
4. ✅ Generando RabbitMQ consumers...
5. ✅ Generando tests...
6. ✅ npm run build: SUCCESS
7. ✅ npm run test: 64/64 passed
8. ✅ Coverage: 85%

Resultado:
- 12 archivos creados
- 50+ métodos implementados
- 64 tests verdes
- Listo para docker-compose up
```

---

## Agent 6: deployment-ready

**Propósito**: Verificar que sistema está listo para producción.

**Cuándo activar**:
- Usuario: "¿está listo para deploy?"
- Usuario: "pre-flight check"

**Flujo**:
```
Verificar checklist completo:
  ✅ Specs aprobadas
  ✅ Tests 80%+ coverage
  ✅ Build sin errores
  ✅ Linter sin warnings
  ✅ Docker compone sin errores
  ✅ Health checks pasan
  ✅ E2E tests pasan
  ✅ Documentación actualizada
  ✅ No hay console.log
  ✅ Variables de entorno configuradas
  ✅ CHANGELOG actualizado
  ✅ No hay FIXME/TODO en código crítico

Si todo ✅:
  → "Sistema listo para deploy"
  → Generar changelog
  → Sugerir git tag

Si hay ⚠️:
  → Listar blockers
  → Ofrecer fixes automáticos
  → Recomendar qué hacer primero
```

---

## Matriz de Agentes vs Tareas

| Tarea | Agent Recomendado | Comando |
|-------|------------------|---------|
| Crear especificación | spec-validator | `/spec-validator` |
| Validar spec completa | spec-validator | `/spec-validator` |
| Generar código | code-generator | `/code-generator --all` |
| Ejecutar tests | test-runner | `/test-runner` |
| Levantar Docker | docker-orchestrator | `/docker up` |
| Verificar salud | docker-orchestrator | `/docker health` |
| Implementación e2e | spec-to-code | `/spec-to-code` |
| Pre-deploy check | deployment-ready | `/pre-flight` |

---

## Notas de Implementación

- Cada agente es **independiente** pero pueden coordinarse
- Agentes retornan **resultados tipados** (JSON/Markdown)
- Agentes **no modifica** código sin aprobación (excepto format/lint)
- Agentes **logean** todas las acciones en `.claude/logs/`
- Agentes pueden **reutilizar** outputs de otros agentes

---

**Próximo**: Definir Skills en `.claude/skills.md`
