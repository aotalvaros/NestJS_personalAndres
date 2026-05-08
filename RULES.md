# 📏 RULES.md - Reglas de Desarrollo Obligatorias

**Proyecto**: Curso NestJS - Spec-Driven Development  
**Estado**: Activo | **Última actualización**: 3 mayo 2026

---

## 🔴 Rules CRÍTICAS (NO NEGOCIABLES)

### Rule #1: ESPECIFICACIÓN PRIMERO
```
NUNCA escribir código sin leer SPEC.md primero
Cada línea de código debe estar justificada en SPEC.md
Si no está en SPEC.md: NO se implementa (excepto refactor seguro)
```

### Rule #2: TEST-DRIVEN DEVELOPMENT (TDD)
```
1. Escribir test FALLANDO
2. Implementar código mínimo para pasar test
3. Refactorizar sin romper tests

Order: RED → GREEN → REFACTOR
```

### Rule #3: MOCKING OBLIGATORIO EN UNIT TESTS
```
❌ NO importar reales:
  - API Stripe
  - BD (usar mocks)
  - Kafka (en unit tests)
  - RabbitMQ (en unit tests)

✅ SÍ mockeados:
  jest.mock('../stripe.service')
  const mockStripe = Stripe as jest.Mock
```

### Rule #4: AISLAMIENTO DE TESTS
```
Unit tests:      < 100ms cada uno (sin I/O)
Integration:     < 5s cada uno (con BD real)
E2E:             < 10s cada uno (flujos completos)

Unit:Integration:E2E = 80%:15%:5%
```

### Rule #5: NUNCA MODIFICAR ENTITIES MANUALMENTE
```
❌ MALO:
  // Cambiar directamente entidad
  @Column() name: string

✅ BIEN:
  // Generar migración
  npm run typeorm:migration:generate
  npm run typeorm:migration:run
```

### Rule #6: VALIDACIÓN EN LÍMITE DEL SISTEMA
```
Validar input en:
  - Controllers (REST)
  - Resolvers (GraphQL)
  - Message handlers (Kafka/RabbitMQ)

NUNCA dentro de services (esos confían en input válido)

Usar: @IsUUID() @IsPositive() @IsNotEmpty() etc
```

### Rule #7: IDEMPOTENCIA EN OPERACIONES CRÍTICAS
```
Pagos, transferencias, reembolsos DEBEN ser idempotentes:

1. Cliente envía: idempotencyKey (UUID)
2. Servidor busca en Redis: payment:{orderId}:{idempotencyKey}
3. Si existe: retorna resultado cachado
4. Si no existe: procesa + guarda en Redis (TTL 24h)
5. Llamar a Stripe API SOLO UNA VEZ
```

### Rule #8: LOGGING NO CONSOLE.LOG
```
❌ MALO:
  console.log('Payment processed')

✅ BIEN:
  import { Logger } from '@nestjs/common'
  private logger = new Logger(OrderService.name)
  this.logger.log(`Payment processed: ${orderId}`)
  this.logger.error(`Payment failed: ${error}`)
```

### Rule #9: CACHE INVALIDATION
```
Al ACTUALIZAR datos:
  1. Actualizar BD
  2. Invalidar caché: redis.del(`order:{orderId}`)
  3. Publcar evento: kafka.emit('order.updated', ...)

SIN esto: datos stale por horas (bugs difíciles)
```

### Rule #10: TRANSACCIONES MULTI-ENTIDAD
```
Si tocas 2+ entidades atómicamente:
  await queryRunner.startTransaction()
  try {
    await queryRunner.manager.save(order)
    await queryRunner.manager.save(payment)
    await queryRunner.commitTransaction()
  } catch {
    await queryRunner.rollbackTransaction()
  }
```

---

## ⚠️ Rules IMPORTANTES (La mayoría del tiempo)

### Rule: Error Handling Específico
```typescript
❌ MALO:
  throw new Error('Payment failed')

✅ BIEN:
  throw new BadRequestException('Invalid amount')
  throw new NotFoundException('Order not found')
  throw new ConflictException('Order already paid')
  throw new InternalServerErrorException('Stripe API error')
```

### Rule: GraphQL Inputs Tipados
```typescript
// Siempre declarar input types explícitamente
@InputType()
export class CreateOrderInput {
  @Field()
  @IsUUID()
  customerId: string

  @Field(() => [OrderItemInput])
  @IsArray()
  @ValidateNested()
  items: OrderItemInput[]
}
```

### Rule: Kafka Events Inmutables
```typescript
// Nunca cambiar estructura de eventos
// Si necesitas campo nuevo: crear evento nuevo

// ✅ Correcto:
emit('order.created', { id, customerId, total })
emit('order.paid', { orderId, transactionId, amount })

// ❌ No hagas esto después (rompe consumidores):
// emit('order.created', { id, customerId, total, NEW_FIELD })
```

### Rule: Dependencies Injection
```typescript
// ✅ BIEN: Por constructor
constructor(
  private orderService: OrderService,
  private redis: Redis,
) {}

// ❌ MALO: Importing globals o singletons ad-hoc
import { globalRedis } from '@utils/redis' // NO
```

### Rule: Repository Pattern
```typescript
// Controllers → Services → Repositories → TypeORM
//
// ✅ Services usan repositories
// ❌ Services NO usan Repository directamente
// ❌ Controllers NO tocan BD directamente

this.orderRepository.findById(id)  ✅
this.repository.find({ id })       ✅
this.dataSource.query(sql)         ❌
```

