# 🗺️ HOJA DE RUTA - Implementación Spec-Driven Development

**Estado**: Inicialización Completada
**Próximas Fases**: Desarrollo → Testing → Docker → Deploy

---

## 📈 Fases de Desarrollo

### Fase 1: Setup ✅ COMPLETADA

**Objetivos**:
- ✅ SPEC.md creada
- ✅ CLAUDE.md con lineamientos
- ✅ .claude/ con agents, skills, hooks, rules
- ✅ Docker compose configurado
- ✅ README.md con instrucciones

**Próximo**: Usar agents y skills para generar código

---

### Fase 2: Code Generation (IN_PROGRESS)

**Timebox**: 4 horas
**Responsable**: spec-to-code agent + developer

#### 2.1: Entidades TypeORM
```bash
/spec-to-code     # o manualmente
```

**Componentes**:
- [ ] src/entities/order.entity.ts
- [ ] src/entities/order-item.entity.ts
- [ ] src/entities/payment.entity.ts
- [ ] src/entities/audit-log.entity.ts
- [ ] src/entities/email-log.entity.ts

**Validación**:
- [ ] npm run build ✅
- [ ] Relaciones correctas (1:1, 1:N)
- [ ] Constraints en BD (NOT NULL, CHECK)
- [ ] Tipos en TypeScript

**Tiempo estimado**: 45 min

---

#### 2.2: Repositorios
```bash
/spec-to-code
```

**Componentes**:
- [ ] src/repositories/order.repository.ts
- [ ] src/repositories/payment.repository.ts

**Métodos**:
- findOrderWithRelations()
- findByCustomerId()
- findByStatus()
- updateStatus()
- getSalesStats()

**Validación**:
- [ ] npm run build ✅
- [ ] Métodos Query Builder correctos
- [ ] N+1 queries evitadas

**Tiempo estimado**: 1 hora

---

#### 2.3: Services
```bash
/spec-to-code
```

**Componentes**:
- [ ] src/services/order.service.ts
  - createOrder()
  - getOrder()
  - getCustomerOrders()
  - updateOrderStatus()
- [ ] src/services/payment.service.ts
  - processPayment() (IDEMPOTENTE con Redis)
  - getPaymentByOrderId()
- [ ] src/services/mocks/stripe.service.ts
- [ ] src/services/mocks/secrets.service.ts

**Validación**:
- [ ] npm run build ✅
- [ ] Lógica cumple RF de SPEC.md
- [ ] Error handling completo
- [ ] Logging en puntos clave

**Tiempo estimado**: 1.5 horas

---

#### 2.4: GraphQL Layer
```bash
/spec-to-code
```

**Componentes**:
- [ ] src/graphql/types/order.type.ts
- [ ] src/graphql/types/payment.type.ts
- [ ] src/graphql/inputs/create-order.input.ts
- [ ] src/graphql/inputs/process-payment.input.ts
- [ ] src/graphql/resolvers/order.resolver.ts
- [ ] src/graphql/resolvers/payment.resolver.ts
- [ ] src/graphql/guards/auth.guard.ts

**Validación**:
- [ ] npm run build ✅
- [ ] GraphQL schema generada
- [ ] Autorización en place
- [ ] Validación de inputs

**Tiempo estimado**: 1 hora

---

#### 2.5: Mensajería
```bash
/spec-to-code
```

**Componentes**:
- [ ] src/services/kafka.service.ts
- [ ] src/consumers/audit.consumer.ts
- [ ] src/services/rabbitmq.service.ts
- [ ] src/consumers/email.consumer.ts

**Validación**:
- [ ] docker-compose up funciona
- [ ] Kafka topics creados
- [ ] RabbitMQ queues creadas
- [ ] Consumidores escuchan

**Tiempo estimado**: 1 hora

---

**Total Fase 2**: ~5 horas

---

### Fase 3: Testing (TODO)

**Timebox**: 6 horas
**Responsable**: test-runner agent + developer

#### 3.1: Unit Tests
```bash
/test-coverage --improve
```

**Target**:
- [ ] 80 unit tests
- [ ] 80%+ coverage
- [ ] Todas pasan en < 2 segundos

**Componentes a testear**:
- [ ] OrderService (12 tests)
- [ ] PaymentService (15 tests) - IDEMPOTENCIA crítica
- [ ] OrderRepository (8 tests)
- [ ] PaymentRepository (8 tests)
- [ ] Validators (10 tests)
- [ ] Mocks (15 tests)
- [ ] Guards (12 tests)

**Tiempo estimado**: 2 horas

---

#### 3.2: Integration Tests
```bash
/test-coverage --improve
```

**Target**:
- [ ] 15 integration tests
- [ ] Con BD real (SQLite in-memory)
- [ ] Todas pasan en < 3 segundos

