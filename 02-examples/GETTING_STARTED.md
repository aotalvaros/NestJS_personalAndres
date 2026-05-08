# 🚀 Guía de Inicio - Orden Service

**Estado**: ✅ Completado y listo para usar sin Docker

**Última actualización**: 2026-05-03

---

## 📊 Estado del Proyecto

| Componente | Estado | Notas |
|-----------|--------|-------|
| NestJS Framework | ✅ | v10.0.0 |
| TypeORM + PostgreSQL | ✅ | Entities, Repositories, Servicios |
| GraphQL API | ✅ | Resolvers, Mutations, Queries |
| Redis Caching | ✅ | Cache-Aside pattern + Idempotencia |
| Kafka Producer | ✅ | Events: order.created, order.paid, order.shipped |
| Kafka Consumer (Audit) | ✅ | Escucha eventos y registra en audit_logs |
| RabbitMQ (Email) | ✅ | Cola de tareas, reintentos, Dead Letter Queue |
| Jest Tests | ✅ | 16 tests unitarios passing (80% coverage) |
| Docker Compose | ✅ | Opcional - para Kafka/RabbitMQ/Redis |
| Sin Docker (Dev) | ✅ | **FUNCIONA**: PostgreSQL local + Kafka/RabbitMQ deshabilitados |

---

## ⚡ Quick Start (5 minutos)

### Paso 1: Verificar Requisitos

**En Windows (PowerShell):**
```powershell
.\verify-setup.ps1
```

**En macOS/Linux (Bash):**
```bash
bash verify-setup.sh
```

### Paso 2: Instalar Dependencias

```bash
npm install --legacy-peer-deps
```

### Paso 3: Configurar Base de Datos PostgreSQL

#### Opción A: Instalación local en Windows

1. Descarga: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Password para usuario `postgres`: `postgres` (o el que prefieras)
4. Puerto: **5432**
5. Abre **pgAdmin** (viene incluido) o **psql**:

```bash
psql -U postgres

# Crear base de datos
CREATE DATABASE orderdb;

# Salir
\q
```

#### Opción B: Usando WSL2 (Windows Subsystem for Linux)

```bash
# Instalar PostgreSQL en WSL
wsl apt-get update
wsl apt-get install -y postgresql

# Iniciar servicio
wsl sudo service postgresql start

# Conectar
wsl psql -U postgres

# Crear BD
CREATE DATABASE orderdb;
```

#### Opción C: Base de datos remota

Si tienes un servidor PostgreSQL remoto, edita `.env`:
```bash
DB_HOST=192.168.1.100
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=orderdb
```

### Paso 4: Configurar Proyecto

```bash
# El archivo .env ya existe con config correcta
# Verifica que apunte a tu PostgreSQL:
cat .env

# Si tienes otra contraseña, actualiza:
# DB_PASSWORD=tu_password_aqui
```

### Paso 5: Iniciar Servidor

```bash
npm run start:dev
```

**Resultado esperado:**
```
[Nest] 12345  - 05/03/2026, 10:15:30 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 05/03/2026, 10:15:31 AM   WARN [KafkaProducer] ⏭️  Kafka Producer deshabilitado
[Nest] 12345  - 05/03/2026, 10:15:31 AM   WARN [EmailConsumer] ⏭️  EmailConsumer deshabilitado
[Nest] 12345  - 05/03/2026, 10:15:31 AM   WARN [AuditConsumer] ⏭️  AuditConsumer deshabilitado
[Nest] 12345  - 05/03/2026, 10:15:32 AM     LOG [NestApplication] Nest application successfully started
```

✅ **Servidor corriendo en:** http://localhost:3000

---

## 🧪 Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Tests en watch mode
npm run test:watch

# Con coverage
npm run test:cov
```

**Resultado esperado:**
```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

---

## 📡 Probar la API

### Abrir GraphQL

```bash
# Opción 1: Navegador
http://localhost:3000/graphql

# Opción 2: Con curl
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { order(id:\"123\") { id status } }"}'
```

### Crear un Pedido

```graphql
mutation CreateOrder {
  createOrder(input: {
    customerId: "cust-12345"
    items: [
      { productId: "PROD-001", quantity: 2, unitPrice: 50 }
      { productId: "PROD-002", quantity: 1, unitPrice: 100 }
    ]
  }) {
    id
    status
    totalAmount
    createdAt
    items {
      productId
      quantity
      unitPrice
    }
  }
}
```

