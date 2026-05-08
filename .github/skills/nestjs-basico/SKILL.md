---
name: nestjs-basico
description: Explica qué es NestJS, cómo usarlo y proporciona ejemplos básicos adaptados al proyecto actual. Útil para desarrolladores que comienzan con NestJS.
user-invocable: true
trigger: /nestjs | qué es nestjs | explicar nestjs | nestjs básico
---

# Skill: NestJS Básico

## Propósito
Explicar de forma sencilla qué es NestJS, cómo se usa, y proporcionar ejemplos prácticos adaptados al proyecto actual.

## Cuándo Usar
- El usuario pregunta qué es NestJS
- El usuario quiere entender la estructura del proyecto
- El usuario necesita ejemplos básicos de código NestJS

## Proceso

### 1. Explicación Conceptual (2-3 oraciones)
NestJS es un framework de Node.js para crear aplicaciones del lado del servidor. Utiliza TypeScript por defecto y sigue una arquitectura modular similar a Angular. Está diseñado para construir aplicaciones escalables y fáciles de mantener.

### 2. Estructura del Proyecto
Explora la estructura actual del proyecto y muéstrala de forma visual con un ejemplo básico:

```
src/
├── app.module.ts      # Módulo principal
├── app.controller.ts # Controlador (endpoints)
├── app.service.ts    # Lógica de negocio
└── main.ts           # Punto de entrada
```

### 3. Ejemplos Prácticos

**Controlador básico:**
```typescript
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('usuarios')
export class AppController {
  @Get()
  findAll() {
    return [{ id: 1, nombre: 'Juan' }];
  }
}
```

**Servicio básico:**
```typescript
// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHola() {
    return '¡Hola desde NestJS!';
  }
}
```

**Módulo:**
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 5. NestJS Core (Núcleo)

El **Core** de NestJS es el conjunto de componentes fundamentales que hacen funcionar el framework. Son las piezas internas que proporcionan la infraestructura.

#### Módulos Principales del Core

| Módulo | Descripción |
|--------|-------------|
| `@nestjs/core` | El corazón del framework: bootstrapping, ciclo de vida |
| `@nestjs/common` | Decoradores y utilidades compartidas (@Controller, @Injectable, pipes, guards) |
| `@nestjs/platform-express` | Adaptador por defecto para Express.js |
| `@nestjs/platform-fastify` | Alternativa más rápida usando Fastify |

#### Conceptos Core Fundamentales

**1. Contenedor de Inyección de Dependencias**
- NestJS crea un árbol de dependencias automáticamente
- Los servicios se registran como proveedores (providers)
- El contenedor resuelve las dependencias automáticamente

**2. Reflector de Metadatos**
- Almacena metadatos de decoradores (@Controller, @Get, @Post, etc.)
- Permite introspección de clases y métodos
- Facilita la inyección de dependencias

**3. Ciclo de Vida**
```
OnModuleInit → OnModuleDestroy → OnApplicationShutdown
```

#### Ejemplo: Cómo funciona el Core internamente

```typescript
// El contenedor crea las instancias automáticamente
const app = await NestFactory.create(AppModule);
// 1. Escanea decoradores
// 2. Registra proveedores en el contenedor
// 3. Resuelve dependencias
// 4. Monta el servidor Express/Fastify
```

#### Diferencia: @nestjs/common vs @nestjs/core

| Paquete | Propósito |
|---------|-----------|
| `@nestjs/common` | Decoradores públicos (lo que usas en tu código) |
| `@nestjs/core` | Implementación interna (cómo funciona internamente) |

### 6. Comandos Útiles
- `npm run start:dev` — Iniciar en modo desarrollo
- `npm run build` — Compilar el proyecto
- `nest g controller usuarios` — Generar controlador

## Ejemplo de Prompts para Probar
- "/nestjs ¿qué es NestJS?"
- "Explicar nestjs básico"
- "Cómo funciona un controlador en NestJS"

## Personalizaciones Relacionadas
- Crear skill para explicar módulos NestJS
- Crear skill para explicar inyección de dependencias
- Crear skill con ejemplos de REST API en NestJS