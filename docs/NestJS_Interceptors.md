# NestJS Interceptors (Interceptores)

## ¿Qué es un Interceptor?

Un **Interceptor** es un componente de NestJS que puede **interceptar y modificar solicitudes (requests) y respuestas (responses)**. Se ejecuta tanto **antes** como **después** de que se ejecute el manejador de ruta.

Los Interceptors son muy útiles para:
- Transformar la respuesta
- Manejar errores
- Extender funcionalidad
- Logging de respuestas
- Compresión
- Cacheo

---

## Ciclo de Vida

```
HTTP Request
    ↓
Middleware
    ↓
Guard (Control de acceso)
    ↓
Pipes (Validación)
    ↓
Interceptor (ANTES) ← Modificar request
    ↓
CONTROLLER (Lógica de negocio)
    ↓
Interceptor (DESPUÉS) ← Modificar response ← AQUÍ
    ↓
HTTP Response
```

---

## Cuándo Usar Interceptors

| Caso de Uso | Ejemplo |
|------------|---------|
| **Transformación de respuesta** | Envolver respuesta en un objeto `{data: ..., status: ...}` |
| **Logging de respuestas** | Registrar qué devuelve cada endpoint |
| **Manejo de errores global** | Capturar errores y formatearlos |
| **Cacheo** | Almacenar en caché respuestas |
| **Timeouts** | Cancelar solicitudes que tardan demasiado |
| **Compresión** | Comprimir respuestas grandes |
| **Transformación de datos** | Convertir Dates a strings, etc. |

---
## next.handle() retorna el Observable de la respuesta. Todo lo que haces antes de return next.handle() es pre-handler. Todo lo que haces en el .pipe() es post-handler.
---

## Estructura Básica de un Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // ANTES de ejecutar el controlador
    console.log('Antes de ejecutar...');

    return next.handle().pipe(
      // DESPUÉS de ejecutar el controlador
      tap(data => {
        console.log('Después de ejecutar...');
      })
    );
  }
}
```

---

## Ejemplo 1: TransformInterceptor (Envolver Respuesta)

```typescript
// transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        statusCode: 200,
        message: 'Éxito',
        data: data,
        timestamp: new Date().toISOString()
      }))
    );
  }
}
```

**Usar en controlador:**
```typescript
// usuario.controller.ts
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';

@Controller('usuarios')
@UseInterceptors(TransformInterceptor)
export class UsuarioController {
  @Get()
  findAll() {
    return [{ id: 1, nombre: 'Juan' }];
  }
}
```

**Respuesta:**
```json
{
  "statusCode": 200,
  "message": "Éxito",
  "data": [
    { "id": 1, "nombre": "Juan" }
  ],
  "timestamp": "2026-04-28T10:30:45.123Z"
}
```

---

## Ejemplo 2: LoggingInterceptor (Registrar Solicitudes)

```typescript
// logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const inicio = Date.now();

    console.log(`[${method}] ${url}`);

    return next.handle().pipe(
      tap(data => {
        const duracion = Date.now() - inicio;
        console.log(`✓ ${method} ${url} - ${duracion}ms`);
      })
    );
  }
}
```

**Usar globalmente:**
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(3000);
}
bootstrap();
```

**Salida:**
```
[GET] /usuarios
✓ GET /usuarios - 45ms
[GET] /usuarios/1
✓ GET /usuarios/1 - 23ms
```

---

## Ejemplo 3: ErrorHandlingInterceptor (Manejo de Errores)

```typescript
// error-handling.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        // Capturar error y transformarlo
        const response = {
          statusCode: error.status || 500,
          message: error.message || 'Error interno del servidor',
          error: error.name,
          timestamp: new Date().toISOString()
        };

        console.error('Error capturado:', response);
        
        return throwError(() => new BadRequestException(response));
      })
    );
  }
}
```

**Usar globalmente:**
```typescript
app.useGlobalInterceptors(new ErrorHandlingInterceptor());
```

---

## Ejemplo 4: CachingInterceptor (Cachear Respuestas)

```typescript
// caching.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // Solo cachear GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = url;

    // Si está en caché, devolver desde caché
    if (this.cache.has(cacheKey)) {
      console.log(`📦 Desde caché: ${url}`);
      return of(this.cache.get(cacheKey));
    }

    // Si no está en caché, ejecutar y guardar
    return next.handle().pipe(
      tap(data => {
        console.log(`💾 Guardado en caché: ${url}`);
        this.cache.set(cacheKey, data);
      })
    );
  }
}
```

---

## Ejemplo 5: TimeoutInterceptor (Cancelar Solicitudes Lentas)

