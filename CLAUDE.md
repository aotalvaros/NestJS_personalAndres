# 🤖 CLAUDE.md - Lineamientos para Claude Code en Curso NestJS

Este archivo define cómo Claude debe comportarse en este proyecto. Define agents, skills, reglas, hooks y flujos automáticos.

## 📋 Estructura del Proyecto

```
Curso_nest/
├── CLAUDE.md (este archivo - lineamientos)
├── .claude/
│   ├── agents.md (agentes personalizados)
│   ├── skills.md (habilidades/tareas)
│   ├── hooks.md (automatización)
│   └── rules.md (reglas de negocio)
├── docs/
│   ├── NestJS Data/
│   ├── Kafka, RabbitMQ, GraphQL y Testing/
│   └── 02-Example-Spec-Driven-Development/ (documentación teórica)
├── 02-examples/ (implementación práctica)
│   ├── SPEC.md
│   ├── src/
│   ├── tests/
│   ├── docker-compose.yml
│   └── README.md
└── ...
```

---

## 🎯 Objetivos del Proyecto

**Propósito**: Crear un ejemplo completo de **Spec-Driven Development** que integre:
- TypeORM (Data Layers, Entities, Relations)
- Redis Caching (Cache-Aside, Idempotencia)
- Kafka (Event Sourcing)
- RabbitMQ (Task Queue)
- GraphQL (API)
- Jest (Testing: Unit, Integration, E2E)
- Docker (Orchestration)

**Resultado esperado**: Sistema funcional, testeado, documentado, listo para producción.

---

## 🤖 Agentes Personalizados

### 1. **spec-validator** Agent
**Propósito**: Validar que las especificaciones cumplan con estándares

```
Cuando el usuario diga: "valida mi spec"
├─ Leer especificación en SPEC.md
├─ Verificar:
│  ├─ Requisitos funcionales y no-funcionales claros
│  ├─ Test cases documentados (Arrange-Act-Assert)
│  ├─ Entidades TypeORM definidas
│  ├─ Casos de error contemplados
│  └─ Flujos de integración mapeados
└─ Generar reporte de conformidad
```

### 2. **code-generator** Agent
**Propósito**: Generar código desde especificaciones

```
Cuando el usuario diga: "implementa service OrderService"
├─ Leer especificación
├─ Generar código:
│  ├─ Estructura base con mocks
│  ├─ Métodos documentados
│  ├─ Error handling
│  └─ Logging
├─ Crear tests unitarios
└─ Verificar compilación
```

### 3. **test-runner** Agent
**Propósito**: Ejecutar y reportar tests

```
Cuando el usuario diga: "ejecuta tests"
├─ npm run test (unit)
├─ npm run test:integration
├─ npm run test:e2e
├─ Generar coverage report
└─ Alertar sobre regressions
```

### 4. **docker-orchestrator** Agent
**Propósito**: Gestionar composición Docker

```
Cuando el usuario diga: "levanta servicios"
├─ docker-compose up -d
├─ Esperar healthchecks
├─ Ejecutar migraciones
├─ Verificar conectividad
└─ Retornar status
```

---

## 💡 Skills (Habilidades)

Definir mediante `/skill` command:

### skill:spec-to-code
Convertir especificación a código funcional
```
Uso: /spec-to-code OrderService
├─ Lee: 02-examples/SPEC.md
├─ Genera: src/services/order.service.ts
├─ Genera: src/services/__tests__/order.service.spec.ts
└─ Output: Código + tests listos para ejecutar
```

### skill:test-coverage
Analizar y mejorar coverage
```
Uso: /test-coverage
├─ Ejecuta tests con coverage
├─ Identifica gaps
├─ Sugiere casos faltantes
└─ Genera PR con mejoras
```

### skill:docker-health
Verificar salud de servicios Docker
```
Uso: /docker-health
├─ docker-compose ps
├─ Verifica cada healthcheck
├─ Retorna status detallado
└─ Sugiere fixes si hay problemas
```

### skill:spec-review
Revisar especificaciones antes de implementar
```
Uso: /spec-review
├─ Valida completitud
├─ Verifica claridad
├─ Sugiere mejoras
└─ Autoriza para implementar
```

---

## 🔗 Hooks (Automatización)

Ejecutarse automáticamente en eventos:

### Hook: on-commit
```
Cuando: Usuario hace git commit
Ejecutar:
├─ Validar que cambios coincidan con spec
├─ Ejecutar tests afectados
├─ Generar documentación
└─ Sugerir PR description
```

### Hook: on-test-failure
```
Cuando: Tests fallan
Ejecutar:
├─ Loguear error con stack trace
├─ Sugerir causas
├─ Ofrecer fixes automáticos
└─ Alertar si es regresión
```

### Hook: on-docker-error
```
Cuando: docker-compose error
Ejecutar:
├─ Investigar causa
├─ Sugerir solución (puertos, permisos, etc)
├─ Ofrecer cleanup automático
└─ Reintentar si es transiente
```

### Hook: on-spec-change
```
Cuando: SPEC.md es modificado
Ejecutar:
├─ Validar nueva spec
├─ Identificar cambios
├─ Flagear código que necesita update
└─ Generar PR automático si cambios son menores
```

---

## 📏 Rules (Reglas de Código)

Principios que Claude debe seguir:

### Rule: Spec-First Development
```
1. NUNCA escribir código sin especificación
2. SIEMPRE leer SPEC.md antes de implementar
3. VALIDAR que código cumple con requisitos
4. DOCUMENTAR desviaciones
```

### Rule: Test-Driven Development (TDD)
```
1. Test Ratio: 80% unit, 15% integration, 5% E2E
2. Coverage mínimo: 80%
3. ANTES de implementar feature: escribir test fallando
4. Usar pattern Arrange-Act-Assert
```

