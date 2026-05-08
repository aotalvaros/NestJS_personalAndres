# Middleware y Patrón BFF en NestJS

## ¿Qué es Middleware?

**Middleware** es una función que se ejecuta **antes de llegar al controlador**. Procesa la solicitud (request) y puede:
- Modificar el request
- Acceder a la respuesta
- Llamar al siguiente middleware
- Terminar la solicitud

---

## Ciclo de Vida con Middleware

```
HTTP Request
    ↓
1️⃣ MIDDLEWARE (Procesamiento general)
    ↓
2️⃣ Guard (Control de acceso)
    ↓
3️⃣ Pipes (Validación)
    ↓
4️⃣ Controlador
    ↓
5️⃣ Response
```

---

## Estructura Básica de Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MiMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Hacer algo con el request
    console.log('Request recibido');
    
    // Llamar al siguiente middleware
    next();
  }
}
```

---

## Ejemplo 1: Middleware de Logging

```typescript
// logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, url, ip } = req;
    const inicio = Date.now();

    console.log(`[${new Date().toISOString()}] ${method} ${url} from ${ip}`);

    res.on('finish', () => {
      const duracion = Date.now() - inicio;
      const { statusCode } = res;
      console.log(`✓ ${method} ${url} - ${statusCode} (${duracion}ms)`);
    });

    next();
  }
}
```

**Registrar en módulo:**
```typescript
// app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';

@Module({
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
```

---

## Ejemplo 2: Middleware de Headers Personalizados

```typescript
// headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Agregar headers personalizados a la respuesta
    res.set('X-Powered-By', 'NestJS');
    res.set('X-Request-ID', Math.random().toString(36).substring(7));
    
    next();
  }
}
```

---

## Ejemplo 3: Middleware de CORS

```typescript
// cors.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}
```

---

## Patrón BFF (Backend For Frontend)

### ¿Qué es BFF?

**BFF** (Backend For Frontend) es un patrón arquitectónico donde cada frontend (web, móvil, desktop) tiene su propio backend especializado.

```
┌─────────────────────────────────────┐
│      Servicios Core (APIs)          │
│  (Base de datos, lógica central)    │
└──────────────┬──────────────────────┘
               │
       ┌───────┼────────┐
       │       │        │
       ↓       ↓        ↓
   ┌────┐ ┌────┐   ┌────┐
   │ BFF│ │ BFF│   │ BFF│
   │Web │ │Móvil   │Admin
   └──┬─┘ └───┬┘   └──┬─┘
      │       │       │
      ↓       ↓       ↓
   ┌────┐ ┌────┐   ┌────┐
   │Web │ │App │   │Admin
   │App │ │iOS │   │Web
   └────┘ └────┘   └────┘
```

### Ventajas del Patrón BFF

✅ Cada frontend obtiene datos optimizados para su contexto
✅ Transformaciones específicas (web ≠ móvil)
✅ Manejo independiente de versiones
✅ Mejor rendimiento (menos datos innecesarios)
✅ Facilita testing por cliente

---

## Ejemplo Práctico: BFF Web vs BFF Móvil

### Servicios Core (API Central)

```typescript
// usuario.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsuarioService {
  private usuarios = [
    {
      id: 1,
      nombre: 'Juan',
      email: 'juan@example.com',
      edad: 30,
      fotoPerfil: 'https://example.com/fotos/juan.jpg',
      telefono: '1234567890',
      direccion: '123 Main St',
      ciudad: 'Madrid',
      pais: 'España',
      verificado: true,
      ultimaConexion: new Date('2026-04-28T10:00:00'),
      suscripcion: 'premium',
      intentosFallidos: 0
    }
  ];

  findAll() {
    return this.usuarios;
  }

  findById(id: number) {
    return this.usuarios.find(u => u.id === id);
  }
}
```

### BFF Web (Aplicación Web)

```typescript
// bff-web.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('bff-web/usuarios')
export class BffWebController {
  constructor(private usuarioService: UsuarioService) {}

  @Get()
  findAll() {
    // Obtener todos los usuarios con todos los datos para web
    const usuarios = this.usuarioService.findAll();
    
    return {
      usuarios: usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        edad: u.edad,
        fotoPerfil: u.fotoPerfil,
        telefono: u.telefono,
        direccion: u.direccion,
        ciudad: u.ciudad,
        pais: u.pais,
        verificado: u.verificado,
        ultimaConexion: u.ultimaConexion,
        suscripcion: u.suscripcion
      })),
      total: usuarios.length
    };
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    // Retornar todos los detalles para web
    const usuario = this.usuarioService.findById(+id);
    
    if (!usuario) {
      return { error: 'Usuario no encontrado' };
    }

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        edad: usuario.edad,
        fotoPerfil: usuario.fotoPerfil,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        ciudad: usuario.ciudad,
        pais: usuario.pais,
        verificado: usuario.verificado,
        ultimaConexion: usuario.ultimaConexion,
        suscripcion: usuario.suscripcion
      }
    };
  }
}
```

### BFF Móvil (Aplicación Móvil)

```typescript
// bff-mobile.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('bff-mobile/usuarios')
export class BffMobileController {
  constructor(private usuarioService: UsuarioService) {}

