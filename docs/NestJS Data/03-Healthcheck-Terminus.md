# 🏥 Healthcheck con Terminus en NestJS

## Índice
1. [¿Qué es un Healthcheck?](#qué-es-un-healthcheck)
2. [¿Qué es Terminus?](#qué-es-terminus)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Healthcheck Básico](#healthcheck-básico)
5. [Indicadores de Salud](#indicadores-de-salud)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Integración con Docker y Kubernetes](#integración-con-docker-y-kubernetes)
8. [Cuándo y por qué usarlo](#cuándo-y-por-qué-usarlo)

---

## ¿Qué es un Healthcheck?

### 🔤 Definición Simple

Un **healthcheck** es un **chequeo de salud** que verifica si tu aplicación está funcionando correctamente.

Es como un **examen médico periódico**: el doctor te pregunta "¿Cómo estás?" y tú respondes "Bien, tengo presión normal, corazón fuerte, todo ok".

### 📚 Analogía: El Vigilante del Servidor

```
SIN Healthcheck:
┌──────────────┐
│ Servidor     │
│ Muere ❌     │  ← Nadie se da cuenta
│ Caído 8 hrs  │  ← Los usuarios llorar
└──────────────┘

CON Healthcheck:
┌──────────────┐
│ Servidor     │
│ GET /health  │  ← Cada 30 segundos
│ ¿Estás vivo? │  
│ Responde OK  │  ✅ Todo bien
└──────────────┘
     ↓
Si no responde
     ↓
ALERTA INMEDIATA
Sistema reinicia automáticamente
```

### 🎯 ¿Para qué sirve?

| Razón | Beneficio |
|-------|-----------|
| **Monitoreo** | Saber que la app está viva |
| **Alertas** | Notificarte si algo falla |
| **Auto-healing** | Reiniciar automáticamente si está muerta |
| **Load Balancing** | No enviar tráfico a servidores caídos |
| **Orchestración** | Kubernetes sabe si mata o reinicia el pod |
| **CI/CD** | Verificar que deploy fue exitoso |

---

## ¿Qué es Terminus?

### 🔤 Definición

**Terminus** es un módulo de NestJS que simplifica crear **endpoints de healthcheck** con múltiples indicadores de salud.

Es como tener un **panel de control médico**:
- ¿Base de datos viva?
- ¿Redis conectado?
- ¿Memoria disponible?
- ¿Disco con espacio?

### 📊 Flujo con Terminus

```
GET /health
    ↓
┌─────────────────────────┐
│ Terminus evalúa:        │
│ ✅ DB conectada?        │
│ ✅ Redis conectado?     │
│ ✅ Memoria OK?          │
│ ✅ Disco con espacio?   │
└─────────────────────────┘
    ↓
Responde JSON:
{
  "status": "up",
  "checks": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "memory": { "status": "up" }
  }
}
```

### 🎯 Health Indicators

Un **health indicator** es una prueba específica:

```
Database Indicator:
  ¿Puedo conectarme a BD?
  ¿Puedo hacer una query simple?

Redis Indicator:
  ¿Redis está respondiendo?
  ¿Puedo guardar y obtener un valor?

Memory Indicator:
  ¿Hay suficiente RAM disponible?

Disk Indicator:
  ¿Hay espacio en disco?
```

---

## Instalación y Configuración

### 📦 Instalar Terminus

```bash
npm install @nestjs/terminus
```

### 🔧 Configuración Básica en app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TerminusModule,      // Importar Terminus
    HttpModule,          // Para HTTP checks
  ],
})
export class AppModule {}
```

### 📝 Crear Health Controller

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);  // Vacío por ahora, lo llenaremos
  }
}
```

---

## Healthcheck Básico

### 🟢 Endpoint Mínimo

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService
  ) {}

  // GET /health
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
```

**Respuesta:**
```json
{
  "status": "ok",
  "info": {},
  "details": {},
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

---

## Indicadores de Salud

### 1️⃣ Database Indicator

```typescript
import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  TypeOrmHealthIndicator 
} from '@nestjs/terminus';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private typeormIndicator: TypeOrmHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Chequea que TypeORM (BD) esté conectado
      () => this.typeormIndicator.pingCheck('database'),
    ]);
  }
}
```

**Respuesta si todo está bien:**
```json
{
  "status": "ok",
  "checks": {
    "database": {
      "status": "up",
      "message": "Database connection successful"
    }
  }
}
```

**Respuesta si BD está caída:**
```json
{
  "status": "error",
  "error": {
    "database": {
      "status": "down",
      "message": "connect ECONNREFUSED"
    }
  }
}
```

### 2️⃣ Redis Indicator

```typescript
import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  RedisHealthIndicator 
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private redisIndicator: RedisHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Chequea que Redis esté conectado
      () => this.redisIndicator.pingCheck('redis', {
        host: 'localhost',
        port: 6379,
      }),
    ]);
  }
}
```

### 3️⃣ Memory Indicator

```typescript
import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  MemoryHealthIndicator 
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private memoryIndicator: MemoryHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Chequea que haya al menos 50MB de RAM disponible
      () => this.memoryIndicator.checkHeap('memory_heap', 50 * 1024 * 1024),
      
      // Chequea que haya al menos 50MB de memoria RSS (residente)
      () => this.memoryIndicator.checkRSS('memory_rss', 50 * 1024 * 1024),
    ]);
  }
}
```

### 4️⃣ Disk Indicator

```typescript
import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  DiskHealthIndicator 
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private diskIndicator: DiskHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Chequea que haya al menos 250MB de espacio en disco
      () => this.diskIndicator.checkStorage('disk', {
        thresholdPercent: 80,  // Alerta si >80% está en uso
        path: '/',             // Ruta a verificar
      }),
    ]);
  }
}
```

### 5️⃣ HTTP Indicator

```typescript
import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  HttpHealthIndicator 
} from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private httpIndicator: HttpHealthIndicator,
    private http: HttpService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Chequea que un servicio externo esté activo
      () => this.httpIndicator.pingCheck(
        'external-api',
        'https://api.ejemplo.com/health'
      ),
    ]);
  }
}
```

---

## Ejemplos Prácticos

### 📊 Ejemplo 1: Healthcheck Completo

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  RedisHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Base de datos
      () => this.db.pingCheck('database'),

      // Redis
      () => this.redis.pingCheck('redis', {
        host: 'localhost',
        port: 6379,
      }),

      // Memoria
      () => this.memory.checkHeap('memory_heap', 50 * 1024 * 1024),

      // Disco
      () => this.disk.checkStorage('disk', {
        thresholdPercent: 80,
        path: '/',
      }),
    ]);
  }

  // Endpoint alternativo para chequeos rápidos
  @Get('live')
  liveness() {
    // Solo verifica que la app responda (sin chequeos complejos)
    return { status: 'alive' };
  }

  // Endpoint para verificar que está listo para recibir tráfico
  @Get('ready')
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