### Rule: Mocking y Aislamiento
```
1. NUNCA llamar APIs externas en tests
2. Mock: Stripe, AWS, Kafka (en test)
3. Docker real: solo para integration/e2e
4. Tests unitarios: < 100ms cada uno
```

### Rule: Documentación
```
1. Cada servicio: docstring de qué hace
2. Cada método público: parámetros y retorno documentado
3. Flujos complejos: diagram o pseudocódigo
4. SPEC.md: fuente de verdad
```

### Rule: Error Handling
```
1. Validar inputs en límite del sistema
2. Usar excepciones específicas (BadRequest, NotFound, etc)
3. Loguear errores con contexto
4. Retornar errores claros al cliente
```

### Rule: Database
```
1. Siempre usar TypeORM entities + migrations
2. Constraints en BD: NOT NULL, CHECK, UNIQUE
3. Índices en columnas de búsqueda
4. Transacciones para operaciones multi-entidad
```

### Rule: Caching
```
1. Cache-Aside pattern por defecto
2. TTL apropiado según datos
3. Invalidar caché en UPDATE
4. Loguear cache hits/misses
```

### Rule: Async Operations
```
1. Kafka: eventos inmutables (order.created, order.paid)
2. RabbitMQ: tareas con reintentos (email, notificaciones)
3. Idempotencia: siempre en operaciones críticas
4. Dead Letter Queue para mensajes fallidos
```

---

## 🔧 Configuración de Editors/IDEs

### VS Code settings.json
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### ESLint config
```javascript
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': 'error'
  }
};
```

---

## 📦 Dependencias Requeridas

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/graphql": "^12.0.0",
  "@nestjs/typeorm": "^9.0.0",
  "@nestjs/cache-manager": "^2.0.0",
  "@nestjs/microservices": "^10.0.0",
  "typeorm": "^0.3.0",
  "graphql": "^16.0.0",
  "kafkajs": "^2.2.0",
  "amqplib": "^0.10.0",
  "redis": "^4.6.0",
  "jest": "^29.0.0",
  "@nestjs/testing": "^10.0.0"
}
```

---

## 🚀 Flujo de Trabajo Típico

### 1. Nueva Feature
```
usuario: "quiero agregar feature X"
  ↓
Claude: "Voy a crear especificación"
  → spec-validator agent valida
  ↓
usuario: "spec aprobada"
  ↓
Claude: /spec-to-code implementa
  → code-generator agent genera
  ↓
/test-coverage verifica tests
  ↓
/docker-health levanta servicios
  ↓
npm run test:e2e valida flujo completo
  ↓
"Feature completa, lista para review"
```

### 2. Bug Fix
```
usuario: "bug en payment service"
  ↓
Claude: Lee spec y código
  → Identifica issue
  ↓
Escribe test que reproduce bug
  → Test falla
  ↓
Implementa fix
  → Test pasa
  ↓
/test-coverage asegura no rompe nada
  ↓
"Bug fijo, tests verdes"
```

### 3. Refactor
```
usuario: "refactor order service"
  ↓
Claude: Valida que spec permite refactor
  → Preserva contrato público
  ↓
Refactoriza preservando tests
  → Tests siguen pasando
  ↓
Actualiza documentación si cambia
  ↓
"Refactor completo, no breaking changes"
```

---

## ✅ Checklist para Validar Implementación

Antes de marcar feature como DONE:

- [ ] Especificación completada en SPEC.md
- [ ] Código implementado (services, resolvers, consumers)
- [ ] Tests unitarios (80%+ coverage)
- [ ] Tests de integración (con BD real)
- [ ] Tests E2E (flujos completos)
- [ ] Documentación actualizada
- [ ] Docker compose up -d sin errores
- [ ] Health checks pasan
- [ ] Mocks funcionan correctamente
- [ ] Logs informativos en puntos clave
- [ ] No hay console.log (usar logger)
- [ ] Código compilado sin warnings
- [ ] Linter pasando (eslint)
- [ ] Prettier formatting aplicado
- [ ] SPEC.md y código sincronizados

---

## 🛠️ Comandos Rápidos

```bash
# Setup inicial
make setup

# Desarrollo
npm run start:dev

# Testing
npm run test                  # unit
npm run test:integration     # integration
npm run test:e2e            # E2E
npm run test -- --coverage  # con coverage

# Docker
docker-compose up -d
docker-compose down

# Migraciones
npm run typeorm:migration:generate
npm run typeorm:migration:run

# Linting/Format
npm run lint
npm run format

# Build
npm run build
npm start  # producción

# Debugging
npm run debug    # con inspector
npm run test:debug
```

---

## 📚 Referencias Internas

- Documentación teórica: `docs/02-Example-Spec-Driven-Development/`
- Especificación actual: `02-examples/SPEC.md`
- Código ejemplo: `02-examples/src/`
- Tests: `02-examples/tests/`
- Configuración: `02-examples/docker-compose.yml`

---

## 🎓 Principios Clave

1. **Spec-First**: Especificación es fuente de verdad
2. **Test-Driven**: Tests antes que código
3. **Isolation**: Tests aislados de externos (mocks)
4. **Documentation**: Código auto-documentado + SPEC.md
5. **Automation**: Hooks para tareas repetitivas
6. **Clarity**: Código claro > código inteligente
7. **Pragmatism**: Mejor hecho que perfecto

---

## 📞 Contacto para Dudas

Si algo no está claro:
- Revisar documentación en `docs/`
- Leer especificación en `02-examples/SPEC.md`
- Ejecutar `make health` para verificar setup
- Revisar tests para ver patrones

---

**Última actualización**: 2026-04-30
**Versión**: 1.0
**Estado**: Spec-Driven Development activo