**Casos**:
- [ ] OrderService + OrderRepository (4 tests)
- [ ] PaymentService + PaymentRepository (5 tests)
- [ ] Kafka consumer + BD (3 tests)
- [ ] RabbitMQ consumer + BD (3 tests)

**Tiempo estimado**: 2 horas

---

#### 3.3: E2E Tests
```bash
/generate-e2e-test full-lifecycle
```

**Target**:
- [ ] 5 E2E tests
- [ ] Flujos completos desde GraphQL
- [ ] Todas pasan en < 10 segundos

**Casos**:
- [ ] Crear order + verificar
- [ ] Procesar pago (primer intento)
- [ ] Procesar pago (cache hit - reintentar)
- [ ] Full lifecycle (create → pay → verify)
- [ ] Error handling (payment fail)

**Tiempo estimado**: 1.5 horas

---

#### 3.4: Coverage Report
```bash
npm run test -- --coverage
```

**Validar**:
- [ ] Overall coverage: 80%+
- [ ] Services: 85%+
- [ ] Repositories: 90%+
- [ ] Resolvers: 75%+
- [ ] Generador report: IMPLEMENTATION.md

**Tiempo estimado**: 30 min

---

**Total Fase 3**: ~6 horas

---

### Fase 4: Docker & Orchestration (TODO)

**Timebox**: 3 horas
**Responsable**: docker-orchestrator agent + developer

#### 4.1: Setup Docker
```bash
docker-compose up -d
docker-compose ps
```

**Validar**:
- [ ] Todos los contenedores UP
- [ ] Healthchecks pasan
- [ ] Redes conectadas
- [ ] Volúmenes creados

**Componentes**:
- [ ] PostgreSQL 15
- [ ] Redis 7
- [ ] Kafka 7.4.0
- [ ] RabbitMQ 3.12
- [ ] NestJS app

**Tiempo estimado**: 1 hora

---

#### 4.2: Migraciones DB
```bash
npm run typeorm:migration:generate
npm run typeorm:migration:run
```

**Validar**:
- [ ] Tablas creadas
- [ ] Índices creados
- [ ] Constraints en place
- [ ] Relaciones OK

**Migraciones**:
- [ ] 01-CreateOrdersTable
- [ ] 02-CreateOrderItemsTable
- [ ] 03-CreatePaymentsTable
- [ ] 04-CreateAuditLogsTable
- [ ] 05-CreateEmailLogsTable

**Tiempo estimado**: 45 min

---

#### 4.3: Health Checks
```bash
/docker-health
curl http://localhost:3000/health
```

**Validar**:
- [ ] PostgreSQL: OK
- [ ] Redis: OK
- [ ] Kafka: OK
- [ ] RabbitMQ: OK
- [ ] App: OK

**Tiempo estimado**: 30 min

---

**Total Fase 4**: ~2.5 horas

---

### Fase 5: Documentation (TODO)

**Timebox**: 2 horas
**Responsable**: developer

#### 5.1: IMPLEMENTATION.md
- [ ] Componentes implementados
- [ ] Test results
- [ ] Coverage report
- [ ] Known issues
- [ ] Performance metrics

**Tiempo estimado**: 45 min

---

#### 5.2: Update README
- [ ] Agregar setup actualizado
- [ ] Agregar commands
- [ ] Agregar troubleshooting
- [ ] Agregar learning path

**Tiempo estimado**: 30 min

---

#### 5.3: Architecture Diagram
- [ ] Flowchart de flujos
- [ ] DB schema
- [ ] Network diagram
- [ ] Component diagram

**Tiempo estimado**: 45 min

---

**Total Fase 5**: ~2 horas

---

## 📊 Timeline Total

| Fase | Descripción | Timebox | Status |
|------|-------------|---------|--------|
| 1 | Setup & Configuration | 2h | ✅ DONE |
| 2 | Code Generation | 5h | 🔄 IN_PROGRESS |
| 3 | Testing | 6h | ⏳ TODO |
| 4 | Docker & Orchestration | 2.5h | ⏳ TODO |
| 5 | Documentation | 2h | ⏳ TODO |
| **TOTAL** | | **17.5h** | |

**Estimado**: 2-3 días si trabajas 6-8 horas/día

---

## 🎯 Key Milestones

1. **Milestone 1: Code Ready** (después de Fase 2)
   - ✅ Código compila
   - ✅ Servicios funcionales
   - ✅ APIs definidas

2. **Milestone 2: Tests Green** (después de Fase 3)
   - ✅ 80%+ coverage
   - ✅ Todos los tests pasan
   - ✅ Behaviors validados

3. **Milestone 3: Services Up** (después de Fase 4)
   - ✅ Docker compose funciona
   - ✅ Migraciones ejecutadas
   - ✅ Health checks pasan