**Respuesta:**
```json
{
  "data": {
    "createOrder": {
      "id": "550e8400-...",
      "status": "PENDING",
      "totalAmount": 200,
      "createdAt": "2026-05-03T10:15:32.000Z",
      "items": [
        { "productId": "PROD-001", "quantity": 2, "unitPrice": 50 },
        { "productId": "PROD-002", "quantity": 1, "unitPrice": 100 }
      ]
    }
  }
}
```

### Procesar Pago

```graphql
mutation ProcessPayment {
  processPayment(input: {
    orderId: "550e8400-..."
    idempotencyKey: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    paymentMethodId: "stripe_pm_12345"
  }) {
    paymentId
    status
    transactionId
    amount
  }
}
```

### Consultar Pedido

```graphql
query GetOrder {
  order(id: "550e8400-...") {
    id
    customerId
    status
    totalAmount
    items {
      productId
      quantity
      unitPrice
    }
    payment {
      id
      status
      amount
      transactionId
    }
  }
}
```

---

## 🏗️ Estructura del Proyecto

```
02-examples/
├── src/
│   ├── entities/              # Mapeos TypeORM
│   │   ├── order.entity.ts
│   │   ├── order-item.entity.ts
│   │   ├── payment.entity.ts
│   │   ├── email-log.entity.ts
│   │   ├── audit-log.entity.ts
│   │   └── index.ts
│   ├── repositories/          # Acceso a datos
│   │   ├── order.repository.ts
│   │   ├── payment.repository.ts
│   │   ├── email-log.repository.ts
│   │   ├── audit-log.repository.ts
│   ├── services/              # Lógica de negocio
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── kafka.producer.ts  # Publica eventos
│   │   ├── mocks/
│   │   │   └── stripe.service.ts
│   │   └── consumers/
│   │       ├── audit.consumer.ts   # Escucha Kafka
│   │       └── email.consumer.ts   # Escucha RabbitMQ
│   ├── graphql/               # API GraphQL
│   │   ├── types/
│   │   ├── inputs/
│   │   └── resolvers/
│   ├── app.module.ts          # Módulo principal
│   ├── health.controller.ts   # Health checks
│   └── main.ts                # Bootstrap
├── tests/                     # Tests E2E (futuro)
├── jest.config.js
├── tsconfig.json
├── docker-compose.yml         # Orquestación (opcional)
├── .env.development           # Config de desarrollo
├── .env                       # Config local (generado)
├── .npmrc                     # Config npm
├── verify-setup.sh            # Script de verificación
├── verify-setup.ps1           # Script para Windows
├── SPEC.md                    # Especificación
├── DESARROLLO_LOCAL.md        # Guía detallada sin Docker
├── GETTING_STARTED.md         # Este archivo
├── TROUBLESHOOTING.md         # Soluciones a problemas
└── README.md                  # Overview

```

---

## 🔧 Troubleshooting

### Error: "FATAL: password authentication failed"

```bash
# Verifica la contraseña en .env
# Por defecto es: postgres

# Si olvidaste la contraseña, resetéala:
# En Windows: Usa pgAdmin
# En Linux: sudo -u postgres psql

# Cambiar contraseña:
ALTER USER postgres WITH PASSWORD 'nueva_contraseña';
```

### Error: "Connection refused" en PostgreSQL

```bash
# Verifica que PostgreSQL está corriendo
# En Windows: Busca "Services" y verifica "postgresql-x64"
# En Linux: sudo service postgresql status

# Inicia el servicio:
# En Windows: net start postgresql-15 (o tu versión)
# En Linux: sudo service postgresql start
```

### Error: "Error: listen EADDRINUSE :::3000"

```bash
# El puerto 3000 ya está en uso

# Opción 1: Usa otro puerto
PORT=3001 npm run start:dev

# Opción 2: Mata el proceso anterior
# En Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# En Linux:
lsof -i :3000 | tail -1 | awk '{print $2}' | xargs kill -9
```

### Error: "Cannot find module '@nestjs/apollo'"

```bash
# Reinstala con legacy-peer-deps
npm install --legacy-peer-deps
npm run build
```

---

## ✨ Características

### ✅ Funcionan SIN Docker

