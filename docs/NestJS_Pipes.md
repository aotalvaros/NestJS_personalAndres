# NestJS Pipes (Tuberías)

## ¿Qué es un Pipe?

Un **Pipe** es un componente de NestJS que **transforma o valida datos** antes de que lleguen a los controladores o manejadores de rutas.

Los Pipes se ejecutan **justo después** de recibir la solicitud (request) y **antes** de que el método del controlador procese los datos.

---

## Ciclo de Vida

```
Request HTTP
    ↓
Middleware
    ↓
Guards (Autenticación/Autorización)
    ↓
Pipes ← Validación/Transformación ← AQUÍ
    ↓
Controlador (Controller)
    ↓
Response HTTP
```

---

## Cuándo Usar Pipes

| Caso de Uso | Ejemplo |
|------------|---------|
| **Validación** | Verificar que un email sea válido |
| **Transformación** | Convertir un string "123" en número 123 |
| **Sanitización** | Remover caracteres peligrosos |
| **Conversión de tipos** | String a ObjectId de MongoDB |
| **Parsing** | Convertir JSON a objeto |

---

## Pipes Integrados de NestJS

| Pipe | Propósito |
|------|----------|
| `ValidationPipe` | Valida datos con decoradores |
| `ParseIntPipe` | Convierte a entero |
| `ParseFloatPipe` | Convierte a número decimal |
| `ParseBoolPipe` | Convierte a booleano |
| `ParseArrayPipe` | Convierte a array |
| `ParseUUIDPipe` | Valida UUID |
| `ParseEnumPipe` | Valida que sea un enum válido |
| `DefaultValuePipe` | Proporciona valor por defecto |

---

## Ejemplo 1: ValidationPipe (Básico)

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aplicar ValidationPipe globalmente
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3000);
}
bootstrap();
```

---

## Ejemplo 2: ParseIntPipe (Transformación)

```typescript
// usuario.controller.ts
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Controller('usuarios')
export class UsuarioController {
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    // id es un número (no string)
    console.log(typeof id); // number
    return { id, nombre: 'Juan' };
  }
}
```

**Sin ParseIntPipe:**
```
GET /usuarios/abc
// Error: abc no es un número válido
```

**Con ParseIntPipe:**
```
GET /usuarios/123
// ✓ Correcto: id = 123 (número)

GET /usuarios/abc
// ✗ Error: abc no se puede convertir a número
```

---

## Ejemplo 3: ValidationPipe con DTOs

**Instalar dependencias:**
```bash
npm install class-validator class-transformer
```

**Crear DTO (Data Transfer Object):**
```typescript
// create-usuario.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}
```

**Usar en Controlador:**
```typescript
// usuario.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CreateUsuarioDto } from './create-usuario.dto';

@Controller('usuarios')
export class UsuarioController {
  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    // Los datos ya están validados y transformados
    return {
      mensaje: 'Usuario creado',
      usuario: createUsuarioDto
    };
  }
}
```

**Prueba:**
```bash
# ✓ Válido
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "email": "juan@example.com",
    "password": "password123"
  }'

# ✗ Inválido - Email falta
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "password": "password123"
  }'
# Respuesta: Error - email es requerido
```

---

## Ejemplo 4: Custom Pipe (Crear tu propio Pipe)

```typescript
// positivo.pipe.ts
import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class PositivoPipe implements PipeTransform {
  transform(value: any) {
    const numero = parseInt(value, 10);
    
    if (isNaN(numero)) {
      throw new BadRequestException('El valor debe ser un número');
    }
    
    if (numero <= 0) {
      throw new BadRequestException('El número debe ser positivo');
    }
    
    return numero;
  }
}
```

**Usar el Custom Pipe:**
```typescript
// producto.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { PositivoPipe } from './positivo.pipe';

@Controller('productos')
export class ProductoController {
  @Get(':id')
  findById(@Param('id', PositivoPipe) id: number) {
    return { id, nombre: 'Laptop' };
  }
}
```

**Prueba:**
```bash
GET /productos/5      # ✓ OK
GET /productos/-5     # ✗ Error: número debe ser positivo
GET /productos/abc    # ✗ Error: debe ser un número
```

---

## Ejemplo 5: ParseEnumPipe

```typescript
// producto.controller.ts
import { Controller, Get, Query, ParseEnumPipe } from '@nestjs/common';

enum Orden {
  ASCENDENTE = 'asc',
  DESCENDENTE = 'desc'
}

@Controller('productos')
export class ProductoController {
  @Get()
  findAll(@Query('orden', new ParseEnumPipe(Orden)) orden: Orden) {
    // orden solo puede ser 'asc' o 'desc'
    return { orden, productos: [] };
  }
}
```

**Prueba:**
```bash
GET /productos?orden=asc   # ✓ OK
GET /productos?orden=desc  # ✓ OK
GET /productos?orden=xyz   # ✗ Error: xyz no es un valor válido
```

---

## Niveles de Aplicación de Pipes

### 1. Global (en toda la aplicación)
```typescript
app.useGlobalPipes(new ValidationPipe());
```

### 2. Controlador (en todo el controlador)
```typescript
@Controller('usuarios')
@UsePipes(ValidationPipe)
export class UsuarioController { }
```

### 3. Método (en un método específico)
```typescript
@Post()
@UsePipes(ValidationPipe)
create(@Body() data: CreateUsuarioDto) { }
```

### 4. Parámetro (en un parámetro específico)
```typescript
@Get(':id')
findById(@Param('id', ParseIntPipe) id: number) { }
```

---

## Resumen

| Aspecto | Detalles |
|--------|----------|
| **Qué es** | Componente que valida/transforma datos antes de llegar al controlador |
| **Cuándo** | Justo después de middleware, antes del controlador |
| **Para qué** | Validación, transformación, sanitización |
| **Dónde aplicar** | Global, controlador, método o parámetro |
| **Ejemplos** | ValidationPipe, ParseIntPipe, CustomPipes |

---

## Recursos

- [Documentación oficial - Pipes](https://docs.nestjs.com/pipes)
- [Validación con class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)