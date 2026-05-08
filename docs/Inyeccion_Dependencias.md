# Inyección de Dependencias (Dependency Injection) en NestJS

## ¿Qué es Inyección de Dependencias?

**Inyección de Dependencias** es un patrón de diseño que permite a una clase recibir sus dependencias desde el exterior en lugar de crearlas ella misma.

En lugar de:
```typescript
// ❌ MAL - La clase crea sus propias dependencias
class Usuario {
  private baseDatos = new BaseDatos(); // Crea aquí
}
```

Hacemos:
```typescript
// ✅ BIEN - Recibe la dependencia desde el exterior
class Usuario {
  constructor(private baseDatos: BaseDatos) {} // Recibe aquí
}
```

---

## Ventajas de la Inyección de Dependencias

| Ventaja | Ejemplo |
|---------|---------|
| **Desacoplamiento** | Las clases no dependen de implementaciones concretas |
| **Testing** | Fácil de testear (inyectar mocks) |
| **Reutilización** | Compartir instancias entre clases |
| **Mantenibilidad** | Cambios centralizados en un único lugar |
| **Flexibilidad** | Intercambiar implementaciones fácilmente |

---

## Ciclo de Vida de Inyección de Dependencias en NestJS

```
1️⃣ BOOTSTRAP
   └─ NestFactory.create(AppModule)

2️⃣ SCAN (Escanear módulos)
   └─ Buscar providers, controllers, imports

3️⃣ RESOLVE (Resolver dependencias)
   └─ Crear instancias de servicios
   └─ Inyectar en controladores

4️⃣ READY (Aplicación lista)
   └─ Escuchar requests
```

---

## Ejemplo 1: Inyección Básica

**Crear un servicio:**
```typescript
// usuario.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsuarioService {
  private usuarios = [
    { id: 1, nombre: 'Juan' },
    { id: 2, nombre: 'María' }
  ];

  findAll() {
    return this.usuarios;
  }

  findById(id: number) {
    return this.usuarios.find(u => u.id === id);
  }

  create(usuario: any) {
    this.usuarios.push(usuario);
    return usuario;
  }
}
```

**Inyectar en un controlador:**
```typescript
// usuario.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  // ✓ NestJS inyecta automáticamente UsuarioService
  constructor(private usuarioService: UsuarioService) {}

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usuarioService.findById(+id);
  }

  @Post()
  create(@Body() usuario: any) {
    return this.usuarioService.create(usuario);
  }
}
```

**Registrar en módulo:**
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService], // Registrar el servicio
})
export class AppModule {}
```

---

## Ejemplo 2: Múltiples Servicios Inyectados

```typescript
// email.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  send(email: string, message: string) {
    console.log(`Enviando email a ${email}: ${message}`);
    return { status: 'enviado', email };
  }
}
```

```typescript
// notificacion.service.ts
import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
export class NotificacionService {
  // ✓ Inyectar EmailService
  constructor(private emailService: EmailService) {}

  notificarUsuario(email: string, mensaje: string) {
    console.log('Notificando usuario...');
    return this.emailService.send(email, mensaje);
  }
}
```

```typescript
// usuario.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { NotificacionService } from './notificacion.service';

@Controller('usuarios')
export class UsuarioController {
  // ✓ Inyectar múltiples servicios
  constructor(
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService
  ) {}

  @Post()
  create(@Body() usuario: any) {
    const nuevoUsuario = this.usuarioService.create(usuario);
    
    // Usar ambos servicios
    this.notificacionService.notificarUsuario(
      usuario.email,
      'Bienvenido a nuestra plataforma'
    );
    
    return nuevoUsuario;
  }
}
```

```typescript
// app.module.ts
@Module({
  controllers: [UsuarioController],
  providers: [
    UsuarioService,
    EmailService,
    NotificacionService // Registrar todos
  ],
})
export class AppModule {}
```

---

## Ejemplo 3: Inyección en Servicios

Los servicios también pueden inyectar otros servicios:

```typescript
// database.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  connect() {
    console.log('Conectando a base de datos...');
    return true;
  }

  query(sql: string) {
    console.log(`Ejecutando: ${sql}`);
    return { resultado: 'OK' };
  }
}
```

```typescript
// usuario.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class UsuarioService {
  // ✓ Inyectar DatabaseService
  constructor(private database: DatabaseService) {}

  findAll() {
    return this.database.query('SELECT * FROM usuarios');
  }

  create(usuario: any) {
    return this.database.query(`INSERT INTO usuarios VALUES (...)`);
  }
}
```

---

## Ejemplo 4: Interfaces y Abstracciones

```typescript
// Crear interfaz
export interface LoggerInterface {
  log(mensaje: string): void;
}

