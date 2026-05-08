# 🔐 Variables de Entorno y ConfigModule

## Índice
1. [¿Qué son Variables de Entorno?](#qué-son-variables-de-entorno)
2. [Por qué usarlas](#por-qué-usarlas)
3. [ConfigModule en NestJS](#configmodule-en-nestjs)
4. [Archivo .env](#archivo-env)
5. [Accediendo Variables](#accediendo-variables)
6. [Validación de Variables](#validación-de-variables)
7. [Diferentes Entornos](#diferentes-entornos)
8. [Mejores Prácticas](#mejores-prácticas)

---

## ¿Qué son Variables de Entorno?

### 🔤 Definición Simple

**Variables de entorno** son configuraciones que tu aplicación necesita, almacenadas FUERA del código.

Son como **notas pegadas en tu oficina** que puedes cambiar sin tocar el código.

```
TU CÓDIGO:
┌─────────────────────────────────────┐
│ import { config } from '@nestjs/config' │
│                                       │
│ const dbPassword = process.env.DB_PASS│  ← Busca en variables de entorno
│                                       │
└─────────────────────────────────────┘

VARIABLES DE ENTORNO (.env):
┌─────────────────────────────────────┐
│ DB_HOST=localhost                   │
│ DB_PORT=5432                        │
│ DB_USER=postgres                    │
│ DB_PASS=mi_password_secreto         │
│ API_KEY=abc123xyz                   │
└─────────────────────────────────────┘
```

### 📚 Analogía: El Buzón

Imagina que tienes una aplicación como un **restaurante**:

**SIN Variables de Entorno (❌ MALO):**
```typescript
// app.ts - El código está lleno de secretos
const dbPassword = 'mi_password_secreto';
const apiKey = 'abc123xyz';
const emailPassword = 'password123';

console.log(dbPassword);  // Si alguien ve el código, ve todo ❌
git commit → El secreto sube a GitHub ❌
El mismo código en dev, test, producción ❌
```

**CON Variables de Entorno (✅ BUENO):**
```typescript
// app.ts - El código es limpio y seguro
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;
const emailPassword = process.env.EMAIL_PASSWORD;

// Los secretos están en .env (no sube a Git)
// Diferentes valores en cada entorno
// El código es el mismo, configurable
```

### 🎯 Ventajas principales

| Ventaja | Explicación |
|---------|-------------|
| **Seguridad** | Secretos fuera del código (no suben a GitHub) |
| **Flexibilidad** | Cambiar configuración sin tocar código |
| **Multi-entorno** | Diferentes valores en dev, test, producción |
| **CI/CD** | Deploy automático usa diferentes variables |
| **Equipo** | Cada dev usa sus propias credenciales |

---

## Por qué usarlas

### 🚫 Problema: Secretos en el código

```typescript
// ❌ PELIGROSO: Secretos hardcodeados
const DATABASE_PASSWORD = 'mi_contraseña_super_secreta_123';
const STRIPE_API_KEY = 'sk_live_51234567890';
const JWT_SECRET = 'mi_clave_jwt_secreta';

git push → GitHub público ❌
Todos ven tus secretos ❌
Alguien clona el repo y accede a tu BD ❌
Tu app de Stripe es hackeada ❌
```

### ✅ Solución: Variables de Entorno

```typescript
// ✅ SEGURO: Variables en .env
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

git push → No incluye .env ✅
Los secretos están solo en servidores ✅
Cada dev usa sus credenciales ✅
```

### 🌍 Ejemplo: Mismo código, diferentes entornos

```
TU CÓDIGO (igual en todos lados):
┌──────────────────────────────────┐
│ const host = process.env.DB_HOST  │
│ const port = process.env.DB_PORT  │
└──────────────────────────────────┘

.env.development (tu máquina):
┌──────────────────────────────────┐
│ DB_HOST=localhost                 │
│ DB_PORT=5432                      │
└──────────────────────────────────┘

.env.production (servidor):
┌──────────────────────────────────┐
│ DB_HOST=prod-db.company.com       │
│ DB_PORT=5432                      │
└──────────────────────────────────┘

.env.test (tests):
┌──────────────────────────────────┐
│ DB_HOST=test-db.local             │
│ DB_PORT=5433                      │
└──────────────────────────────────┘

Same código, 3 configuraciones diferentes ✅
```

---

## ConfigModule en NestJS

### 📦 Instalación

```bash
npm install @nestjs/config
```

### 🔧 Configuración Básica

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),  // Lee .env y lo carga automáticamente
  ],
})
export class AppModule {}
```

Eso es TODO lo que necesitas. Ahora tu app leerá el archivo `.env` automáticamente.

### 🚀 Configuración Avanzada

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',          // Dónde está el archivo
      isGlobal: true,                // Disponible en toda la app
      cache: true,                   // Cachea valores (más rápido)
      ignoreEnvFile: process.env.NODE_ENV === 'production',  // En prod, usa vars del sistema
      expandVariables: true,         // Permite usar ${OTRA_VARIABLE}
    }),
  ],
})
export class AppModule {}
```

---

## Archivo .env

### 📝 ¿Qué es y dónde va?

```
tu-proyecto/
├── src/
├── .env                 ← AQUÍ va (raíz del proyecto)
├── .env.example         ← Plantilla sin secretos
├── .env.development     ← Para desarrollo
├── .env.test            ← Para tests
├── .gitignore           ← Debe incluir .env
└── package.json
```

### 🔑 Formato de Variables

```env
# .env (en la raíz del proyecto)

# Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=mi_contraseña_secreta
DATABASE_NAME=miapp

# JWT (seguridad)
JWT_SECRET=mi_clave_super_secreta_12345
JWT_EXPIRATION=24h

# API Keys
STRIPE_API_KEY=sk_live_1234567890abc
SENDGRID_API_KEY=SG-1234567890abcdef

# URLs
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Configuración general
NODE_ENV=development
DEBUG=false
PORT=3000
```

### 📋 .env.example (plantilla, sube a Git)

```env
# .env.example - Plantilla para el equipo

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=miapp

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=24h

STRIPE_API_KEY=your_stripe_key_here
SENDGRID_API_KEY=your_sendgrid_key_here

API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

NODE_ENV=development
DEBUG=false
PORT=3000
```

### 🚫 .gitignore (NO subir secretos)

```
# .gitignore
.env
.env.local
.env.*.local
!.env.example
```

---

## Accediendo Variables

### 1️⃣ Directamente con process.env

```typescript
// app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  getHello(): string {
    const nodeEnv = process.env.NODE_ENV;
    const dbHost = process.env.DATABASE_HOST;
    
    return `App running on ${nodeEnv} with DB at ${dbHost}`;
  }
}
```

### 2️⃣ Inyectando ConfigService (RECOMENDADO)

```typescript
// app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {

  constructor(private configService: ConfigService) {}

  getHello(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const dbHost = this.configService.get<string>('DATABASE_HOST');
    const dbPort = this.configService.get<number>('DATABASE_PORT');
    
    return `App running on ${nodeEnv} with DB at ${dbHost}:${dbPort}`;
  }

  // Con valor por defecto
  getApiUrl(): string {
    return this.configService.get<string>('API_URL', 'http://localhost:3000');
  }

  // Requerida (error si no existe)
  getStripeKey(): string {
    return this.configService.getOrThrow<string>('STRIPE_API_KEY');
  }
}
```

### 3️⃣ En TypeORM

```typescript
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: ['src/**/*.entity.ts'],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class AppModule {}
```

### 4️⃣ En Redis

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: configService.get('REDIS_TTL'),
      }),
    }),
  ],
})
export class AppModule {}
```

---

## Validación de Variables

### ⚠️ Problema: Variables faltantes

```typescript
// ❌ MALO: Sin validación
const stripeKey = process.env.STRIPE_API_KEY;
// Si no existe, es undefined
// Tu app falla después ❌

