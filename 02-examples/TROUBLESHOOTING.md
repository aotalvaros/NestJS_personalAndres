# 🔧 Troubleshooting Guide

## ❌ Error 1: Docker daemon not running

**Error Message:**
```
unable to get image 'postgres:15-alpine': failed to connect to the docker API 
at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct 
and if the daemon is running
```

### Solución

#### Opción A: Iniciar Docker Desktop (Recomendado)

Windows 11/10:
1. Abre el **menú Inicio**
2. Busca "Docker Desktop"
3. Haz click para iniciar
4. Espera a que vea "Docker is running" en la barra de tareas
5. Intenta nuevamente: `docker-compose up -d`

Verificar que Docker está corriendo:
```bash
docker ps
```

Debería mostrar algo como:
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

---

#### Opción B: Sin Docker (desarrollo local)

Si **no puedes** usar Docker, puedes ejecutar solo la aplicación sin los servicios. Necesitarás instalar PostgreSQL y Redis localmente.

**Paso 1: Instalar PostgreSQL**
- Descarga desde: https://www.postgresql.org/download/windows/
- Instala y crea una BD llamada `orderdb`
- Usuario: `postgres` / Contraseña: (la que configuraste)

**Paso 2: Instalar Redis**
- Descarga desde: https://github.com/microsoftarchive/redis/releases
- O usa WSL2: `wsl apt-get install redis-server`

**Paso 3: Configurar variables de entorno**

Edita `.env`:
```bash
# PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=orderdb

# Redis local
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka y RabbitMQ (los vamos a saltar por ahora)
KAFKA_BROKER=localhost:9092
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**Paso 4: Ejecutar**
```bash
npm run start:dev
```

⚠️ **Nota**: Sin Kafka y RabbitMQ:
- Los eventos no se publicarán
- Los consumers no funcionarán
- Pero OrderService y PaymentService funcionan perfectamente

---

## ❌ Error 2: `Cannot find module 'apollo-server-core'`

**Error Message:**
```
Error: Cannot find module 'apollo-server-core'
Require stack:
  - D:\Cursos\Curso_nest\02-examples\node_modules\@nestjs\apollo\dist\drivers\apollo-base.driver.js
```

### Solución

Ya está arreglado. Se agregó `.npmrc` con `legacy-peer-deps=true`

Pero si lo necesitas arreglar manualmente:

```bash
cd d:/Cursos/Curso_nest/02-examples
npm install --legacy-peer-deps
```

---

## ❌ Error 3: Puerto 3000 ya está en uso

**Error Message:**
```
Error: listen EADDRINUSE :::3000
```

### Solución

**Opción A: Cambiar puerto**

Edita `.env`:
```bash
PORT=3001
```

Luego accede a: http://localhost:3001/graphql

**Opción B: Matar el proceso (Windows)**

PowerShell (como Admin):
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

**Opción C: Matar el proceso (bash/WSL)**

```bash
lsof -i :3000 | tail -1 | awk '{print $2}' | xargs kill -9
```

---

## ❌ Error 4: PostgreSQL no responde

**Error:**
```
ERROR: can't get PostgreSQL ready: timeout waiting for the server to accept connections
```

### Solución

```bash
# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Esperar y verificar
docker-compose exec postgres pg_isready -U postgres

# Si sigue fallando, reset total
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose logs postgres
```

---

## ❌ Error 5: Redis connection refused

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

### Solución

```bash
# Reiniciar Redis
docker-compose restart redis

# Verificar
docker-compose exec redis redis-cli ping
# Respuesta esperada: PONG

# Si sigue fallando
docker-compose down -v
docker-compose up -d redis
```

---

## ❌ Error 6: Tests fallan

**Error durante `npm run test`**

### Solución

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Ejecutar tests
npm run test
```

Si sigue fallando:
```bash
# Ejecutar un test específico en verbose
npm run test order.service.spec.ts -- --verbose
```

---

## ✅ Verificar todo está funcionando

Ejecutar este checklist:

```bash
# 1. Verificar Node y npm
node --version
npm --version

# 2. Verificar Docker (si lo usas)
docker --version
docker-compose --version
docker ps

# 3. Verificar compilación
npm run build

# 4. Verificar tests
npm run test

# 5. Verificar que puedas iniciar
npm run start:dev
# Debería ver: "NestApplication successfully started"
```

---

## 🚀 Flujo de resolución recomendado

1. **¿Docker está corriendo?**
   - SÍ → Continúa al paso 2
   - NO → Inicia Docker Desktop o usa Opción B (sin Docker)

2. **¿node_modules está instalado?**
   - SÍ → Continúa al paso 3
   - NO → `npm install --legacy-peer-deps`

3. **¿Compila sin errores?**
   - SÍ → `npm run start:dev`
   - NO → `npm run lint` y revisa los errores

4. **¿El servidor inició?**
   - SÍ → Abre http://localhost:3000/graphql
   - NO → Revisa los logs de error

---

## 📞 Logs útiles

**Ver logs de la app:**
```bash
docker-compose logs -f app
```

**Ver logs de PostgreSQL:**
```bash
docker-compose logs -f postgres
```

**Ver logs de todos:**
```bash
docker-compose logs -f
```

**Ver logs con filtro:**
```bash
# Filtrar por texto
docker-compose logs app | grep "error"
docker-compose logs app | grep "order.created"
```

---

## 🔍 Debugging

**Ver variables de entorno:**
```bash
cat .env
```

**Conectar a PostgreSQL directamente:**
```bash
docker-compose exec postgres psql -U postgres -d orderdb -c "SELECT * FROM \"order\";"
```

**Conectar a Redis directamente:**
```bash
docker-compose exec redis redis-cli
> KEYS *
> GET order:xxx-xxx-xxx
```

---

## 💡 Tips

- **Siempre ejecuta comandos desde `02-examples/`**
- **Los servicios Docker tardan ~10 segundos en estar listos**
- **Si hay problemas raros, intenta reset total**: `docker-compose down -v && docker-compose up -d`
- **Los logs son tu mejor amigo**: siempre consulta `docker-compose logs` primero

---

## 📝 Checklist rápido

- [ ] Docker Desktop está corriendo (si usas Docker)
- [ ] `npm install --legacy-peer-deps` ejecutado
- [ ] `.env` está configurado con credenciales correctas
- [ ] `npm run build` compila sin errores
- [ ] `npm run test` pasa todos los tests
- [ ] Puerto 3000 no está en uso
- [ ] `npm run start:dev` inicia sin errores
- [ ] GraphQL está disponible en http://localhost:3000/graphql
- [ ] Health check pasa: `curl http://localhost:3000/health`

¡Si todo funciona, ya estás listo! 🎉
