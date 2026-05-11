# 🌐 AWS API Gateway - Para Dummies

**Última actualización**: 10 mayo 2026  
**Nivel**: Principiante  
**Duración lectura**: 10 minutos  
**Prerequisito**: Haber leído [01-Lambda-Para-Dummies.md](./01-Lambda-Para-Dummies.md)

---

## ¿Qué es AWS API Gateway?

### La Explicación Simple

**API Gateway es una "puerta" que transforma HTTP en eventos que Lambda entiende.**

Imagina que tienes una función Lambda que procesa compras. ¿Pero cómo accede el usuario desde el navegador? 

**Sin API Gateway**:
```
Cliente (navegador)
        ↓
    ¿Cómo llego a Lambda?
        ↓
    ❌ No puedo directamente
```

**Con API Gateway**:
```
Cliente (navegador)
        ↓
   HTTP Request
        ↓
  API Gateway
        ↓
   Transforma en evento
        ↓
    Lambda
        ↓
   Responde JSON
```

---

## 🎯 Concepto Central: "Puerta HTTP a tus Funciones"

```
┌──────────────────────────────────────┐
│       API Gateway                    │
│                                      │
│  GET  /usuarios    ─────────┐       │
│  POST /comprar     ────────┤──→ Lambda
│  PUT  /pedido/:id  ────────┤       │
│  DELETE /datos     ─────────┘       │
│                                      │
│  ✅ Maneja HTTP                     │
│  ✅ Autentica requests              │
│  ✅ Valida datos                    │
│  ✅ Cachea respuestas               │
│  ✅ Limita (rate limiting)          │
│  ✅ CORS                            │
│  ✅ Versiones de API                │
└──────────────────────────────────────┘
```

---

## 📚 Ejemplos Simples

### Ejemplo 1: API Gateway Básico

**Crear endpoint**:
```
GET /api/usuarios → Lambda handler
POST /api/usuarios → Lambda handler
PUT /api/usuarios/{id} → Lambda handler
DELETE /api/usuarios/{id} → Lambda handler
```

**Tu Lambda recibe**:
```javascript
exports.handler = async (event) => {
  console.log("Path:", event.path);           // /api/usuarios
  console.log("Método:", event.httpMethod);   // GET, POST, etc
  console.log("Query:", event.queryStringParameters);  // ?page=1&limit=10
  console.log("Body:", event.body);           // JSON enviado
  console.log("Headers:", event.headers);     // Authorization, etc

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: "¡Funciona!",
      data: []
    })
  };
};
```

### Ejemplo 2: Rutas Diferentes

```
API Gateway configura:

GET /usuarios
  ↓
Buscar todos

GET /usuarios/{id}
  ↓
Buscar por ID

POST /usuarios
  ↓
Crear nuevo

PUT /usuarios/{id}
  ↓
Actualizar

DELETE /usuarios/{id}
  ↓
Eliminar
```

Tu Lambda:
```javascript
exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path;
  const id = event.pathParameters?.id;

  if (method === 'GET' && !id) {
    return obtenerTodos();
  }
  
  if (method === 'GET' && id) {
    return obtenerPorId(id);
  }
  
  if (method === 'POST') {
    return crear(JSON.parse(event.body));
  }
  
  if (method === 'PUT') {
    return actualizar(id, JSON.parse(event.body));
  }
  
  if (method === 'DELETE') {
    return eliminar(id);
  }

  return { statusCode: 404, body: 'No encontrado' };
};
```

### Ejemplo 3: Con Autenticación

```javascript
exports.handler = async (event) => {
  // API Gateway ya validó el token (si lo configuraste)
  const user = event.requestContext.authorizer;
  
  console.log("Usuario:", user.principalId);
  console.log("Email:", user.claims.email);
  
  // Solo usuarios autenticados llegan aquí
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: `Hola ${user.claims.email}`
    })
  };
};
```

---

## ✅ Beneficios de API Gateway

| Beneficio | Descripción |
|-----------|------------|
| **Interfaz HTTP** | Expone Lambda como API REST |
| **Sin infraestructura** | Escala automáticamente |
| **Autenticación** | Soporta JWT, API Keys, Cognito |
| **Throttling** | Limita peticiones (rate limiting) |
| **CORS** | Permite llamadas desde navegador |
| **Caching** | Cachea respuestas para más velocidad |
| **Transformación** | Modifica requests/responses |
| **Versionado** | Múltiples versiones de API |
| **Mapeo** | Transforma datos entre formatos |
| **Logging** | Registra todas las peticiones |

---

## 🏗️ Arquitectura: API Gateway + Lambda

