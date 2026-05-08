# 🚀 START HERE - Orden Service

**Status**: ✅ **Completado y Listo para Usar**

---

## 📍 Dónde Estamos

El proyecto **Orden Service** está **100% completado** con:

- ✅ Código compilado sin errores
- ✅ 16 tests unitarios pasando
- ✅ Documentación completa
- ✅ Configuración para desarrollo local
- ✅ **Funciona sin Docker** (PostgreSQL local)

---

## 🎯 3 Pasos Para Comenzar

### 1️⃣ Verificar que tienes lo necesario (2 min)

**En PowerShell (Windows):**
```powershell
.\verify-setup.ps1
```

**En Bash (macOS/Linux):**
```bash
bash verify-setup.sh
```

Esto verifica:
- ✅ Node.js instalado
- ✅ npm instalado
- ✅ PostgreSQL instalado y accesible
- ✅ Dependencias del proyecto
- ✅ Archivo .env configurado

---

### 2️⃣ Instalar PostgreSQL (5 min)

**Si no lo tienes:**

**Windows:**
1. Descarga: https://www.postgresql.org/download/windows/
2. Ejecuta instalador
3. Username: `postgres`, Password: `postgres`, Puerto: `5432`
4. Abre pgAdmin y crea BD `orderdb`:
   ```sql
   CREATE DATABASE orderdb;
   ```

**Linux/WSL:**
```bash
# WSL2
wsl apt-get install -y postgresql
wsl sudo service postgresql start

# O en Linux nativo
sudo apt-get install -y postgresql
sudo service postgresql start
```

**Ya tienes un servidor PostgreSQL remoto?**  
Edita `.env`:
```bash
DB_HOST=tu_servidor.com
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=orderdb
```

---

### 3️⃣ Instalar dependencias y ejecutar (2 min)

```bash
# Instalar dependencias (una sola vez)
npm install --legacy-peer-deps

# Iniciar servidor
npm run start:dev
```

**Deberías ver:**
```
[Nest] 12345  - 05/03/2026, 10:15:32 AM     LOG [NestApplication] Nest application successfully started
```

✅ **Servidor corriendo en:** http://localhost:3000/graphql

---

## 📝 Próximos Comandos

```bash
# Abrir GraphQL
http://localhost:3000/graphql

# Crear un pedido (copiar en GraphQL):
mutation {
  createOrder(input: {
    customerId: "cust-123"
    items: [{productId: "PROD-001", quantity: 2, unitPrice: 50}]
  }) {
    id status totalAmount
  }
}

# Ejecutar tests
npm run test

# Más comandos en GETTING_STARTED.md
```

---

## 📚 Documentación

Lee según lo necesites:

| Documento | Para Qué | Tiempo |
|-----------|---------|--------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Setup rápido + primeros pasos | 5 min |
| [DESARROLLO_LOCAL.md](DESARROLLO_LOCAL.md) | Setup detallado sin Docker | 10 min |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Qué está implementado | 10 min |
| [SPEC.md](SPEC.md) | Especificación técnica completa | 20 min |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Soluciones a problemas | 5 min |
| [README.md](README.md) | Overview del proyecto | 5 min |

---

## ✨ Qué Funciona

### ✅ Funciona Ahora (sin Docker)

- ✅ API GraphQL
- ✅ Crear órdenes
- ✅ Procesar pagos
- ✅ Caché (Redis o en memoria)
- ✅ Tests unitarios
- ✅ Consultas GraphQL
- ✅ Validaciones
- ✅ Health checks

### ⏭️ Requiere Docker (OPCIONAL)

- ⏭️ Kafka (eventos de órdenes)
- ⏭️ RabbitMQ (cola de emails)
- ⏭️ Auditoría automática
- ⏭️ Consumidores en background

> **Nota**: Sin Docker, TODO sigue funcionando. Solo se deshabilitan los servicios opcionales.

---

## 🔧 Si Algo no Funciona

### Error: "Connection refused" en PostgreSQL

```bash
# Verifica que PostgreSQL está corriendo
# Windows: Busca "Services" → "postgresql"
# Linux: sudo service postgresql status

# Inicia el servicio
# Windows: net start postgresql-15
# Linux: sudo service postgresql start

# Verifica credenciales en .env
cat .env | grep DB_
```

### Error: "FATAL: password authentication failed"