---

## 📋 Checklist Antes de Commit

- [ ] Código compilado: `npm run build` (sin errores)
- [ ] Linter pasando: `npm run lint` (sin warnings)
- [ ] Prettier formateado: `npm run format`
- [ ] Tests unitarios: `npm run test` (todos verdes)
- [ ] Tests integración: `npm run test:integration` (todos verdes)
- [ ] Tests E2E: `npm run test:e2e` (todos verdes)
- [ ] Coverage ≥ 80%: `npm run test:cov`
- [ ] Sin `console.log` (usar Logger)
- [ ] Documentación actualizada (comentarios JSDoc)
- [ ] Mensaje de commit descriptivo
- [ ] No commitear archivos generados (dist/, coverage/, etc)

---

## 🎯 Reglas por Componente

### Services
- [ ] Métodos públicos documentados (JSDoc)
- [ ] Validación EN el resolver/controller, NO aquí
- [ ] Usar Logger para eventos importantes
- [ ] Retornar DTOs tipados, NO entities crudas
- [ ] Lanzar excepciones específicas

### Repositories
- [ ] Query builders tipados
- [ ] Sin lógica de negocio (eso va en Service)
- [ ] Índices en columnas de búsqueda frecuente
- [ ] Transactions si modificas múltiples entidades

### Resolvers (GraphQL)
- [ ] Decoradores: @Query, @Mutation, @Resolver
- [ ] Inputs tipados con @InputType()
- [ ] Validación de inputs (@IsUUID, @IsNotEmpty)
- [ ] Delegar lógica a services

### Controllers (REST, si hay)
- [ ] Ruta clara: @Get(':id'), @Post()
- [ ] Dto de entrada y salida tipados
- [ ] Validación con Pipes
- [ ] Códigos HTTP correctos (200, 201, 400, 404)

### Consumers (Kafka/RabbitMQ)
- [ ] @MessagePattern o @EventPattern decorador
- [ ] Payload tipado
- [ ] Manejo de errores (retry, DLQ)
- [ ] Loguear recepción + inicio + fin

---

## 🚫 PROHIBIDO

| Acción | Razón | Alternativa |
|--------|-------|-------------|
| `console.log()` | Logs no trazables | `Logger` de NestJS |
| Modificar entities manualmente | Desincronización | Migrations |
| `SELECT *` (sin límite) | Performance | Seleccionar columnas específicas |
| Queries SQL string | Inyección SQL | Query builder |
| `any` type | Type unsafety | Tipos específicos |
| Tests sin aislamiento | Flakiness | Mocks + fixtures |
| Commit sin tests verdes | Regresiones | `npm run test` first |
| Secrets en código | Seguridad | Env variables |
| Cambios no documentados | Confusión futura | Actualizar README/SPEC |

---

## ✅ REQUERIDO

| Elemento | Ubicación |
|----------|-----------|
| Especificación | `/02-examples/SPEC.md` |
| Test unitarios | `*.spec.ts` en cada carpeta |
| Migraciones | `src/migrations/` |
| Documentación | JSDoc en métodos públicos |
| Logs en puntos clave | Service methods críticas |
| Tipos de DTO | `src/dto/` o inline en resolver |
| Manejo de errores | Excepciones específicas |
| Coverage report | `npm run test:cov` |

---

## 🔄 Flujo de Cambio

```
1. Leer requirement en SPEC.md
2. Crear rama: git checkout -b feat/RF-X-nombre
3. Escribir test FALLANDO (TDD)
4. Implementar servicio mínimo
5. Escribir test integración
6. Levantar Docker: docker-compose up -d
7. Ejecutar: npm run test:integration
8. Escribir test E2E
9. Ejecutar: npm run test:e2e
10. Linter: npm run lint && npm run format
11. Commit: "feat: RF-X - Descripción breve"
12. Push: git push origin feat/RF-X-nombre
```

---

## 📞 Dudas Recurrentes

**P: ¿Puedo cambiar la entidad directamente?**  
R: NO. Genera migración: `npm run typeorm:migration:generate`

**P: ¿Debo testear APIs externas?**  
R: NO en unit. Mockea. En integration con Docker real.

**P: ¿Qué TTL debo usar en Redis?**  
R: Depende de dato: órdenes 1h, pagos 24h, sesiones 7d

**P: ¿Puedo usar console.log para debugging?**  
R: Momentáneamente sí. ANTES de commit: cambiar a Logger

**P: ¿Cuándo uso Kafka vs RabbitMQ?**  
R: Kafka = eventos inmutables. RabbitMQ = tareas con reintentos

**P: ¿Validación en Service o Resolver?**  
R: En Resolver. Service confía en input válido.

---

## 🎓 Referencia Rápida

```bash
# Desarrollo
npm run start:dev              # Watch mode
npm run start:debug           # Con debugger

# Testing
npm run test                  # Unit
npm run test:watch           # Unit con watch
npm run test:integration     # Integration
npm run test:e2e             # E2E
npm run test:cov             # Coverage

# Quality
npm run lint                  # Fix linter issues
npm run format                # Prettier format
npm run build                 # Build TypeScript

# Database
npm run typeorm:migration:generate  # Create migration
npm run typeorm:migration:run       # Run migrations
npm run typeorm:migration:revert    # Undo last

# Docker
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose logs -f        # Stream logs
```

---

**Última actualización**: 3 mayo 2026  
**Mantenedor**: Curso NestJS  
**Estado**: Spec-Driven Development Activo