```mermaid
graph LR
    A["Cliente<br/>(Navegador/App)"] -->|HTTP Request| B["API Gateway"]
    B -->|Valida| C["Autenticación<br/>(JWT, API Key)"]
    C -->|OK| D["Rate Limiting<br/>(Throttling)"]
    D -->|OK| E["Transforma<br/>a evento"]
    E -->|Dispara| F["Lambda"]
    F -->|Responde| G["Transforma<br/>HTTP Response"]
    G -->|Cachea| H["CloudFront<br/>(opcional)"]
    H -->|Retorna| A
    
    C -->|Error| I["401 Unauthorized"]
    D -->|Error| J["429 Too Many Requests"]
    I --> A
    J --> A
    
    style B fill:#2196f3,color:#fff
    style F fill:#ff9800,color:#fff
    style A fill:#e3f2fd
    style C fill:#c8e6c9
    style D fill:#f8bbd0
```

---

## 🔄 Flujo Completo: E-commerce

```mermaid
sequenceDiagram
    Cliente->>API Gateway: POST /comprar<br/>Body: {producto_id, cantidad}
    
    API Gateway->>API Gateway: Valida<br/>Content-Type
    
    API Gateway->>API Gateway: Valida<br/>JWT Token
    
    API Gateway->>API Gateway: Verifica<br/>Rate Limit
    
    API Gateway->>Lambda: Envía evento<br/>con datos
    
    Lambda->>DynamoDB: Busca producto
    Lambda->>DynamoDB: Verifica stock
    Lambda->>DynamoDB: Crea pedido
    
    Lambda->>API Gateway: { status: 201,<br/>order_id: 123 }
    
    API Gateway->>API Gateway: Cachea<br/>(opcional)
    
    API Gateway->>Cliente: HTTP 201<br/>JSON response
    
    Cliente->>Cliente: Muestra<br/>confirmación
```

---

## 🌐 Tipos de API Gateway

### 1. REST API (Lo más común)

```
GET /usuarios
POST /usuarios
PUT /usuarios/{id}
DELETE /usuarios/{id}
```

**Ventajas**:
- Fácil de entender
- Compatible con todo
- Bueno para CRUD

**Desventajas**:
- No es tiempo real
- No es tan eficiente

### 2. HTTP API (Más rápido, más barato)

```
Igual que REST API pero:
- 3x más rápido
- 70% más barato
- Menos features (suficiente para mayoría)
```

### 3. WebSocket API (Tiempo real)

```
Cliente ←→ API Gateway ←→ Lambda
         (conexión abierta)
         
Mensajes en tiempo real
```

---

## 🔐 Autenticación en API Gateway

### Opción 1: API Key

```
Cliente envía:
GET /api/datos
Headers: x-api-key: abc123xyz

API Gateway valida:
✅ La clave existe
✅ No está revocada

Pasa a Lambda
```

### Opción 2: JWT (Recomendado)

```
Cliente envía:
GET /api/datos
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

API Gateway valida:
✅ Token es válido
✅ Firma es correcta
✅ No está expirado

Pasa claims a Lambda
```

### Opción 3: AWS Cognito

```
API Gateway + Cognito:

Cliente → Login → Cognito → Token JWT
         ↓
Envía Token → API Gateway
         ↓
Cognito valida
         ↓
Lambda recibe usuario autenticado
```

---

## ⚡ Throttling (Rate Limiting)

```mermaid
graph TD
    A["Solicitud llega"] -->|¿Exeede límite?| B{Validar}
    B -->|NO| C["Pasar a Lambda"]
    B -->|SÍ| D["429 Too Many Requests"]
    C --> E["Respuesta OK"]
    D --> F["Reintente después"]
    
    style C fill:#c8e6c9
    style D fill:#ffcdd2
```

**Configuración típica**:
```
Burst: 5,000 requests/segundo
Rate: 10,000 requests/segundo
```

---

## 💾 Transformación de Datos

### Mapping Templates

API Gateway puede transformar requests:

```javascript
// Request mapping (antes de Lambda)
{
  "id": "$input.params('id')",
  "body": $input.json('$'),
  "headers": "$input.params().header.get('Authorization')"
}

// Response mapping (después de Lambda)
{
  "data": "$input.json('$.body')",
  "timestamp": "$context.requestTime"
}
```

---

## 📊 Comparación: API Gateway vs Alternativas

| Aspecto | API Gateway | ALB | NLB |
|--------|------------|-----|-----|
| **HTTP** | ✅ REST/WS | ✅ Sí | ❌ No |
| **Lambda** | ✅ Nativo | ⚠️ Posible | ⚠️ Difícil |
| **Escala automática** | ✅ Ilimitada | ⚠️ Configurable | ⚠️ Configurable |
| **Autenticación** | ✅ JWT/API Key | ❌ No | ❌ No |
| **Caching** | ✅ Sí | ⚠️ CloudFront | ⚠️ CloudFront |
| **Mejor para** | APIs + Lambda | Apps complejas | Rendimiento puro |