```typescript
// timeout.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const TIEMPO_MAXIMO_MS = 5000; // 5 segundos

    return next.handle().pipe(
      timeout(TIEMPO_MAXIMO_MS),
      catchError(error => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new RequestTimeoutException('La solicitud tardó demasiado'));
        }
        return throwError(() => error);
      })
    );
  }
}
```

---

## Ejemplo 6: ResponseDateInterceptor (Transformar Dates)

```typescript
// response-date.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseDateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transformDates(data))
    );
  }

  private transformDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Si es una Date, convertir a string ISO
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Si es un array, aplicar a cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformDates(item));
    }

    // Si es un objeto, aplicar recursivamente a cada propiedad
    if (obj === Object(obj)) {
      return Object.keys(obj).reduce((result, key) => {
        result[key] = this.transformDates(obj[key]);
        return result;
      }, {});
    }

    return obj;
  }
}
```

**Uso:**
```typescript
@Get()
@UseInterceptors(ResponseDateInterceptor)
findAll() {
  return {
    usuarios: [
      { id: 1, nombre: 'Juan', creado: new Date() }
    ]
  };
}
```

**Respuesta:**
```json
{
  "usuarios": [
    {
      "id": 1,
      "nombre": "Juan",
      "creado": "2026-04-28T10:30:45.123Z"
    }
  ]
}
```

---

## Ejemplo 7: Múltiples Interceptors

```typescript
// usuario.controller.ts
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { TransformInterceptor } from './transform.interceptor';
import { CachingInterceptor } from './caching.interceptor';

@Controller('usuarios')
@UseInterceptors(LoggingInterceptor, CachingInterceptor, TransformInterceptor)
export class UsuarioController {
  @Get()
  findAll() {
    return [{ id: 1, nombre: 'Juan' }];
  }
}
```

**Orden de ejecución:**
```
Request
  ↓
LoggingInterceptor (ANTES)
  ↓
CachingInterceptor (ANTES)
  ↓
TransformInterceptor (ANTES)
  ↓
CONTROLLER
  ↓
TransformInterceptor (DESPUÉS)
  ↓
CachingInterceptor (DESPUÉS)
  ↓
LoggingInterceptor (DESPUÉS)
  ↓
Response
```

---

## Niveles de Aplicación

### 1. Global (en toda la aplicación)
```typescript
// main.ts
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new ErrorHandlingInterceptor(),
  new TransformInterceptor()
);
```

### 2. Controlador (en todo el controlador)
```typescript
@Controller('usuarios')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class UsuarioController {}
```

### 3. Método (en un método específico)
```typescript
@Get()
@UseInterceptors(TransformInterceptor)
findAll() {}
```

---

## Interceptor Avanzado: Combinar Todo

```typescript
// advanced.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap, catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class AdvancedInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const inicio = Date.now();

    // Log inicio
    console.log(`[${method}] ${url}`);

    // Solo cachear GETs
    if (method === 'GET' && this.cache.has(url)) {
      console.log(`📦 Cache: ${url}`);
      return of(this.cache.get(url));
    }

    return next.handle().pipe(
      // Timeout de 5 segundos
      timeout(5000),

      // Log duración
      tap(data => {
        const duracion = Date.now() - inicio;
        console.log(`✓ ${method} ${url} - ${duracion}ms`);
        
        // Guardar en caché
        if (method === 'GET') {
          this.cache.set(url, data);
        }
      }),

      // Transformar respuesta
      map(data => ({
        statusCode: 200,
        message: 'Éxito',
        data: data,
        timestamp: new Date().toISOString()
      })),

      // Manejo de errores
      catchError(error => {
        console.error(`✗ ${method} ${url}:`, error.message);
        return throwError(() => new Error('Error procesando solicitud'));
      })
    );
  }
}
```

---

## Diferencia: Interceptor vs Pipe vs Guard

| Componente | Ubicación | Propósito | Retorna |
|-----------|-----------|----------|---------|
| **Middleware** | Inicio | Procesamiento general | `next()` |
| **Guard** | Antes de pipes | Control de acceso | `true` o excepción |
| **Pipe** | Antes de controlador | Validación/Transformación | Valor transformado |
| **Interceptor** | Antes y después | Modificar request/response | Observable |

---

## Resumen

| Aspecto | Detalles |
|--------|----------|
| **Qué es** | Componente que intercepta y modifica request/response |
| **Cuándo** | Antes y después de ejecutar controlador |
| **Para qué** | Transformar, loguear, cachear, manejar errores |
| **Interfaz** | `NestInterceptor` |
| **Retorna** | Observable |
| **Aplicable a** | Global, controlador, método |

---

## Recursos

- [Documentación oficial - Interceptors](https://docs.nestjs.com/interceptors)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [RxJS pipe](https://rxjs.dev/api/index/function/pipe)