**Respuesta:**
```json
{
  "status": "ok",
  "checks": {
    "database": {
      "status": "up",
      "message": "Database connection successful"
    },
    "redis": {
      "status": "up",
      "message": "ping_check"
    },
    "memory_heap": {
      "status": "up",
      "message": "Heap memory is within acceptable limits"
    },
    "disk": {
      "status": "up",
      "message": "Storage is within acceptable limits"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 📊 Ejemplo 2: Healthcheck Personalizado

```typescript
// custom-health.indicator.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class CustomHealthIndicator extends HealthIndicator {

  async checkDatabaseConnection(): Promise<HealthIndicatorResult> {
    try {
      // Tu lógica personalizada
      const startTime = Date.now();
      
      // Ejemplo: hacer una query simple
      const result = await this.checkDb();
      
      const duration = Date.now() - startTime;

      return this.getStatus('database', true, {
        message: `Connection successful (${duration}ms)`,
      });
    } catch (error) {
      throw new HealthCheckError('Database check failed', error);
    }
  }

  async checkExternalService(): Promise<HealthIndicatorResult> {
    try {
      const isAlive = await this.pingExternalService();

      return this.getStatus('external_service', isAlive);
    } catch (error) {
      throw new HealthCheckError('External service check failed', error);
    }
  }

  private async checkDb(): Promise<boolean> {
    // Aquí va tu lógica
    return true;
  }

  private async pingExternalService(): Promise<boolean> {
    // Aquí va tu lógica
    return true;
  }
}