---

## 🎯 Casos de Uso: CUÁNDO Usar API Gateway

### ✅ IDEAL para API Gateway

#### 1. **API REST con Lambda**
```
GET /api/usuarios → Lambda
POST /api/usuarios → Lambda
PUT /api/usuarios/{id} → Lambda
```

#### 2. **Microservicios**
```
API Gateway
├─ GET /usuarios → UserService Lambda
├─ GET /ordenes → OrderService Lambda
└─ GET /pagos → PaymentService Lambda
```

#### 3. **Mobile Apps**
```
App iOS/Android
    ↓
API Gateway (CORS habilitado)
    ↓
Lambda
    ↓
Base de datos
```

#### 4. **Public APIs**
```
API Gateway + Rate Limiting
    ↓
Controla quién accede
    ↓
Cuánto pueden usar
```

#### 5. **Webhooks**
```
GitHub → Push webhook
       ↓
   API Gateway
       ↓
   Lambda procesa
```

### ❌ NO es IDEAL para API Gateway

| Caso | Razón |
|------|-------|
| **Aplicación compleja (MVC)** | Usa ALB + EC2/ECS en su lugar |
| **Streaming de video** | API Gateway timeout = 29 segundos |
| **Real-time HD (WebSocket)** | Considera AppSync o Socket.io |
| **Máximo rendimiento** | NLB es más rápido |

---

## 🚀 API Gateway + NestJS

¿Cómo integrar en tu proyecto NestJS?

```typescript
// src/lambda-handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';

const app = express();

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Convertir evento API Gateway a Express request
  const req = {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : {},
    query: event.queryStringParameters || {}
  };

  // Procesar con NestJS
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(app)
  );

  // Retornar respuesta en formato API Gateway
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true })
  };
}
```

**Entonces configuras en API Gateway**:
```
GET /api/{proxy+}  →  Lambda
POST /api/{proxy+} →  Lambda
PUT /api/{proxy+}  →  Lambda
DELETE /api/{proxy+} → Lambda
```

---

## 🎓 Conceptos Clave

### Cold Start
```
API Gateway espera respuesta < 29 segundos
Si Lambda tarda > 29s: timeout

Solución: Warm-up o usar HTTP API
```

### Payload Size
```
Request: máximo 10 MB
Response: máximo 6 MB
```

### Caching
```
GET /usuarios?page=1
       ↓
Cachea 300 segundos (TTL)
       ↓
GET /usuarios?page=1 (dentro de 300s)
       ↓
Retorna de caché (¡más rápido!)
```

### CORS

```javascript
// API Gateway automáticamente agrega:
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

---

## 📋 Checklist: API Gateway Básico

```
[ ] ¿Necesito exponer Lambda como HTTP?
    → SÍ: Usa API Gateway
    
[ ] ¿Es REST API o WebSocket?
    → REST: REST API
    → Real-time: WebSocket API
    
[ ] ¿Necesito autenticación?
    → SÍ: JWT o API Key
    
[ ] ¿Tengo muchas peticiones?
    → SÍ: Configura rate limiting
    
[ ] ¿Tengo datos que no cambian?
    → SÍ: Habilita caching
    
[ ] ¿Accedo desde navegador?
    → SÍ: Habilita CORS
```

---

## 🔗 Próximos Pasos

1. **Leer**: `03-DynamoDB-Para-Dummies.md` (guardar datos)
2. **Leer**: `04-SQS-Para-Dummies.md` (colas asincrónicas)
3. **Experimentar**: Crear API Gateway en consola AWS
4. **Integrar**: Exponer tu NestJS como API Gateway

---

## 📚 Resumen Rápido

| Concepto | Qué es |
|----------|--------|
| **API Gateway** | Puerta HTTP a Lambda |
| **REST API** | Estándar HTTP (GET, POST, etc) |
| **HTTP API** | REST más rápido y barato |
| **WebSocket** | Conexión bidireccional real-time |
| **Throttling** | Limita peticiones por segundo |
| **Mapping** | Transforma requests/responses |
| **CORS** | Permite llamadas desde navegador |
| **JWT** | Token para autenticar usuarios |

---

## ✨ Conclusión

**API Gateway es perfecto para**:
- ✅ Exponer Lambda como API REST
- ✅ Proteger con autenticación
- ✅ Limitar uso (rate limiting)
- ✅ Cachear respuestas
- ✅ Múltiples rutas

**No es ideal para**:
- ❌ Streaming largo (> 29 seg)
- ❌ Aplicaciones complejas (usa ALB)
- ❌ Máximo rendimiento (usa NLB)

---

**¿Preguntas?** Consulta los otros archivos en esta carpeta o la documentación oficial de AWS.
