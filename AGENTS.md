# 🤖 AGENTS.md - Instrucciones para Agentes IA

**Actualización**: 3 mayo 2026 | **Estado**: Spec-Driven Development Activo

---

## 🚀 Inicio Rápido para Agentes

### 1. Antes de Implementar: LEE LA ESPECIFICACIÓN
```bash
# En proyecto 02-examples:
cat SPEC.md
```
- **Fuente de verdad**: `02-examples/SPEC.md`
- **Requisitos funcionales** (RF-1, RF-2, RF-3, etc.)
- **Test cases** esperados (Arrange-Act-Assert)
- **Integraciones**: Kafka, RabbitMQ, Redis, GraphQL

---

## 📁 Estructura de Carpetas Críticas

```
Curso_nest/
├── CLAUDE.md              ← Lineamientos completos (refiere aquí para detalles)
├── 01-inicio/             ← Ejemplo inicial (NO modificar)
└── 02-examples/           ← PROYECTO ACTIVO
    ├── SPEC.md            ← Especificación (¡LEE PRIMERO!)
    ├── src/
    │   ├── app.module.ts
    │   ├── main.ts
    │   ├── entities/      ← TypeORM entities (NUNCA modificar manualmente)
    │   ├── services/      ← Lógica de negocio
    │   ├── repositories/  ← Data access
    │   ├── graphql/       ← Resolvers + inputs/types
    │   └── consumers/     ← Kafka/RabbitMQ handlers
    ├── tests/             ← Tests unitarios, integration, e2e
    ├── docker-compose.yml ← Servicios (Postgres, Redis, Kafka, RabbitMQ)
    └── package.json
```

---

## 🔑 Comandos Esenciales

| Tarea | Comando |
|-------|---------|
| **Desarrollo** | `npm run start:dev` |
| **Tests unitarios** | `npm run test` |
| **Tests integración** | `npm run test:integration` |
| **Tests E2E** | `npm run test:e2e` |
| **Coverage** | `npm run test:cov` |
| **Lint + Format** | `npm run lint && npm run format` |
| **Levantar servicios** | `docker-compose up -d` (desde `/02-examples`) |
| **Bajar servicios** | `docker-compose down` |
| **Build** | `npm run build` |

---

## ⚡ Flujo de Trabajo Típico

### Implementar Nueva Feature

```
1. Leer: SPEC.md (busca "RF-N: [nombre feature]")
2. Entender: Requisitos, validaciones, eventos
3. Escribir: Test primero (TDD)
4. Implementar: Service → Repository → Resolver → Consumer
5. Validar: npm run test (+ integration + e2e)
6. Commit: Debe pasar linter + tests
```

### Debuggear Fallo

```
1. Leer stack trace → identificar qué falló
2. Buscar: ¿Spec lo contempla?
3. Aislar: Escribir test que reproduce el bug
4. Fijar: Cambio mínimo en el servicio
5. Validar: Test pasa + no rompe otros tests
```

---

## 💡 Patrones Clave del Proyecto

### Pattern: Idempotencia en Pagos
```typescript
// RF-2: ProcessPayment debe ser exactamente-una-vez
// 1. Buscar en Redis: payment:{orderId}:{idempotencyKey}
// 2. Si cachado: retornar resultado previo
// 3. Si nuevo: procesar + guardar en Redis (TTL 24h)
// 4. Nunca llamar Stripe API dos veces para mismo idempotencyKey
```

### Pattern: Cache-Aside
```typescript
// Para órdenes y pagos:
// 1. Buscar en Redis (fast path)
// 2. Si miss: BD + guardar en Redis (TTL según datos)
// 3. Al actualizar: invalidar caché (borrar clave)
```

### Pattern: Kafka Events
```typescript
// Eventos inmutables (nunca cambiar):
// - order.created        → Se publicó nuevo pedido
// - order.paid           → Se pagó un pedido
// - order.shipped        → Se envió un pedido
// Consumidores aislados: cada uno procesa su lógica
```

### Pattern: Test Isolation
```typescript
// ❌ NO: llamar APIs externas (Stripe, etc)
// ✅ SÍ: Mockear todo externo
// ✅ SÍ: Docker real para integration (BD, Redis, Kafka)
// ✅ SÍ: Tests unitarios < 100ms cada uno
```

---