  @Get()
  findAll() {
    // Retornar SOLO datos esenciales para móvil (ahorro de ancho de banda)
    const usuarios = this.usuarioService.findAll();
    
    return {
      usuarios: usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre,
        fotoPerfil: u.fotoPerfil, // Imagen comprimida
        verificado: u.verificado
      })),
      total: usuarios.length
    };
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    // Retornar datos optimizados para móvil
    const usuario = this.usuarioService.findById(+id);
    
    if (!usuario) {
      return { error: 'Usuario no encontrado' };
    }

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        fotoPerfil: usuario.fotoPerfil,
        verificado: usuario.verificado,
        suscripcion: usuario.suscripcion
      }
    };
  }
}
```

### Comparación de Respuestas

**GET /bff-web/usuarios/1** (Web - Datos completos)
```json
{
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@example.com",
    "edad": 30,
    "fotoPerfil": "https://example.com/fotos/juan.jpg",
    "telefono": "1234567890",
    "direccion": "123 Main St",
    "ciudad": "Madrid",
    "pais": "España",
    "verificado": true,
    "ultimaConexion": "2026-04-28T10:00:00.000Z",
    "suscripcion": "premium"
  }
}
```

**GET /bff-mobile/usuarios/1** (Móvil - Datos optimizados)
```json
{
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@example.com",
    "fotoPerfil": "https://example.com/fotos/juan.jpg",
    "verificado": true,
    "suscripcion": "premium"
  }
}
```

---

## Middleware Compartido en BFF

```typescript
// bff-auth.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BffAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const clientType = req.path.includes('/bff-web/') ? 'web' : 'mobile';
    
    // Agregar información del cliente al request
    (req as any).clientType = clientType;
    
    console.log(`Request desde ${clientType} client`);
    
    next();
  }
}
```

**Usar el middleware en módulo:**
```typescript
// app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { BffAuthMiddleware } from './bff-auth.middleware';
import { BffWebController } from './bff-web.controller';
import { BffMobileController } from './bff-mobile.controller';

@Module({
  controllers: [BffWebController, BffMobileController],
  providers: [UsuarioService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BffAuthMiddleware)
      .forRoutes('/bff-web/*', '/bff-mobile/*');
  }
}
```

---

## Ejemplo Completo: BFF con Middleware y Transformaciones

```typescript
// transformation.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TransformationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const clientType = (req as any).clientType;
    
    // Agregar información de transformación según el cliente
    (req as any).transform = {
      web: true,
      mobile: clientType === 'mobile',
      compressImages: clientType === 'mobile',
      limitFields: clientType === 'mobile'
    };
    
    next();
  }
}
```

---

## Estructura de Carpetas para BFF

```
src/
├── bff-web/
│   ├── controllers/
│   │   └── usuario.controller.ts
│   ├── services/
│   │   └── usuario.service.ts
│   └── bff-web.module.ts
│
├── bff-mobile/
│   ├── controllers/
│   │   └── usuario.controller.ts
│   ├── services/
│   │   └── usuario.service.ts
│   └── bff-mobile.module.ts
│
├── core/
│   ├── services/
│   │   └── usuario.service.ts (Servicio compartido)
│   └── core.module.ts
│
├── middleware/
│   ├── logger.middleware.ts
│   ├── auth.middleware.ts
│   └── transformation.middleware.ts
│
├── app.module.ts
└── main.ts
```

---

## Ventajas de usar BFF + Middleware

| Aspecto | Ventaja |
|--------|---------|
| **Independencia** | Cada cliente puede evolucionar por separado |
| **Rendimiento** | Web obtiene todos los datos, móvil solo lo esencial |
| **Versioning** | Diferentes versiones de API por cliente |
| **Transformación** | Datos adaptados a cada plataforma |
| **Middleware compartido** | Logging, autenticación centralizada |
| **Mantenibilidad** | Código organizado y reutilizable |

---

## Casos de Uso del Patrón BFF

✅ **E-commerce**: Web muestra más detalles de productos, móvil muestra lo esencial
✅ **Red Social**: Web muestra timeline completa, móvil muestra versión ligera
✅ **Dashboard Admin**: Datos detallados vs Dashboard de usuario con datos resumidos
✅ **Aplicación Financiera**: Web con gráficos complejos, móvil con resumen
✅ **CMS**: Backend de contenido vs Frontend de visualización

---

## Resumen

| Componente | Detalles |
|-----------|----------|
| **Middleware** | Procesa request antes de llegar al controlador |
| **BFF** | Backend especializado para cada tipo de cliente |
| **Ventaja** | Datos optimizados por plataforma |
| **Estructura** | Controladores y servicios separados por cliente |
| **Transformación** | Middleware para adaptaciones específicas |

---

## Recursos

- [Documentación Middleware - NestJS](https://docs.nestjs.com/middleware)
- [Patrón BFF - ThoughtWorks](https://www.thoughtworks.com/en-us/radar/blips/back-end-for-front-end)
- [Backend For Frontend Pattern](https://samnewman.io/patterns/architectural/bff/)