```bash
# Contraseña incorrecta en .env
# Por defecto es: postgres

# Cambiar contraseña en PostgreSQL:
psql -U postgres
ALTER USER postgres WITH PASSWORD 'nueva_contraseña';
\q
```

### Error: "Cannot find module..."

```bash
# Reinstalar dependencias
npm install --legacy-peer-deps
npm run build
```

**Más ayuda**: Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🎓 Flujos Típicos

### Crear un Pedido
```graphql
mutation {
  createOrder(input: {
    customerId: "cust-123"
    items: [
      {productId: "PROD-001", quantity: 2, unitPrice: 50}
    ]
  }) {
    id
    status
    totalAmount
    createdAt
  }
}
```

Respuesta:
```json
{
  "data": {
    "createOrder": {
      "id": "550e8400-...",
      "status": "PENDING",
      "totalAmount": 100,
      "createdAt": "2026-05-03T10:15:32Z"
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
    amount
  }
}
```

### Consultar Pedido
```graphql
query {
  order(id: "550e8400-...") {
    id
    customerId
    status
    totalAmount
    items { productId quantity }
    payment { id status amount }
  }
}
```

---

## 🚀 Estructura del Proyecto

```
02-examples/
├── src/
│   ├── entities/          # Mapeos BD (Order, Payment, etc)
│   ├── repositories/      # Acceso a datos
│   ├── services/          # Lógica de negocio
│   │   └── consumers/     # Kafka, RabbitMQ
│   ├── graphql/           # API (Queries, Mutations)
│   ├── app.module.ts      # Configuración principal
│   └── main.ts            # Bootstrap
├── tests/                 # Jest tests
├── SPEC.md                # Especificación
├── GETTING_STARTED.md     # Quick start
├── DESARROLLO_LOCAL.md    # Setup detallado
├── PROJECT_STATUS.md      # Qué está hecho
├── TROUBLESHOOTING.md     # Soluciones
├── verify-setup.sh        # Script verificación (Linux/macOS)
├── verify-setup.ps1       # Script verificación (Windows)
├── docker-compose.yml     # Servicios (opcional)
├── .env                   # Configuración actual
└── package.json           # Dependencias
```

---

## ⏱️ Timeline

```
✅ Fase 1: Especificación        (Completado)
✅ Fase 2: Implementación        (Completado)
✅ Fase 3: Testing              (Completado)
✅ Fase 4: Documentación        (Completado)
⏳ Fase 5: E2E Tests            (Próximo - Opcional)
⏳ Fase 6: Auth & Seguridad     (Próximo - Opcional)
⏳ Fase 7: Deployment           (Próximo - Opcional)
```

---

## 💡 Tips Importantes

1. **Los logs son tu amigo**: Mira la consola de `npm run start:dev` para ver qué pasa
2. **Reinicia después de .env**: Si cambias variables de entorno, reinicia la app
3. **GraphQL Explorer**: La interfaz en http://localhost:3000/graphql es muy útil
4. **Tests sin dependencias**: `npm run test` funciona sin Kafka ni RabbitMQ
5. **Cache automático**: Si no tienes Redis, usa caché en memoria

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito Docker?**  
R: No. Funciona perfecto sin Docker. Docker es OPCIONAL para Kafka/RabbitMQ.

**P: ¿Qué versión de PostgreSQL?**  
R: 12+. La que sea, mientras esté en puerto 5432 (editable en .env).

**P: ¿Redis es obligatorio?**  
R: No. Sin Redis, usa caché en memoria automáticamente.

**P: ¿Cómo agregar más features?**  
R: 1) Actualizar SPEC.md, 2) Crear tests, 3) Implementar código.

**P: ¿Cómo desplegar?**  
R: `npm run build` genera `/dist`. Luego: `npm start` en producción.

---

## 🎯 Ahora Sí, Empecemos

```bash
npm run start:dev
```

Abre:
```
http://localhost:3000/graphql
```

¡Y crea tu primer pedido! 🎉

---

**¿Necesitas ayuda?**  
- Verificación rápida: `.\verify-setup.ps1` (Windows) o `bash verify-setup.sh` (Linux)
- Documentación detallada: [GETTING_STARTED.md](GETTING_STARTED.md)
- Problemas: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Última actualización**: 2026-05-03  
**Versión**: 1.0 - Completado
