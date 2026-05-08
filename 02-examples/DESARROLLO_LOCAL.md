# 🚀 Desarrollo Local SIN Docker

Si no tienes Docker Desktop disponible, puedes desarrollar completamente **sin él** usando PostgreSQL y Redis locales.

## ✅ Requisitos Mínimos

- Node.js 18+
- PostgreSQL 12+ (local o remoto)
- Redis 6+ (local o remoto, OPCIONAL)

**Sin Kafka y RabbitMQ**: Los eventos no se publicarán, pero toda la lógica funciona.

---

## 🔧 Setup (5 minutos)

### Paso 1: Instalar PostgreSQL

**Windows**: Descarga desde https://www.postgresql.org/download/windows/

1. Ejecuta el instalador
2. Default user: `postgres`
3. Elige una contraseña (ej: `postgres`)
4. Puerto: **5432** (default)
5. Crea una base de datos llamada `orderdb`:

```sql
CREATE DATABASE orderdb;
```

Verificar:
```bash
psql -U postgres -d orderdb -c "SELECT 1;"
```

### Paso 2: Instalar Redis (OPCIONAL)

**Windows**: 
- Descarga desde: https://github.com/microsoftarchive/redis/releases
- O usa WSL2: `wsl apt-get install redis-server`

Si **NO instolas Redis**, la app funcionará con cache en memoria.

### Paso 3: Configurar `.env`

Copia `.env.development` a `.env`:

```bash
cp .env.development .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```bash
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=orderdb

# Redis (si lo instalaste)
REDIS_HOST=localhost
REDIS_PORT=6379

# Deshabilitar Kafka y RabbitMQ
KAFKA_ENABLED=false
RABBITMQ_ENABLED=false
```

### Paso 4: Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### Paso 5: Iniciar servidor

```bash
npm run start:dev
```

**Resultado esperado**:
```
[Nest] 12345  - 05/03/2026, 10:15:30 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 05/03/2026, 10:15:31 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 05/03/2026, 10:15:31 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 12345  - 05/03/2026, 10:15:31 AM   WARN [KafkaProducer] ⏭️  Kafka Producer deshabilitado
[Nest] 12345  - 05/03/2026, 10:15:31 AM   WARN [AuditConsumer] ⏭️  AuditConsumer deshabilitado
[Nest] 12345  - 05/03/2026, 10:15:31 AM   WARN [EmailConsumer] ⏭️  EmailConsumer deshabilitado
[Nest] 12345  - 05/03/2026, 10:15:32 AM     LOG [NestApplication] Nest application successfully started
```

✅ **¡Listo!** El servidor está corriendo en http://localhost:3000

---

## 📝 Usar la API

### Abrir GraphQL

```bash
# Opción 1: Abrir navegador manualmente
http://localhost:3000/graphql

# Opción 2: Abrir automáticamente (si tienes 'open' command)
open http://localhost:3000/graphql
```

### Crear un Pedido

```graphql
mutation {
  createOrder(input: {
    customerId: "550e8400-e29b-41d4-a716-446655440000"
    items: [
      { productId: "PROD-001", quantity: 2, unitPrice: 50 }
      { productId: "PROD-002", quantity: 1, unitPrice: 100 }
    ]
  }) {
    id
    status
    totalAmount
    items { productId quantity }
  }
}
```

**Respuesta**:
```json
{
  "data": {
    "createOrder": {
      "id": "550e8400-...",
      "status": "PENDING",
      "totalAmount": 200,
      "items": [...]
    }
  }
}
```

### Procesar Pago

```graphql
mutation {
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

---

## 🧪 Tests

```bash
# Unit tests
npm run test

# Tests en watch mode (auto-reload)
npm run test:watch

# Con coverage
npm run test:cov
```

Resultado esperado:
```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

---

## 🔍 Verificar Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres -d orderdb

# Ver tablas creadas
\dt

# Ver un pedido
SELECT * FROM "order";

# Ver pagos
SELECT * FROM payment;

# Salir
\q
```

---

## ⚠️ Limitaciones SIN Kafka y RabbitMQ

❌ **No funcionan**:
- Publicación de eventos a Kafka (order.created, order.paid)
- Auditoría automática en audit_logs
- Envío de emails a través de RabbitMQ
- Consumidores en background

✅ **SÍ funciona**:
- Todo el OrderService (crear, consultar, actualizar órdenes)
- Todo el PaymentService (procesar pagos IDEMPOTENTES)
- Caché con Redis (o en memoria si no tienes Redis)
- GraphQL API
- Tests unitarios
- Base de datos PostgreSQL

---

## 🚀 Próximos Pasos

### Si quieres agregar Kafka después

1. Instala Docker Desktop
2. En `.env`: `KAFKA_ENABLED=true`
3. Ejecuta: `docker-compose up -d kafka zookeeper`
4. Reinicia: `npm run start:dev`

### Si quieres agregar RabbitMQ después

1. Instala Docker Desktop
2. En `.env`: `RABBITMQ_ENABLED=true`
3. Ejecuta: `docker-compose up -d rabbitmq`
4. Reinicia: `npm run start:dev`

---

## 💡 Tips

- **Los logs son tu amigo**: mira la consola para entender qué está pasando
- **Reinicia después de cambiar `.env`**: los cambios en variables de entorno requieren reiniciar la app
- **Tests sin dependencias**: los tests funcionan perfectamente sin Kafka ni RabbitMQ

---

## 🔗 Conexión Remota a PostgreSQL

Si tienes PostgreSQL en otro servidor:

```bash
# .env
DB_HOST=192.168.1.100
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=orderdb
```

Lo mismo con Redis:

```bash
REDIS_HOST=192.168.1.100
REDIS_PORT=6379
```

---

## 📞 Troubleshooting

### Error: "FATAL: password authentication failed"

**Solución**:
```bash
# Verifica la contraseña en .env
# Por defecto es "postgres"

# Si olvidaste la contraseña, resetéala
psql -U postgres -h localhost

# O usa pgAdmin GUI
```

### Error: "Connection refused" en Redis

**Solución**:
- Si no necesitas Redis, ignora este error
- Si lo necesitas, instala Redis localmente o comenta la línea en `.env`

### Error: "listen EADDRINUSE :::3000"

**Solución**:
```bash
# Usa otro puerto
PORT=3001 npm run start:dev

# O mata el proceso anterior
lsof -i :3000 | tail -1 | awk '{print $2}' | xargs kill -9
```

---

## ✅ Checklist

- [ ] PostgreSQL instalado y corriendo
- [ ] `npm install --legacy-peer-deps` completado
- [ ] `.env` configurado con credenciales correctas
- [ ] `npm run build` compila sin errores
- [ ] `npm run test` pasa todos los tests
- [ ] `npm run start:dev` inicia sin errores
- [ ] GraphQL disponible en http://localhost:3000/graphql
- [ ] Puedes crear un pedido exitosamente

¡Si todo funciona, ya estás listo para desarrollar! 🎉