// Implementación 1
@Injectable()
export class ConsoleLogger implements LoggerInterface {
  log(mensaje: string) {
    console.log(`[CONSOLE] ${mensaje}`);
  }
}

// Implementación 2
@Injectable()
export class FileLogger implements LoggerInterface {
  log(mensaje: string) {
    console.log(`[FILE] ${mensaje}`);
  }
}

// Usar en servicio
@Injectable()
export class UsuarioService {
  constructor(private logger: LoggerInterface) {} // Depender de interfaz

  findAll() {
    this.logger.log('Obteniendo todos los usuarios');
    return [];
  }
}
```

**Registrar en módulo con provider custom:**
```typescript
@Module({
  providers: [
    {
      provide: 'LoggerInterface', // Token
      useClass: ConsoleLogger // O FileLogger
    },
    UsuarioService
  ],
})
export class AppModule {}
```

---

## Ejemplo 5: Inyección con Tokens Personalizados

```typescript
// Crear un token único
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

// Crear la conexión
export const databaseProvider = {
  provide: DATABASE_CONNECTION,
  useValue: {
    connect: () => console.log('Conectado'),
    query: (sql: string) => console.log(`Ejecutando: ${sql}`)
  }
};

// Usar en servicio
@Injectable()
export class UsuarioService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any
  ) {}

  findAll() {
    this.db.query('SELECT * FROM usuarios');
    return [];
  }
}

// Registrar en módulo
@Module({
  providers: [
    databaseProvider,
    UsuarioService
  ],
})
export class AppModule {}
```

---

## Ejemplo 6: Factory Providers (Creadores de Instancias)

```typescript
// Crear un factory
export const configProvider = {
  provide: 'CONFIG',
  useFactory: () => {
    const config = {
      database: process.env.DATABASE_URL || 'localhost',
      port: process.env.PORT || 3000,
      apiKey: process.env.API_KEY
    };
    console.log('Configuración cargada', config);
    return config;
  }
};

// Usar en servicio
@Injectable()
export class AppService {
  constructor(@Inject('CONFIG') private config: any) {}

  getConfig() {
    return this.config;
  }
}
```

---

## Ejemplo 7: Alcances (Scopes)

NestJS soporta tres alcances de providers:

### 1. SINGLETON (Por defecto - una única instancia)
```typescript
@Injectable()
export class SingletonService {
  private id = Math.random();

  getId() {
    return this.id; // Siempre devuelve el mismo ID
  }
}
```

### 2. REQUEST (Instancia por request)
```typescript
import { Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  private id = Math.random();

  getId() {
    return this.id; // ID diferente por cada request
  }
}
```

### 3. TRANSIENT (Instancia por inyección)
```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  private id = Math.random();

  getId() {
    return this.id; // ID diferente cada vez que se inyecta
  }
}
```

**Comparación:**
```
SINGLETON:   Instancia A → Request 1, Request 2, Request 3 (MISMA instancia)
REQUEST:     Instancia A → Request 1 | Instancia B → Request 2 | Instancia C → Request 3
TRANSIENT:   Instancia A → Inyección 1 | Instancia B → Inyección 2 | Instancia C → Inyección 3
```

---

## Ejemplo 8: Dynamic Modules (Módulos Dinámicos)

```typescript
// config.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(config: any): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG',
          useValue: config
        }
      ],
      exports: ['CONFIG']
    };
  }
}

// Usar en app.module.ts
@Module({
  imports: [
    ConfigModule.register({
      database: 'postgres://localhost',
      port: 3000
    })
  ],
})
export class AppModule {}
```

---

## Ejemplo 9: Inyección Optional

```typescript
import { Optional } from '@nestjs/common';

