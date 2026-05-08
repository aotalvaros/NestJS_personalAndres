# Middleware vs Guard en NestJS

## Comparación Rápida

| Aspecto | Middleware | Guard |
|--------|-----------|-------|
| **Orden de ejecución** | Primero (inicio del ciclo) | Después de middleware, antes de pipes |
| **Propósito** | Procesamiento general | Control de acceso (auth/autorización) |
| **Contexto** | No sabe qué ruta se ejecuta | Sabe exactamente qué ruta/método se ejecuta |
| **Retorna** | `next()` para continuar | `true` (permitir) o excepción (denegar) |
| **Acceso a metadata** | No tiene acceso a decoradores | Tiene acceso a metadata vía Reflector |
| **Casos de uso** | Logging, CORS, headers, body parser | Autenticación, autorización, roles |
| **Interfaz** | `NestMiddleware` | `CanActivate` |

---

## Ciclo de Vida Detallado

```
HTTP Request
    ↓
1️⃣ MIDDLEWARE (Procesamiento general)
    ↓
2️⃣ GUARD (Control de acceso)
    ↓
3️⃣ PIPES (Validación/Transformación)
    ↓
4️⃣ CONTROLLER (Lógica de negocio)
    ↓
5️⃣ INTERCEPTOR (Modificar respuesta)
    ↓
HTTP Response
```

---

## Ejemplo 1: Middleware - Logging

```typescript
// logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ahora = new Date().toISOString();
    console.log(`[${ahora}] ${req.method} ${req.path}`);
    
    next(); // Continuar al siguiente middleware o guard
  }
}
```

**Registro en módulo:**
```typescript
// app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
```

**Resultado:**
```
[2026-04-28T10:30:45.123Z] GET /usuarios
[2026-04-28T10:30:46.456Z] POST /usuarios
[2026-04-28T10:30:47.789Z] DELETE /usuarios/1
```

---

## Ejemplo 2: Guard - Autenticación

```typescript
// auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];

    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    return true;
  }
}
```

**Usar en controlador:**
```typescript
@Controller('usuarios')
export class UsuarioController {
  @Get()
  @UseGuards(AuthGuard) // Solo proteger esta ruta
  findAll() {
    return [];
  }
}
```

---

## Diferencia Clave: Contextual vs Global

### Middleware (No contextual)
```typescript
// logger.middleware.ts
// ❌ NO sabe qué ruta/método se está ejecutando
// ❌ NO puede ver decoradores como @Roles() o @Public()
// ✓ Se ejecuta para TODAS las solicitudes

use(req: Request, res: Response, next: NextFunction) {
  console.log(req.path); // Solo sabe el path, nada más
  next();
}
```

### Guard (Contextual)
```typescript
// auth.guard.ts
// ✓ SABE exactamente qué ruta/método se está ejecutando
// ✓ Puede ver decoradores mediante this.reflector
// ✓ Puede decidir permitir/denegar ANTES de ejecutar

canActivate(context: ExecutionContext): boolean {
  const handler = context.getHandler(); // Obtener el método
  const requiredRoles = this.reflector.get<string[]>('roles', handler);
  
  // Puedo hacer decisiones basadas en metadata
  if (requiredRoles && !usuario.roles.some(r => requiredRoles.includes(r))) {
    throw new ForbiddenException();
  }
  return true;
}
```

---

## Caso Práctico: Sistema de Autenticación

### ❌ INCORRECTO: Usar Middleware para autenticación

```typescript
// auth.middleware.ts (MAL)
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['authorization'];
    
    // Problema 1: Se ejecuta para TODAS las rutas (incluso públicas)
    // Problema 2: NO sabe qué roles requiere cada ruta
    // Problema 3: No puede acceder a decoradores @Roles()
    
    if (!token) {
      return res.status(401).send('No autorizado');
    }
    
    next();
  }
}
```

### ✅ CORRECTO: Usar Guard para autenticación

```typescript
// auth.guard.ts (BIEN)
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];

    // Ventaja 1: Solo se ejecuta en rutas decoradas con @UseGuards
    // Ventaja 2: Puede acceder a decoradores @Roles()
    // Ventaja 3: Sabe exactamente qué ruta se está ejecutando

    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    return true;
  }
}

// Usar:
@Controller('admin')
export class AdminController {
  @Get()
  @UseGuards(AuthGuard) // Solo esta ruta requiere autenticación
  getAdmin() {}
}
```

---

## Caso Práctico 2: Roles y Permisos

```typescript
// Decorador de roles
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Guard que verifica roles
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // ✓ El guard PUEDE acceder a los decoradores
    // ❌ El middleware NO PODRÍA hacer esto
    
    if (!requiredRoles) {
      return true; // Si no hay roles requeridos, permitir
    }

    const request = context.switchToHttp().getRequest();
    const usuarioRoles = request.usuario?.roles;

    if (!usuarioRoles || !usuarioRoles.some(r => requiredRoles.includes(r))) {
      throw new ForbiddenException('No tienes permiso');
    }

    return true;
  }
}

// Usar en controlador:
@Controller('admin')
export class AdminController {
  @Delete('usuarios/:id')
  @UseGuards(RoleGuard)
  @Roles('admin') // El guard accede a este decorador
  deleteUsuario() {
    return { mensaje: 'Usuario eliminado' };
  }
}
```

---

## ¿Cuándo usar cada uno?

### Usa MIDDLEWARE cuando necesites:
✓ Logging de todas las solicitudes
✓ Registrar tiempo de respuesta
✓ Agregar headers globales
✓ Parsear body (JSON, form-data)
✓ CORS, session management
✓ Procesamiento que aplique a TODO

**Ejemplo:**
```typescript
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, CorsMiddleware)
      .forRoutes('*'); // Todas las rutas
  }
}
```

### Usa GUARD cuando necesites:
✓ Autenticación (verificar si está logueado)
✓ Autorización (verificar permisos/roles)
✓ Control de acceso específico por ruta
✓ Validar JWT/tokens
✓ Rate limiting por usuario
✓ Verificar IP permitidas
✓ Acceder a decoradores custom

**Ejemplo:**
```typescript
@Controller('admin')
@UseGuards(AuthGuard, RoleGuard) // Solo estas rutas
export class AdminController {
  @Delete('usuarios/:id')
  @Roles('admin')
  deleteUsuario() {}
}
```

---

## Tabla de Decisión

```
¿Es procesamiento que aplica a TODAS las solicitudes?
├─ SÍ → Usa MIDDLEWARE (logging, CORS, headers)
└─ NO → Usa GUARD (auth, autorización, roles)

¿Necesitas acceder a decoradores custom?
├─ SÍ → Usa GUARD
└─ NO → Puedes usar MIDDLEWARE

¿Quieres proteger solo algunas rutas?
├─ SÍ → Usa GUARD
└─ NO (proteger todo) → Usa MIDDLEWARE
```

---

## Resumen

| Característica | Middleware | Guard |
|---|---|---|
| **Se ejecuta primero** | ✓ Sí | ✗ No |
| **Acceso a ruta específica** | ✗ No | ✓ Sí |
| **Acceso a decoradores** | ✗ No | ✓ Sí |
| **Control de acceso** | ✗ No | ✓ Sí |
| **Logging global** | ✓ Sí | ✗ No |
| **Aplicable a ruta específica** | ✗ No (global) | ✓ Sí |

---

## Recursos

- [Documentación Middleware](https://docs.nestjs.com/middleware)
- [Documentación Guards](https://docs.nestjs.com/guards)