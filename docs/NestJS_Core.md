# NestJS Core (Núcleo)

El **Core** de NestJS es el conjunto de componentes fundamentales que hacen funcionar el framework. Son las piezas internas que proporcionan la infraestructura.

---

## Módulos Principales del Core

| Módulo | Descripción |
|--------|-------------|
| `@nestjs/core` | El corazón del framework: bootstrapping, ciclo de vida |
| `@nestjs/common` | Decoradores y utilidades compartidas (@Controller, @Injectable, pipes, guards) |
| `@nestjs/platform-express` | Adaptador por defecto para Express.js |
| `@nestjs/platform-fastify` | Alternativa más rápida usando Fastify |

---

## Conceptos Core Fundamentales

### 1. Contenedor de Inyección de Dependencias

- NestJS crea un árbol de dependencias automáticamente
- Los servicios se registran como proveedores (providers)
- El contenedor resuelve las dependencias automáticamente

### 2. Reflector de Metadatos

- Almacena metadatos de decoradores (@Controller, @Get, @Post, etc.)
- Permite introspección de clases y métodos
- Facilita la inyección de dependencias

### 3. Ciclo de Vida

```
OnModuleInit → OnModuleDestroy → OnApplicationShutdown
```

---

## Cómo funciona el Core internamente

```typescript
// El contenedor crea las instancias automáticamente
const app = await NestFactory.create(AppModule);
// 1. Escanea decoradores
// 2. Registra proveedores en el contenedor
// 3. Resuelve dependencias
// 4. Monta el servidor Express/Fastify
```

---

## Diferencia: @nestjs/common vs @nestjs/core

| Paquete | Propósito |
|---------|-----------|
| `@nestjs/common` | Decoradores públicos (lo que usas en tu código) |
| `@nestjs/core` | Implementación interna (cómo funciona internamente) |

---

## Ejemplo Práctico

```typescript
// main.ts - Punto de entrada
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

```typescript
// app.module.ts - Módulo raíz
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## Recursos

- [Documentación oficial NestJS](https://docs.nestjs.com)
- [GitHub NestJS](https://github.com/nestjs/nest)