@Injectable()
export class UsuarioService {
  constructor(
    private database: DatabaseService,
    @Optional() private logger?: LoggerService // Opcional
  ) {}

  findAll() {
    if (this.logger) {
      this.logger.log('Buscando usuarios');
    }
    return this.database.query('SELECT * FROM usuarios');
  }
}
```

---

## Ejemplo 10: Inyección en Decoradores Personalizados

```typescript
import { createParamDecorator, ExecutionContext, Inject } from '@nestjs/common';

// Decorador personalizado
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.usuario;
  }
);

// Usar en controlador
@Controller('usuarios')
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Get('perfil')
  getPerfil(@GetUser() usuario: any) {
    return { usuario };
  }
}
```

---

## Diagrama: Cómo NestJS Resuelve Dependencias

```
1. Registrar providers en @Module
   ↓
2. NestJS escanea decoradores
   ↓
3. Crea mapeo de dependencias
   ↓
4. Resuelve árbol de dependencias
   ↓
   UsuarioController
       ↓
   UsuarioService
       ├─ DatabaseService
       └─ EmailService
       
5. Crea instancias en orden correcto
   ↓
6. Inyecta en constructores
   ↓
7. Aplicación lista para recibir requests
```

---

## Archivo package.json necesario

Para usar inyección de dependencias avanzada:

```json
{
  "name": "nest-di",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.0.0"
  }
}
```

---

## Errores Comunes en Inyección de Dependencias

### ❌ Error 1: No registrar el servicio

```typescript
// ❌ MAL
@Module({
  providers: [] // Olvidó registrar UsuarioService
})
export class AppModule {}

// Error: Nest can't resolve dependencies of UsuarioController
```

### ❌ Error 2: Dependencia circular

```typescript
// ❌ MAL
// ServiceA depende de ServiceB
// ServiceB depende de ServiceA
// → Error: Circular dependency
```

### ✅ Solución:

```typescript
// ✅ BIEN - Crear servicio compartido
@Module({
  providers: [ServiceA, ServiceB, SharedService],
  exports: [ServiceA, ServiceB, SharedService]
})
export class SharedModule {}
```

---

## Resumen de Patrones

| Patrón | Uso | Ejemplo |
|--------|-----|---------|
| **Constructor Injection** | Inyectar en constructor | `constructor(private service: MyService)` |
| **Property Injection** | Inyectar en propiedad | `@Inject() service: MyService` |
| **Method Injection** | Inyectar en método | `doSomething(@Inject() service: MyService)` |
| **Factory Pattern** | Crear instancias dinámicamente | `useFactory: () => new Service()` |
| **Strategy Pattern** | Intercambiar implementaciones | `useClass: ConcreteImplementation` |

---

## Ventajas de NestJS DI vs Node.js Manual

| Aspecto | NestJS | Manual |
|--------|--------|--------|
| **Registro** | Automático con `@Injectable()` | Manual en cada archivo |
| **Resolución** | Automática por NestJS | Manual por el developer |
| **Testing** | Fácil (inyectar mocks) | Difícil (modificar archivos) |
| **Lifecycle** | Gestionado por framework | Manual |
| **Escalabilidad** | Excelente | Compleja |

---

## Resumen

| Concepto | Detalles |
|----------|----------|
| **Qué es** | Patrón que permite recibir dependencias en lugar de crearlas |
| **Ventaja** | Desacoplamiento, testing, reutilización |
| **Cómo** | Decorador `@Injectable()` en servicios, inyectar en `constructor` |
| **Registro** | En `providers` del `@Module()` |
| **Alcances** | Singleton, Request, Transient |
| **NestJS hace** | Resuelve automáticamente el árbol de dependencias |

---

## Recursos

- [Documentación oficial - Dependency Injection](https://docs.nestjs.com/fundamentals/dependency-injection)
- [Providers en NestJS](https://docs.nestjs.com/fundamentals/custom-providers)
- [Module Ref](https://docs.nestjs.com/fundamentals/module-ref)