- ✅ API REST/GraphQL
- ✅ Crear órdenes
- ✅ Procesar pagos (mocked Stripe)
- ✅ Caché con Redis (o en memoria si no lo tienes)
- ✅ Tests unitarios
- ✅ Queries y Mutations GraphQL
- ✅ Validaciones
- ✅ Health checks

### ⏭️ Requieren Docker (OPCIONAL)

- ⏭️ Kafka (events: order.created, order.paid)
- ⏭️ RabbitMQ (queue de emails)
- ⏭️ Auditoría automática en audit_logs
- ⏭️ Consumidores en background

> **Nota**: Sin Docker, Kafka y RabbitMQ se deshabilitan pero TODO FUNCIONA.

---

## 🚀 Comandos Rápidos

```bash
# Setup
npm install --legacy-peer-deps
npm run build

# Desarrollo
npm run start:dev          # Desarrollo con hot-reload
npm run start              # Producción
npm run debug              # Con inspector

# Testing
npm run test              # Unitarios
npm run test:watch        # Watch mode
npm run test:cov          # Coverage

# Utilidades
npm run lint              # ESLint
npm run format            # Prettier
npm run typeorm:migration:generate
npm run typeorm:migration:run
```

---

## 📚 Documentación

- **SPEC.md**: Especificación completa del proyecto
- **DESARROLLO_LOCAL.md**: Guía detallada para setup sin Docker
- **TROUBLESHOOTING.md**: Soluciones a problemas comunes
- **GETTING_STARTED.md**: Este archivo (inicio rápido)
- **README.md**: Overview del proyecto
- **HOJA-DE-RUTA.md**: Roadmap de implementación

---

## 🎯 Próximos Pasos

### Fase 1: Setup Local ✅
- [x] Instalar PostgreSQL
- [x] Instalar dependencias
- [x] Configurar .env
- [x] npm run build
- [x] npm run test

### Fase 2: Ejecutar Servidor (AHORA)
- [ ] npm run start:dev
- [ ] Abrir http://localhost:3000/graphql
- [ ] Crear primer pedido (mutation)
- [ ] Procesar pago (mutation)

### Fase 3: Agregar Kafka/RabbitMQ (Futuro)
- [ ] Instalar Docker Desktop
- [ ] docker-compose up -d
- [ ] Actualizar .env (KAFKA_ENABLED=true, RABBITMQ_ENABLED=true)
- [ ] Reiniciar: npm run start:dev

### Fase 4: Tests E2E (Futuro)
- [ ] npm run test:e2e
- [ ] Flujos completos de inicio a fin
- [ ] Validar eventos en Kafka

### Fase 5: Deployment (Futuro)
- [ ] Crear JWT Guard
- [ ] Implementar Auth
- [ ] Migrations TypeORM
- [ ] CI/CD pipeline
- [ ] Documentación API OpenAPI

---

## 📞 Ayuda

### Verificar Setup
```bash
# Windows (PowerShell)
.\verify-setup.ps1

# Linux/macOS (Bash)
bash verify-setup.sh
```

### Revisar Logs
```bash
# Ver logs detallados durante desarrollo
npm run start:dev

# Los logs mostrarán:
# - Conexión a PostgreSQL
# - Carga de entidades
# - Kafka/RabbitMQ habilitados o deshabilitados
# - Puerto donde escucha (3000)
```

### Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres -d orderdb

# Ver tablas
\dt

# Ver órdenes
SELECT id, customer_id, status, total_amount FROM "order" LIMIT 5;

# Ver pagos
SELECT * FROM payment;

# Ver logs de email (si RabbitMQ está activo)
SELECT * FROM email_log;

# Ver auditoría (si Kafka está activo)
SELECT * FROM audit_log;
```

---

## 💡 Tips

1. **Logs son tu amigo**: Observa la consola durante `npm run start:dev` para entender qué está pasando
2. **Reinicia después de cambiar .env**: Los cambios en variables de entorno requieren reiniciar la app
3. **GraphQL Apollo Explorer**: La interfaz en http://localhost:3000/graphql es muy útil para explorar la API
4. **Tests sin dependencias**: Los tests unitarios funcionan sin Kafka ni RabbitMQ
5. **Cache en memoria**: Si no tienes Redis, la app usa caché en memoria automáticamente

---

**¿Listo?** Ejecuta:
```bash
npm run start:dev
```

¡Y abre http://localhost:3000/graphql! 🎉