// ✅ BUENO: Con validación
const stripeKey = this.configService.getOrThrow('STRIPE_API_KEY');
// Si no existe, error INMEDIATO ✅
```

### ✔️ Validación Schema con Joi

```bash
npm install joi
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        // Base de Datos
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),

        // JWT
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('24h'),

        // APIs
        STRIPE_API_KEY: Joi.string().required(),
        SENDGRID_API_KEY: Joi.string().required(),

        // URLs
        API_URL: Joi.string().uri().required(),
        FRONTEND_URL: Joi.string().uri().required(),

        // Configuración
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        
        PORT: Joi.number().port().default(3000),
        DEBUG: Joi.boolean().default(false),
      }),
      validationOptions: {
        allowUnknown: true,  // Permite variables extra
        abortEarly: false,   // Muestra TODOS los errores, no solo el primero
      },
    }),
  ],
})
export class AppModule {}
```

**Beneficio:** Si falta una variable o tiene tipo incorrecto, la app **no inicia** y te lo dice claramente.

```
Error: Configuration validation error: "DATABASE_PASSWORD" is required
```

---

## Diferentes Entornos

### 🔄 Cargar diferentes .env según NODE_ENV

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,  // .env.development.local (no sube)
        `.env.${process.env.NODE_ENV}`,        // .env.development (sube a git)
        '.env',                                  // .env fallback
      ],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### 📂 Estructura de archivos

```
tu-proyecto/
├── .env                      ← Valores por defecto
├── .env.development          ← Para desarrollo (sube a Git)
├── .env.development.local    ← Valores personales (NO sube)
├── .env.production           ← Para producción
├── .env.test                 ← Para tests
├── .env.example              ← Plantilla
└── .gitignore                ← Excluye .env
```

### 🎯 Contenido de cada archivo

```env
# .env - Base (valores seguros por defecto)
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DEBUG=false
```

```env
# .env.development - Desarrollo
NODE_ENV=development
DATABASE_PASSWORD=dev_password
JWT_SECRET=dev_secret_not_secure
API_URL=http://localhost:3000
```

```env
# .env.production - Producción (en servidor)
NODE_ENV=production
DATABASE_HOST=prod-db.mycompany.com
DATABASE_PASSWORD=super_secreto_real
JWT_SECRET=super_secreto_jwt_real
API_URL=https://myapp.com
```

```env
# .env.test - Tests
NODE_ENV=test
DATABASE_NAME=test_db
DATABASE_PASSWORD=test
JWT_SECRET=test_secret
API_URL=http://localhost:3000
```

### 💻 Cómo ejecutar con diferentes entornos

```bash
# Desarrollo (por defecto)
npm start