## 🎯 Requisitos No-Funcionales

| Aspecto | Requisito |
|---------|-----------|
| **Test Coverage** | ≥ 80% |
| **Test Ratio** | 80% unit, 15% integration, 5% E2E |
| **Logging** | SÍ en puntos críticos (NO console.log) |
| **Validación** | En límite del sistema (controllers/resolvers) |
| **BD** | TypeORM + migrations (nunca SQL manual) |
| **Constraints** | NOT NULL, CHECK, UNIQUE en BD |

---

## 📚 Referencias (Leer si necesitas detalles)

| Tema | Ubicación |
|------|-----------|
| **Agentes personalizados completos** | [CLAUDE.md](./CLAUDE.md#-agentes-personalizados) |
| **Todas las rules de código** | [CLAUDE.md](./CLAUDE.md#-rules-reglas-de-código) |
| **Skills disponibles** | [CLAUDE.md](./CLAUDE.md#-skills-habilidades) |
| **Teoría NestJS** | [docs/NestJS_Core.md](./docs/NestJS_Core.md) |
| **Teoría Kafka** | [docs/Kafka, RabbitMQ, GraphQL y Testing/01-Kafka-Para-Dummies.md](./docs/Kafka,%20RabbitMQ,%20GraphQL%20y%20Testing/01-Kafka-Para-Dummies.md) |
| **Teoría RabbitMQ** | [docs/Kafka, RabbitMQ, GraphQL y Testing/02-RabbitMQ-Para-Dummies.md](./docs/Kafka,%20RabbitMQ,%20GraphQL%20y%20Testing/02-RabbitMQ-Para-Dummies.md) |
| **Teoría Testing** | [docs/Kafka, RabbitMQ, GraphQL y Testing/04-Testing-Jest-Mocks.md](./docs/Kafka,%20RabbitMQ,%20GraphQL%20y%20Testing/04-Testing-Jest-Mocks.md) |
| **Especificación de requisitos** | [02-examples/SPEC.md](./02-examples/SPEC.md) |

---

## ❌ Errores Comunes (EVITA)

| Error | Problema | Solución |
|-------|----------|----------|
| Llamar APIs externas en unit tests | Tests flaky/lentos | Mockear con `jest.mock()` |
| Modificar entities manualmente | Desincronización BD | Usar migrations (`typeorm:migration:*`) |
| console.log en código | Logs no trazables | Usar `Logger` de NestJS |
| Tests sin DB real en integration | False positives | Docker + TestContainers en integration |
| Código sin especificación previa | Desviaciones de requisitos | Leer SPEC.md ANTES de codificar |
| Skippear tests flacos | Regresiones ocultas | Fijar root cause, nunca skip |

---

## 🔗 Checkpoints de Calidad

Antes de marcar DONE:

- [ ] Especificación (RF-X) completada en SPEC.md
- [ ] Test unitario escrito ANTES de código
- [ ] Tests pasan: `npm run test && npm run test:integration && npm run test:e2e`
- [ ] Coverage ≥ 80%: `npm run test:cov`
- [ ] Linter + Prettier: `npm run lint && npm run format`
- [ ] Sin console.log (usar Logger)
- [ ] Documentación actualizada si cambios en SPEC.md
- [ ] Docker servicios levantados: `docker-compose up -d`
- [ ] BD migraciones aplicadas: `npm run typeorm:migration:run`

---

## 📞 Cuando Estés Atascado

1. **Leer SPEC.md** - Verifica que el requisito está claro
2. **Leer test existente** - Busca patrón similar ya implementado
3. **Revisar CLAUDE.md** - Sección relevante de rules
4. **Ejecutar con debugger** - `npm run test:debug`
5. **Docker logs** - `docker-compose logs -f [servicio]`

---

## 🚀 Próximos Pasos para Agentes

1. **Leer SPEC.md** de `02-examples/` completamente
2. **Verificar servicios**: `docker-compose ps` en `/02-examples`
3. **Ejecutar tests**: `npm run test` para verificar baseline
4. **Explorar código**: Revisar `src/services/order.service.ts` como referencia
5. **Referer a CLAUDE.md** para detalles que no encuentres aquí

---

**Creado para**: Agentes IA trabajando en Spec-Driven Development  
**Última revisión**: 3 mayo 2026  
**Mantenedor**: Curso NestJS