4. **Milestone 4: Production Ready** (después de Fase 5)
   - ✅ Documentación completa
   - ✅ No hay warnings
   - ✅ Listo para deploy

---

## 🔧 Comandos Clave

```bash
# Setup
make setup              # Setup completo (automático)
make up                 # Levantar Docker

# Desarrollo
npm run start:dev      # Dev server

# Testing
npm run test                    # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e              # E2E tests
npm run test -- --coverage    # Coverage report

# Docker
docker-compose up -d           # Levantar
docker-compose down            # Apagar
docker-compose ps              # Ver estado
docker-compose logs -f app     # Ver logs

# Linting
npm run lint                    # ESLint
npm run format                  # Prettier

# Build
npm run build                   # Compilar

# Database
npm run typeorm:migration:generate
npm run typeorm:migration:run

# GraphQL
# Abre: http://localhost:3000/graphql

# Health
curl http://localhost:3000/health
```

---

## 🚀 Fase Avanzada (Después de Milestone 4)

Si quieres ir más allá:

1. **Authentication Real**
   - [ ] JWT implementation
   - [ ] Passport integration
   - [ ] Role-based access control

2. **Validación Avanzada**
   - [ ] Custom validators
   - [ ] Cross-field validation
   - [ ] Conditional validation

3. **Performance**
   - [ ] Query optimization
   - [ ] Caching strategies
   - [ ] Load testing

4. **Monitoring**
   - [ ] Prometheus metrics
   - [ ] Grafana dashboards
   - [ ] ELK logging

5. **Deployment**
   - [ ] CI/CD pipeline
   - [ ] Kubernetes
   - [ ] Terraform

---

## ❓ Puntos Críticos a Revisar

1. **Idempotencia en PaymentService**
   - ✅ Redis check antes de procesar
   - ✅ TTL de 24 horas
   - ✅ Tests que validen cache hit

2. **Order State Machine**
   - ✅ Transiciones válidas solamente
   - ✅ Tests para intentos inválidos

3. **Kafka Partitioning**
   - ✅ Events de mismo order en misma partición
   - ✅ Orden garantizado

4. **RabbitMQ Dead Letter Queue**
   - ✅ Fallidos después de 3 intentos van a DLQ
   - ✅ Tests para retry logic

5. **Test Coverage**
   - ✅ 80%+ overall
   - ✅ Services críticos 85%+
   - ✅ Edge cases cubiertos

---

## 📝 Definition of Done

Cada fase termina cuando:

### Fase 2:
- [ ] Código compila sin warnings
- [ ] npm run lint: 0 errors
- [ ] npm run format: applied
- [ ] npm run build: SUCCESS

### Fase 3:
- [ ] npm run test: todos pasan
- [ ] npm run test:integration: todos pasan
- [ ] npm run test:e2e: todos pasan
- [ ] Coverage: 80%+

### Fase 4:
- [ ] docker-compose up -d: SUCCESS
- [ ] docker-compose ps: todos UP
- [ ] /docker-health: todos OK
- [ ] Migraciones ejecutadas

### Fase 5:
- [ ] IMPLEMENTATION.md actualizado
- [ ] README.md completo
- [ ] Diagrams creados
- [ ] No hay warnings en código

---

## 🎓 Learning Outcomes

Al completar este proyecto, habrás aprendido:

✅ **Spec-Driven Development**
- Escribir especificaciones claras
- Derivar tests de specs
- Validar código contra spec

✅ **TypeORM & Databases**
- Entities con relaciones
- Custom repositories
- Migrations
- Query optimization

✅ **Redis Caching**
- Cache-Aside pattern
- Idempotency keys
- TTL management

✅ **Kafka Event Sourcing**
- Topics y partitions
- Consumers y producer groups
- Offset management

✅ **RabbitMQ Task Queue**
- Exchanges y bindings
- Dead Letter Queues
- Retry logic

✅ **GraphQL API Design**
- Types, Inputs, Resolvers
- Authorization guards
- Input validation

✅ **Testing Pyramid**
- Unit, Integration, E2E
- Mock strategies
- Coverage analysis

✅ **Docker Orchestration**
- compose.yml
- Health checks
- Service dependencies

---

## 📞 Soporte

Si te quedas atascado:

```bash
# Ver documentación
cat SPEC.md          # Requisitos
cat README.md        # Instrucciones
cat CLAUDE.md        # Lineamientos

# Validar spec
/spec-validator

# Ver logs
docker-compose logs -f app

# Pre-flight check
/deployment-ready

# Test específico
npm run test -- order.service --verbose
```

---

**Buena suerte! 🚀**

**Estimado**: 2-3 días
**Dificultad**: Intermedio-Avanzado
**Concepto**: Spec-Driven Development con Claude

---

Última actualización: 2026-04-30
