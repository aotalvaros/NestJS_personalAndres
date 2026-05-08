# NestJS Guards (Guardias)

## ¿Qué es un Guard?

Un **Guard** es un componente de NestJS que **controla si una solicitud puede acceder a un recurso**. Determina si una ruta debe ejecutarse o no basándose en condiciones específicas (autenticación, autorización, permisos, etc.).

Los Guards se ejecutan **después de Middleware y Pipes**, pero **antes de que se ejecute el manejador de ruta**.

---

## Ciclo de Vida

```
Request HTTP
    ↓
Middleware
    ↓
Guards ← Control de acceso ← AQUÍ
    ↓
Pipes (Validación)
    ↓
Controlador (Controller)
    ↓
Response HTTP
```

---

## Cuándo Usar Guards

| Caso de Uso | Ejemplo |
|------------|---------|
| **Autenticación** | Verificar que el usuario esté logueado |
| **Autorización** | Verificar que el usuario tenga permisos |
| **Control de roles** | Solo admin puede acceder |
| **Restricción de IP** | Solo usuarios de cierta IP |
| **Rate limiting** | Limitar solicitudes por usuario |
| **Verificación de token** | JWT válido |

---

## Guards Integrados de NestJS

| Guard | Propósito |
|-------|----------|
| No hay guards integrados | Los creas según necesites |
| Usas interfaces como `CanActivate` | Para crear guards personalizados |

---

## Ejemplo 1: AuthGuard Básico

```typescript
// auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['authorization'];

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    if (token !== 'Bearer secret-token-123') {
      throw new UnauthorizedException('Token inválido');
    }

    return true; // Permitir acceso
  }
}
```

**Usar en Controlador:**
```typescript
// usuario.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Controller('usuarios')
@UseGuards(AuthGuard)  // Proteger todo el controlador
export class UsuarioController {
  @Get()
  findAll() {
    return [{ id: 1, nombre: 'Juan' }];
  }
}
```

**Prueba:**
```bash
# ✗ Sin token
curl http://localhost:3000/usuarios
# Error: Token no proporcionado

# ✓ Con token válido
curl -H "Authorization: Bearer secret-token-123" http://localhost:3000/usuarios
# OK: [{ id: 1, nombre: 'Juan' }]

# ✗ Con token inválido
curl -H "Authorization: Bearer wrong-token" http://localhost:3000/usuarios
# Error: Token inválido
```

---

## Ejemplo 2: Guard en Método Específico

```typescript
// usuario.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Controller('usuarios')
export class UsuarioController {
  @Get('publico')
  getPublic() {
    return [{ id: 1, nombre: 'Juan' }];
  }

  @Get('privado')
  @UseGuards(AuthGuard)  // Solo proteger este método
  getPrivate() {
    return { mensaje: 'Datos privados' };
  }
}
```

**Prueba:**
```bash
# ✓ Sin token - ruta pública funciona
curl http://localhost:3000/usuarios/publico

# ✗ Sin token - ruta privada falla
curl http://localhost:3000/usuarios/privado
# Error: Token no proporcionado

# ✓ Con token - ruta privada funciona
curl -H "Authorization: Bearer secret-token-123" http://localhost:3000/usuarios/privado
```

---

## Ejemplo 3: RoleGuard (Autorización por Rol)

```typescript
// rol.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.get<string[]>('roles', context.getHandler());

    if (!rolesRequeridos) {
      return true; // Si no hay roles requeridos, permitir acceso
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.usuario; // Asumiendo que viene del AuthGuard

    if (!usuario || !rolesRequeridos.includes(usuario.rol)) {
      throw new ForbiddenException('No tienes permiso para acceder a este recurso');
    }

    return true;
  }
}
```

**Crear Decorador de Rol:**
```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

**Usar en Controlador:**
```typescript
// admin.controller.ts
import { Controller, Get, UseGuards, Delete } from '@nestjs/common';
import { RoleGuard } from './rol.guard';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  @Get('usuarios')
  @Roles('admin')
  getUsuarios() {
    return [{ id: 1, nombre: 'Juan' }];
  }

  @Delete('usuarios/:id')
  @Roles('admin', 'moderador')
  deleteUsuario() {
    return { mensaje: 'Usuario eliminado' };
  }

  @Get('dashboard')
  @Roles('admin')
  getDashboard() {
    return { mensaje: 'Dashboard admin' };
  }
}
```

---

## Ejemplo 4: JwtGuard (Token JWT)

```typescript
// jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const decoded = jwt.verify(token, 'secret-key');
      request.usuario = decoded; // Guardar usuario en request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
```

**Usar en Controlador:**
```typescript
// perfil.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';

@Controller('perfil')
@UseGuards(JwtGuard)
export class PerfilController {
  @Get()
  getPerfil(@Request() req) {
    return {
      mensaje: `Bienvenido ${req.usuario.nombre}`,
      usuario: req.usuario
    };
  }
}
```

**Generar token en login:**
```typescript
// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() credenciales: { usuario: string; password: string }) {
    // En realidad verificarías contra base de datos
    if (credenciales.usuario === 'juan' && credenciales.password === '123456') {
      const token = jwt.sign(
        { id: 1, nombre: 'Juan', rol: 'admin' },
        'secret-key',
        { expiresIn: '1h' }
      );
      return { token };
    }
    throw new UnauthorizedException('Credenciales inválidas');
  }
}
```

**Prueba:**
```bash
# 1. Login y obtener token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"juan","password":"123456"}' | jq -r '.token')

# 2. Usar token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/perfil
```

---

## Ejemplo 5: Custom Guard Avanzado

```typescript
// admin-only.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const usuarioId = request.usuario?.id;

    // Solo los usuarios con ID 1 son admin
    if (usuarioId !== 1) {
      throw new ForbiddenException('Solo administradores pueden acceder');
    }

    return true;
  }
}
```

---

## Niveles de Aplicación de Guards

### 1. Global (en toda la aplicación)
```typescript
// main.ts
app.useGlobalGuards(new AuthGuard());
```

### 2. Controlador (en todo el controlador)
```typescript
@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuarioController { }
```

### 3. Método (en un método específico)
```typescript
@Get()
@UseGuards(AuthGuard)
findAll() { }
```

### 4. Múltiples Guards (se ejecutan en orden)
```typescript
@UseGuards(AuthGuard, RoleGuard, AdminOnlyGuard)
@Get()
findAll() { }
```

---

## Diferencia: Guard vs Pipe vs Middleware

| Componente | Propósito | Cuándo |
|-----------|----------|--------|
| **Middleware** | Procesamiento general de request | Inicio del ciclo |
| **Guard** | Control de acceso (autenticación/autorización) | Antes de ejecutar ruta |
| **Pipe** | Validación/Transformación de datos | Antes de parámetros |
| **Interceptor** | Modificar request/response | Antes y después de ruta |

---

## Resumen

| Aspecto | Detalles |
|--------|----------|
| **Qué es** | Componente que controla si se permite acceso a una ruta |
| **Cuándo** | Después de middleware, antes de pipes |
| **Para qué** | Autenticación, autorización, control de permisos |
| **Dónde aplicar** | Global, controlador, método |
| **Interfaz** | `CanActivate` |
| **Retorna** | `true` (permitir) o lanza excepción (denegar) |

---

## Recursos

- [Documentación oficial - Guards](https://docs.nestjs.com/guards)
- [Autenticación en NestJS](https://docs.nestjs.com/security/authentication)
- [JSON Web Tokens (JWT)](https://jwt.io)