# Desarrollo con variables personales
npm start -- --env=development.local

# Production
NODE_ENV=production npm start

# Tests
NODE_ENV=test npm test

# En Docker
docker run -e NODE_ENV=production -e DATABASE_PASSWORD=xxx myapp
```

---

## Mejores Prácticas

### 1️⃣ Crear archivo config centralizado

```typescript
// src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3000,
  debug: process.env.DEBUG === 'true',
  apiUrl: process.env.API_URL,
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRATION || '24h',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
}));
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, databaseConfig, jwtConfig, redisConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

### 2️⃣ Usar tipos seguros

```typescript
// src/config/environment.ts
export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  API_URL: string;
}

// service.ts
import { Environment } from './environment';

@Injectable()
export class UserService {
  constructor(private configService: ConfigService<Environment>) {}

  getConfig() {
    // Con auto-complete y type safety ✅
    const dbHost = this.configService.get('DATABASE_HOST');
    const jwtSecret = this.configService.get('JWT_SECRET');
  }
}
```

### 3️⃣ Variables requeridas en startup

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Validar variables críticas
  const requiredVars = [
    'DATABASE_PASSWORD',
    'JWT_SECRET',
    'STRIPE_API_KEY',
  ];

  for (const varName of requiredVars) {
    if (!configService.get(varName)) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  const port = configService.get('PORT');
  await app.listen(port);
  console.log(`App running on port ${port}`);
}