// health.controller.ts
@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private customIndicator: CustomHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.customIndicator.checkDatabaseConnection(),
      () => this.customIndicator.checkExternalService(),
    ]);
  }
}
```

### 📊 Ejemplo 3: Health con Environment

```typescript
// health.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  RedisHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const checks = [
      () => this.db.pingCheck('database'),
    ];

    // Agregar chequeo de Redis solo si está habilitado
    if (this.config.get('REDIS_ENABLED')) {
      checks.push(
        () => this.redis.pingCheck('redis', {
          host: this.config.get('REDIS_HOST'),
          port: this.config.get('REDIS_PORT'),
        })
      );
    }

    return this.health.check(checks);
  }
}
```

---

## Integración con Docker y Kubernetes

### 🐳 Docker Healthcheck

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

# Healthcheck cada 30 segundos
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

**Verificar estado:**
```bash
docker ps
# NAMES             STATUS
# my-app            Up 2 minutes (healthy)
```

### ☸️ Kubernetes Liveness & Readiness Probes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mi-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: mi-app:latest
        ports:
        - containerPort: 3000

        # Liveness Probe: ¿Está vivo?
        # Si falla 3 veces, Kubernetes reinicia el pod
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness Probe: ¿Está listo para tráfico?
        # Si falla, Kubernetes no le envía requests
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

**¿Cómo funciona?**
```
LIVENESS PROBE (¿Vivo?):
GET /health/live cada 10 segundos
    ├─ Responde → OK, sigue viviendo
    └─ No responde (3 veces) → MUERTO → Kubernetes lo mata y reinicia

READINESS PROBE (¿Listo?):
GET /health/ready cada 5 segundos
    ├─ Responde OK → Kubernetes le envía tráfico
    └─ Responde error → Kubernetes quita del load balancer
```

### 🔧 Implementación en Controller

```typescript
@Controller('health')
export class HealthController {

  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  // Para Kubernetes Liveness: solo verifica que la app responda
  @Get('live')
  liveness() {
    return { status: 'alive' };
  }

  // Para Kubernetes Readiness: verifica dependencies críticas
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  // Endpoint completo con todos los checks
  @Get()
  @HealthCheck()
  fullHealth() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // ... más checks
    ]);
  }
}
```

---

## Cuándo y por qué usarlo

### ✅ Usa Healthcheck cuando:

| Caso | Razón |
|------|-------|
| **Producción** | Monitoreo crítico |
| **Microservicios** | Orquestación y balanceo |
| **Kubernetes** | Necesario para probes |
| **Docker** | Health checks integrados |
| **CI/CD** | Verificar deploy exitoso |
| **Load Balancing** | Eliminar servidores muertos |
| **Alertas** | Notificación de problemas |

### 🎯 Beneficios principales

| Beneficio | Impacto |
|-----------|--------|
| **Disponibilidad** | 99.9% uptime automático |
| **Recovery rápido** | Reinicio automático en minutos |
| **Monitoreo** | Saber estado real de la app |
| **Debugging** | Identificar qué falla |
| **Prevención** | Alertar antes de desastre |

### 📊 Ejemplo: Impacto Real

```
SIN Healthcheck:
- App muere las 3:00 AM
- Nadie se entera hasta las 8:00 AM
- Downtime: 5 horas
- Clientes furiosos

CON Healthcheck:
- App muere las 3:00 AM
- Kubernetes detecta en 30 segundos
- Reinicia automáticamente en 1 minuto
- Usuario no se entera
- Downtime: 1 minuto
```

### ⚠️ NO uses Healthcheck si:

```typescript
❌ Tu app es solo un script que corre una vez
❌ Es un hobby project sin usuarios
❌ No necesitas monitoreo
```

---

## 🎓 Resumen Rápido

```typescript
// 1. Instalar
npm install @nestjs/terminus

// 2. Importar en module
imports: [TerminusModule]

// 3. Inyectar en controller
constructor(private health: HealthCheckService)

// 4. Crear endpoint
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.redis.pingCheck('redis', {...}),
    () => this.memory.checkHeap('memory', 50 * 1024 * 1024),
  ]);
}

// 5. Usar en Docker
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/health

// 6. Usar en Kubernetes
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
```

### 📊 Endpoints típicos

```
GET /health           → Chequeo completo
GET /health/live      → ¿Está vivo? (Kubernetes liveness)
GET /health/ready     → ¿Está listo? (Kubernetes readiness)
```

### ✅ Responsabilidades

```
✅ Database: ¿Conectado?
✅ Redis: ¿Conectado?
✅ Memoria: ¿Suficiente?
✅ Disco: ¿Espacio?
✅ Externos: ¿Respondiendo?
```

---

## 📚 Recursos Útiles

- [Documentación NestJS Terminus](https://docs.nestjs.com/recipes/terminus)
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker Healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

**Recuerda:** Un buen healthcheck es la diferencia entre 5 horas de downtime y 1 minuto.
