# 🔐 AWS Secrets Manager

## Índice
1. [¿Qué es AWS Secrets Manager?](#qué-es-aws-secrets-manager)
2. [Variables de Entorno vs Secrets Manager](#variables-de-entorno-vs-secrets-manager)
3. [Cómo funciona](#cómo-funciona)
4. [Setup AWS](#setup-aws)
5. [Integración con NestJS](#integración-con-nestjs)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Rotación Automática](#rotación-automática)
8. [Monitoreo y Auditoría](#monitoreo-y-auditoría)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Costos](#costos)

---

## ¿Qué es AWS Secrets Manager?

### 🔤 Definición Simple

**AWS Secrets Manager** es un **servicio seguro de AWS que guarda y gestiona secretos** (contraseñas, API keys, credenciales) de forma centralizada, encriptada y auditada.

Es como una **caja de seguridad blindada en un banco**, donde:
- Tus secretos están encriptados
- Solo tú (con permisos) puedes acceder
- Se registra quién accedió y cuándo
- Se pueden rotar automáticamente

### 📚 Analogía: Caja de Seguridad

**Sin Secrets Manager (.env en tu máquina):**
```
Tu máquina local:
┌─────────────────────────────────┐
│ .env file                       │
│ DB_PASSWORD=mi_contraseña       │
│ API_KEY=abc123xyz              │
│ JWT_SECRET=secret123            │
└─────────────────────────────────┘
     ↓
GitHub (oops, accidentalmente subiste)
     ↓
Cualquiera lo ve ❌
```

**Con Secrets Manager:**
```
AWS Secrets Manager (Vault seguro):
┌─────────────────────────────────────────┐
│ 🔒 ENCRIPTADO con KMS                   │
│                                         │
│ Secret: "db-password"                   │
│ Value: ***** (encriptado)               │
│                                         │
│ Acceso registrado:                      │
│ - Juan accedió 14:30                    │
│ - App prod accedió 15:45                │
└─────────────────────────────────────────┘
     ↓
Tu app (con permisos IAM)
     ↓
Acceso seguro y auditado ✅
```

### 🎯 Características principales

| Característica | Qué hace |
|---|---|
| **Encriptación** | Usa KMS (AWS Key Management Service) |
| **Acceso seguro** | Solo con credenciales IAM |
| **Auditoría** | CloudTrail registra todos los accesos |
| **Rotación** | Cambia contraseñas automáticamente |
| **Versionado** | Historial de cambios |
| **Alta disponibilidad** | Replicado en múltiples regiones |
| **Integración AWS** | Funciona con RDS, Databases, etc |

---

## Variables de Entorno vs Secrets Manager

### 📊 Comparación Completa

| Aspecto | Variables (.env) | Secrets Manager |
|--------|-----------------|---|
| **Ubicación** | Archivo local | AWS Cloud |
| **Encriptación** | No (texto plano) | Sí (KMS) |
| **Acceso** | Cualquiera con archivo | Solo IAM + KMS |
| **Auditoría** | No hay | CloudTrail registra todo |
| **Rotación** | Manual | Automática |
| **Costo** | Gratis | $0.40/secreto/mes |
| **Escalabilidad** | Limitada | Ilimitada |
| **Secretos sensibles** | Malas prácticas | Excelente |

### 🎯 Cuándo usar cada una

```
USA .env SI:
✅ Desarrollo local
✅ Variables NO sensibles (PORT, API_URL)
✅ Proyecto pequeño
✅ Sin equipo

USA Secrets Manager SI:
✅ Producción
✅ Datos muy sensibles (passwords, API keys)
✅ Requieres auditoría
✅ Equipo grande
✅ Compliancia (HIPAA, PCI-DSS, GDPR)
✅ Rotación automática necesaria
```

#### ¿Qué diferencia hay entre variables de entorno y AWS Secret Manager?

Las variables de entorno son strings que se inyectan en el proceso al arrancar. Son simples pero tienen límites: quedan expuestas en logs de CI/CD, en dashboards de plataformas cloud, y no tienen rotación automática.

AWS Secret Manager almacena secretos cifrados con KMS. Provee rotación automática (por ejemplo, rotar una contraseña de BD cada 30 días sin tocar el código), versionado, auditoría de quién accedió y cuándo, y acceso por IAM roles — el servicio nunca recibe el secreto como string plano, lo pide en runtime.

La práctica real: Secret Manager para credenciales (DB, API keys, JWT secrets). Variables de entorno para configuración no sensible (nombre del entorno, puertos, feature flags).

### 🏗️ Arquitectura Híbrida (RECOMENDADO)

```
Variables .env:
- PORT=3000
- NODE_ENV=production
- API_URL=https://api.miapp.com
- DEBUG=false

Secrets Manager:
- DB_PASSWORD
- JWT_SECRET
- STRIPE_API_KEY
- DATABASE_PASSWORD
- EMAIL_PASSWORD
```

---

## Cómo funciona

### 🔄 Flujo de Acceso

```
1. Tu aplicación NestJS
   ↓
2. "Dame el secret 'db-password'"
   ↓
3. AWS SDK llama a Secrets Manager
   ↓
4. Secrets Manager verifica:
   - ¿Tienes credenciales IAM? ✓
   - ¿Tienes permiso para este secret? ✓
   - ¿Qué IP solicita? (auditoría)
   ↓
5. Desencripta con KMS
   ↓
6. Retorna: "mi_contraseña_de_verdad"
   ↓
7. Tu app lo usa
   ↓
8. CloudTrail registra: "App prod accedió a db-password a las 15:45"
```

### 🔐 Encriptación Multicapa

```
┌────────────────────────────────────────┐
│ Tu secreto en Secrets Manager:         │
│ "mi_contraseña_super_secreta"          │
└────────────────────────────────────────┘
              ↓
        ENCRIPTADO CON:
    Master Key (KMS) → AWS-managed
              ↓
┌────────────────────────────────────────┐
│ Guardado en AWS:                       │
│ "AQICAHgM7i2p8x9k2L... [encriptado]"  │
│ (solo AWS puede desencriptar)          │
└────────────────────────────────────────┘
```

### 📝 Estructura de un Secret

```json
{
  "name": "db-password",
  "description": "Password para BD PostgreSQL producción",
  "secretString": "mi_contraseña_encriptada",
  "arn": "arn:aws:secretsmanager:us-east-1:123456789:secret:db-password",
  "createdDate": "2024-01-15T10:30:00Z",
  "lastAccessedDate": "2024-01-20T14:45:00Z",
  "lastChangedDate": "2024-01-20T14:45:00Z",
  "tags": [
    { "Key": "Environment", "Value": "production" },
    { "Key": "Application", "Value": "my-app" }
  ]
}
```

---

## Setup AWS

### 1️⃣ Crear Secret en AWS Console

**Opción A: AWS Management Console**

```
1. Ve a AWS Secrets Manager
2. Click "Store a new secret"
3. Tipo de secret: "Other type of secret"
4. Key/value pairs:
   - database-password: mi_contraseña
   - database-host: localhost
5. Name: db-credentials
6. Click "Store secret"
```

**Opción B: AWS CLI**

```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciales
aws configure
# Ingresa:
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Region: us-east-1
# Output: json

# Crear secret
aws secretsmanager create-secret \
  --name db-credentials \
  --description "Database credentials for production" \
  --secret-string '{"username":"postgres","password":"mi_contraseña"}'

# Ver secret (solo ver el nombre, no el valor)
aws secretsmanager describe-secret --secret-id db-credentials

# Acceder al secret (para testing)
aws secretsmanager get-secret-value --secret-id db-credentials
```

### 2️⃣ Configurar Permisos IAM

Tu aplicación necesita permisos para acceder. Crea una **IAM Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789:secret:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789:key/12345678"
    }
  ]
}
```

### 3️⃣ Credenciales para tu aplicación

En tu servidor de producción, usa una de estas formas:

**Opción A: IAM Role (RECOMENDADO para EC2/ECS)**
```
Tu EC2 tiene un IAM Role adjunto
↓
AWS SDK detecta las credenciales automáticamente
↓
Tu app accede a Secrets Manager sin credenciales explícitas
```

**Opción B: Variables de Entorno (EC2/cualquier servidor)**
```bash
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
```

**Opción C: Archivo ~/.aws/credentials**
```
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
region = us-east-1
```

---

## Integración con NestJS

### 📦 Instalación

```bash
npm install @aws-sdk/client-secrets-manager
# o si usas la antigua SDK v2:
npm install aws-sdk
```

### 🔧 Crear Servicio para Secrets Manager

```typescript
// src/secrets/secrets.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService implements OnModuleInit {
  private client: SecretsManagerClient;
  private cache = new Map<string, any>();

  async onModuleInit() {
    // Se crea en el inicio de la app
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getSecret(secretName: string): Promise<any> {
    try {
      // Buscar en caché primero (opcional)
      if (this.cache.has(secretName)) {
        return this.cache.get(secretName);
      }

      // Obtener de AWS
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);

      // Parsear el secret
      const secret = response.SecretString
        ? JSON.parse(response.SecretString)
        : response.SecretBinary;

      // Guardar en caché (evita llamadas innecesarias)
      this.cache.set(secretName, secret);

      return secret;
    } catch (error) {
      console.error(`Error fetching secret ${secretName}:`, error);
      throw error;
    }
  }

  // Obtener valor específico
  async getSecretValue(secretName: string, key: string): Promise<string> {
    const secret = await this.getSecret(secretName);
    return secret[key];
  }

  // Limpiar caché
  clearCache(secretName?: string) {
    if (secretName) {
      this.cache.delete(secretName);
    } else {
      this.cache.clear();
    }
  }
}
```

### 📦 Crear Módulo

```typescript
// src/secrets/secrets.module.ts
import { Module } from '@nestjs/common';
import { SecretsService } from './secrets.service';

@Module({
  providers: [SecretsService],
  exports: [SecretsService],  // Exporta para que otros módulos lo usen
})
export class SecretsModule {}
```

### 🔌 Usar en App.Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SecretsModule,  // Importar Secrets
    TypeOrmModule.forRootAsync({
      imports: [SecretsModule],
      inject: [SecretsService],
      useFactory: async (secretsService: SecretsService) => {
        // Obtener credenciales de Secrets Manager
        const dbSecret = await secretsService.getSecret('db-credentials');

        return {
          type: 'postgres',
          host: dbSecret.host,
          port: dbSecret.port,
          username: dbSecret.username,
          password: dbSecret.password,
          database: dbSecret.database,
          entities: ['src/**/*.entity.ts'],
        };
      },
    }),
  ],
})
export class AppModule {}
```

---

## Ejemplos Prácticos

### 1️⃣ Base de Datos

```typescript
// src/database/database.service.ts
import { Injectable } from '@nestjs/common';
import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class DatabaseService {
  constructor(private secretsService: SecretsService) {}

  async getConnectionConfig() {
    // Obtener credenciales del secret
    const dbSecret = await this.secretsService.getSecret('db-credentials');

    return {
      host: dbSecret.host,
      port: dbSecret.port,
      username: dbSecret.username,
      password: dbSecret.password,
      database: dbSecret.database,
      ssl: true,  // Importante en producción
    };
  }
}
```

### 2️⃣ API Keys

```typescript
// src/stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class StripeService {
  constructor(private secretsService: SecretsService) {}

  async initialize() {
    // Obtener API key de Stripe
    const stripeSecret = await this.secretsService.getSecret('stripe-keys');

    return {
      apiKey: stripeSecret.api_key,
      webhookSecret: stripeSecret.webhook_secret,
    };
  }
}
```

### 3️⃣ Múltiples Secretos

```typescript
// src/config/secrets.config.ts
import { Injectable } from '@nestjs/common';
import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class SecretsConfig {
  private secrets: any = {};

  constructor(private secretsService: SecretsService) {}

  async load() {
    // Cargar todos los secretos al iniciar
    this.secrets.database = await this.secretsService.getSecret(
      'db-credentials'
    );
    this.secrets.jwt = await this.secretsService.getSecret('jwt-keys');
    this.secrets.stripe = await this.secretsService.getSecret('stripe-keys');
    this.secrets.email = await this.secretsService.getSecret(
      'email-credentials'
    );
  }

  get(secretName: string) {
    return this.secrets[secretName];
  }
}

// En main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const secretsConfig = app.get(SecretsConfig);

  // Cargar secretos antes de iniciar
  await secretsConfig.load();

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
```

### 4️⃣ Con Guard (Solo para admin)

```typescript
// src/auth/secrets.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SecretsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Solo admins pueden acceder a endpoints que usan secrets
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Solo administradores pueden acceder a operaciones de secretos'
      );
    }

    return true;
  }
}

// Usar en controller
@Controller('admin/secrets')
@UseGuards(SecretsGuard)
export class SecretsController {
  constructor(private secretsService: SecretsService) {}

  @Post('rotate/:secretName')
  async rotateSecret(@Param('secretName') secretName: string) {
    // Implementar rotación manual
    return { message: `Secret ${secretName} rotated` };
  }
}
```

### 5️⃣ Manejo de Errores

```typescript
// src/secrets/secrets.service.ts (mejorado)
import { Injectable } from '@nestjs/common';
import { SecretsManagerClient, ResourceNotFoundException } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService {
  constructor(private client: SecretsManagerClient) {}

  async getSecret(secretName: string): Promise<any> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);
      return JSON.parse(response.SecretString);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw new Error(`Secret "${secretName}" not found in AWS`);
      }

      if (error.code === 'AccessDenied') {
        throw new Error(`Access denied to secret "${secretName}"`);
      }

      if (error.code === 'InvalidParameterException') {
        throw new Error(`Invalid secret name: "${secretName}"`);
      }

      throw error;
    }
  }
}
```

---

## Rotación Automática

### 🔄 ¿Qué es la rotación?

```
Sin rotación:
Password: "abc123"
├─ Año 1: La usa la app
├─ Año 2: Todos la conocen ❌
└─ Año 3: Hackeada, BD comprometida ❌

Con rotación:
Password: "abc123"
├─ Semana 1-2: La usa
├─ Semana 2-3: Cambia a "xyz789"
├─ Semana 3-4: La usa
├─ Semana 4-5: Cambia a "def456"
├─ ... (siempre fresca)
└─ Si se filtra una, expira rápidamente ✅
```

### ⚙️ Configurar Rotación Automática

**En AWS Console:**
```
1. Ve a tu secret
2. "Rotation configuration"
3. "Enable automatic rotation"
4. Rotation schedule: 30 days
5. Rotation function: auto-generate
```

**Con AWS CLI:**
```bash
aws secretsmanager rotate-secret \
  --secret-id db-credentials \
  --rotation-rules AutomaticallyAfterDays=30
```

### 🛠️ Lambda para Rotación (Avanzado)

AWS puede ejecutar una Lambda para rotar secretos:

```python
# lambda_function.py (Python en Lambda)
import boto3
import psycopg2

def lambda_handler(event, context):
    secret_id = event['SecretId']
    
    # 1. Obtener secret actual
    secrets_client = boto3.client('secretsmanager')
    secret = secrets_client.get_secret_value(SecretId=secret_id)
    
    # 2. Generar nueva contraseña
    new_password = generate_password()
    
    # 3. Actualizar en BD (PostgreSQL)
    conn = psycopg2.connect(
        host=secret['host'],
        database=secret['database'],
        user=secret['username'],
        password=secret['password']
    )
    
    cursor = conn.cursor()
    cursor.execute(f"ALTER USER {secret['username']} WITH PASSWORD '{new_password}'")
    conn.commit()
    
    # 4. Actualizar en Secrets Manager
    secrets_client.put_secret_value(
        SecretId=secret_id,
        ClientRequestToken=event['ClientRequestToken'],
        SecretString=json.dumps({
            'username': secret['username'],
            'password': new_password,
            'host': secret['host']
        })
    )
    
    return {"statusCode": 200, "body": "Secret rotated"}
```

---

## Monitoreo y Auditoría

### 📊 CloudTrail (Auditoría)

CloudTrail registra **QUIÉN accedió a QUÉ secreto y CUÁNDO**:

```bash
# Ver accesos a un secret
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=db-credentials \
  --region us-east-1
```

Salida:
```json
{
  "EventName": "GetSecretValue",
  "EventTime": "2024-01-20T14:45:00Z",
  "Username": "prod-app-role",
  "SourceIPAddress": "10.0.1.5",
  "EventStatus": "Success"
}
```

### 🚨 CloudWatch Alarms

```bash
# Alerta si alguien accede a un secret sensible
aws cloudwatch put-metric-alarm \
  --alarm-name "db-password-accessed" \
  --alarm-description "Alert when db-password is accessed" \
  --metric-name GetSecretValue \
  --namespace AWS/SecretsManager
```

### 📈 Métricas Útiles

```
- Número de accesos por secret
- Errores de acceso (denied, not found)
- IP de acceso
- Usuario que accedió
- Cambios/rotaciones
```

---

## Mejores Prácticas

### 1️⃣ Estructura de Secretos

```json
// AWS Secrets Manager - un secret bien estructurado

Secret name: "prod/app/db-credentials"

{
  "engine": "postgres",
  "host": "prod-db.cqfq3m8c8q5s.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "dbname": "myapp_prod",
  "username": "postgres",
  "password": "random_generated_password_xyz",
  "ssl": true,
  "sslMode": "require"
}
```

### 2️⃣ Nombres de Secretos con Convención

```
Desarrollo:
- dev/app/db-credentials
- dev/app/jwt-keys
- dev/app/api-keys

Producción:
- prod/app/db-credentials
- prod/app/jwt-keys
- prod/app/api-keys

Staging:
- staging/app/db-credentials
- staging/app/jwt-keys
- staging/app/api-keys
```

### 3️⃣ Tags para Organización

```bash
aws secretsmanager tag-resource \
  --secret-id prod/app/db-credentials \
  --tags Key=Environment,Value=production Key=Application,Value=myapp Key=Team,Value=platform
```

### 4️⃣ Acceso Mínimo (Least Privilege)

```json
// IAM Policy - Solo lo necesario

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789:secret:prod/app/db-*",
        "arn:aws:secretsmanager:us-east-1:123456789:secret:prod/app/jwt-*"
      ]
    }
  ]
}
```

### 5️⃣ Versionado de Secretos

```bash
# Secretos Manager mantiene historial automático

# Ver versiones
aws secretsmanager list-secret-version-ids \
  --secret-id prod/app/db-credentials

# Restaurar versión anterior
aws secretsmanager restore-secret \
  --secret-id prod/app/db-credentials \
  --version-id abc123def456
```

### 6️⃣ Combinación con Variables de Entorno

```typescript
// src/config/config.service.ts
@Injectable()
export class ConfigService {
  constructor(private secretsService: SecretsService) {}

  async getConfig() {
    return {
      // Variables de entorno (no sensibles)
      PORT: process.env.PORT || 3000,
      NODE_ENV: process.env.NODE_ENV || 'development',
      API_URL: process.env.API_URL,

      // Secrets Manager (sensibles)
      database: await this.secretsService.getSecret('db-credentials'),
      jwt: await this.secretsService.getSecret('jwt-keys'),
      stripe: await this.secretsService.getSecret('stripe-keys'),
    };
  }
}
```

---

## Costos

### 💰 Precios (Marzo 2024)

```
Almacenamiento de secretos:
- $0.40 por secreto por mes
- 50 secretos = $20/mes

Acceso/rotación:
- Primeros 10,000 accesos: gratis
- Después: $0.05 por 10,000 accesos

Ejemplo:
- 100 secretos × $0.40 = $40/mes
- 1,000,000 accesos = $5/mes
- TOTAL: ~$45/mes
```

### 💵 Comparativa de Costo vs Seguridad

```
Variables .env:
- Costo: $0
- Riesgo: ALTO (contraseñas en archivos)
- Rotación: Manual
- Auditoría: No

Secrets Manager:
- Costo: $45/mes
- Riesgo: BAJO (encriptado, auditado)
- Rotación: Automática
- Auditoría: CloudTrail

ROI: Un incidente de seguridad cuesta millones $$$$
```

---

## 🎯 Cuándo Usar Secrets Manager

### ✅ ÚSALO PARA:

```
✅ Contraseñas de BD en producción
✅ API keys sensibles (Stripe, AWS, etc)
✅ JWT secrets
✅ OAuth tokens
✅ Certificados SSL/TLS
✅ Cuando necesites auditoría completa
✅ Equipo grande con múltiples personas
✅ Compliancia (HIPAA, PCI-DSS, GDPR)
```

### ❌ NO LO NECESITAS SI:

```
❌ Desarrollo local
❌ Variables no sensibles
❌ Proyecto pequeño una sola persona
❌ Presupuesto muy ajustado
❌ No hay requisitos de compliancia
```

---

## 🔀 Secrets Manager vs Alternativas

| Solución | Costo | Seguridad | Facilidad | Rotación |
|----------|-------|-----------|-----------|----------|
| **.env** | Gratis | Baja ❌ | Fácil | Manual |
| **HashiCorp Vault** | $4,500+/año | Excelente | Media | Sí |
| **AWS Secrets Manager** | $45/mes | Excelente | Fácil | Sí |
| **Azure Key Vault** | $6/mes | Excelente | Fácil | Sí |
| **1Password Business** | $7/mes/usuario | Alta | Muy fácil | Manual |

---

## 📋 Checklist de Implementación

```
✅ Crear Secrets Manager en AWS
✅ Configurar IAM roles/policies
✅ Crear SecretsService en NestJS
✅ Integrar con TypeORM
✅ Integrar con otros servicios (Stripe, etc)
✅ Configurar CloudTrail
✅ Configurar alertas CloudWatch
✅ Establecer política de rotación
✅ Documentar secretos disponibles
✅ Entrenar al equipo
✅ Remover .env de producción
✅ Hacer backup de secretos
✅ Establecer proceso de recuperación
```

---

## 🎓 Resumen Rápido

**Secrets Manager es:**
- 🔒 Bóveda encriptada en AWS
- 📝 Auditoría completa de accesos
- 🔄 Rotación automática
- 💰 Barato (~$45/mes)
- 📊 Escalable para equipos

**Integración NestJS:**
```typescript
// 1. Instalar SDK
npm install @aws-sdk/client-secrets-manager

// 2. Crear SecretsService
@Injectable()
export class SecretsService {
  async getSecret(name: string) { ... }
}

// 3. Usarlo en otros servicios
constructor(private secretsService: SecretsService) {}
const secret = await this.secretsService.getSecret('db-credentials');
```

---

## 📚 Recursos Útiles

- [AWS Secrets Manager Docs](https://docs.aws.amazon.com/secretsmanager/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [CloudTrail Documentation](https://docs.aws.amazon.com/cloudtrail/)

---

**Recuerda:** En producción, NUNCA pongas secrets en código. Usa Secrets Manager. 🔐