bootstrap();
```

### 4️⃣ Nunca loguees variables sensibles

```typescript
// ❌ MALO
console.log(process.env);  // Log de TODAS las variables
console.log(`DB Password: ${process.env.DATABASE_PASSWORD}`);  // 🔓 Inseguro

// ✅ BUENO
console.log(`App running on port ${process.env.PORT}`);
console.log(`Node env: ${process.env.NODE_ENV}`);
// No loguees: passwords, API keys, secrets
```

### 5️⃣ Variables en .gitignore

```
# .gitignore
.env
.env.*.local
.env.test.local
.env.development.local
.env.production.local

# Pero SÍ sube la plantilla
!.env.example
```

---

## 🎯 Ejemplo Completo Real

### Estructura del proyecto

```
tu-proyecto/
├── src/
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── index.ts
│   ├── app.module.ts
│   ├── main.ts
│   └── ...
├── .env
├── .env.example
├── .env.development
├── .env.production
├── .gitignore
└── package.json
```

### app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';

@Module({
  imports: [
    // 1. ConfigModule global
    ConfigModule.forRoot({
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production'),
        PORT: Joi.number().default(3000),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),

    // 2. TypeORM con variables de entorno
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: ['src/**/*.entity.ts'],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class AppModule {}
```

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;
  const env = configService.get<string>('NODE_ENV');

  await app.listen(port);
  console.log(`✅ App running on port ${port} (${env})`);
}

bootstrap();
```

### app.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {

  constructor(private configService: ConfigService) {}

  getInfo() {
    return {
      environment: this.configService.get('NODE_ENV'),
      port: this.configService.get('PORT'),
      apiUrl: this.configService.get('API_URL'),
      debug: this.configService.get('DEBUG'),
    };
  }
}
```

### .env

```env
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=miapp
JWT_SECRET=my_jwt_secret
API_URL=http://localhost:3000
DEBUG=true
```

### .env.example

```env
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=miapp
JWT_SECRET=your_jwt_secret_here
API_URL=http://localhost:3000
DEBUG=false
```

---

## 📋 Checklist de Seguridad

```
✅ Archivo .env en .gitignore
✅ .env.example sube a Git (sin secretos)
✅ Todas las variables requeridas definidas
✅ Validación con Joi
✅ No logueas variables sensibles
✅ Diferentes valores en dev/prod
✅ Cada dev usa sus credenciales
✅ CI/CD inyecta variables correctamente
✅ Secrets nunca en código
✅ ConfigService inyectado, no process.env directo
```

---

## 🎓 Resumen Rápido

| Concepto | Qué es |
|----------|--------|
| **Variables de entorno** | Configuración fuera del código |
| **.env** | Archivo con variables (NO sube a Git) |
| **.env.example** | Plantilla (SÍ sube a Git) |
| **ConfigModule** | Módulo NestJS que lee .env |
| **ConfigService** | Servicio para acceder variables |
| **Validación** | Verificar que existan todas las variables |
| **Multi-entorno** | Diferentes .env para dev/test/prod |

---

## 📚 Comandos Útiles

```bash
# Crear .env desde ejemplo
cp .env.example .env

# Ver variables de entorno en Linux/Mac
printenv | grep DB

# Ver variables en Windows PowerShell
Get-ChildItem env: | Where-Object { $_.Name -like "*DB*" }

# Ejecutar con variables personalizadas
DATABASE_PASSWORD=xxx PORT=4000 npm start

# En Docker
docker run -e NODE_ENV=production -e DATABASE_PASSWORD=xxx myapp
```

---

**Recuerda:** Variables de entorno = Configuración, no código. Mantenlos separados. 🔐
