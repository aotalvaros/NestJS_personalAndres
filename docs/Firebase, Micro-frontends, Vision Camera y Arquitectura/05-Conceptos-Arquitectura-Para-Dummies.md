# 🏛️ Conceptos de Arquitectura Para Dummies

> **Objetivo**: Entender los patrones y conceptos de arquitectura de software más importantes, usando analogías del mundo real. Sin jerga innecesaria.

---

## Índice

1. [Monolito vs Microservicios](#1-monolito-vs-microservicios)
2. [REST vs GraphQL vs gRPC](#2-rest-vs-graphql-vs-grpc)
3. [Event-Driven Architecture](#3-event-driven-architecture-arquitectura-orientada-a-eventos)
4. [CQRS](#4-cqrs-command-query-responsibility-segregation)
5. [Clean Architecture](#5-clean-architecture--arquitectura-hexagonal)
6. [CAP Theorem](#6-cap-theorem)
7. [Patrones de Resiliencia](#7-patrones-de-resiliencia)
8. [Patrones de Datos](#8-patrones-de-datos)

---

## 1. Monolito vs Microservicios

### La Analogía del Restaurante

**Monolito = Restaurante pequeño de barrio**
- Un cocinero hace todo: cocina, sirve, cobra, limpia
- Si el cocinero se enferma → el restaurante cierra
- Fácil de manejar cuando es pequeño
- Escalar significa contratar más cocineros que hacen lo mismo

**Microservicios = Restaurante de cadena (McDonald's)**
- Hay personas especializadas: cajero, cocinero de hamburguesas, cocinero de papas, persona de bebidas
- Si falla la máquina de bebidas → las hamburguesas siguen saliendo
- Cada estación puede trabajar a su propio ritmo
- Puedes poner más personas solo en la estación que está saturada

```mermaid
graph TB
    subgraph Monolito["🏠 Monolito"]
        M["Una sola aplicación
        
        ├── Usuarios
        ├── Pedidos  
        ├── Pagos
        ├── Inventario
        └── Notificaciones
        
        Un deploy, una BD, un proceso"]
    end

    subgraph Micro["🏢 Microservicios"]
        S1["👤 Servicio\nUsuarios\n:3001"]
        S2["🛒 Servicio\nPedidos\n:3002"]
        S3["💳 Servicio\nPagos\n:3003"]
        S4["📦 Servicio\nInventario\n:3004"]
        S5["🔔 Servicio\nNotificaciones\n:3005"]
        GW["🚪 API Gateway\n(punto de entrada único)"]

        GW --> S1
        GW --> S2
        GW --> S3
        GW --> S4
        GW --> S5
    end
```

### ¿Cuándo usar cada uno?

| Situación | Monolito | Microservicios |
|-----------|----------|----------------|
| Startup / MVP | ✅ Ideal | ❌ Over-engineering |
| Equipo pequeño (< 8 devs) | ✅ | ❌ |
| Necesitas escalar partes específicas | ❌ | ✅ |
| Múltiples equipos independientes | ❌ | ✅ |
| Alta disponibilidad por módulo | ❌ | ✅ |
| Complejidad de red aceptable | N/A | Debes manejarla |

> **Regla de oro**: Empieza con un monolito bien estructurado. Extrae microservicios cuando el dolor sea real, no anticipado.

---

## 2. REST vs GraphQL vs gRPC

### La Analogía del Restaurante (de nuevo, pero diferente)

**REST = Menú fijo**
Llegas al restaurante y el menú dice:
- `GET /platos` → lista todos los platos
- `GET /platos/5` → el plato #5
- `POST /pedidos` → hacer un pedido

El problema: si solo quieres saber el nombre del plato #5, igual recibes toda la información (ingredientes, precio, calorías, alérgenos...). **Overfetching**.

**GraphQL = "Pide exactamente lo que quieres"**
Como hablar con el mesero directamente:
- "Quiero solo el nombre y precio del plato #5"
- "Y también dime cuántos pedidos tiene ese plato hoy"
- Todo en una sola petición, exactamente lo que pediste. Ni más, ni menos.

**gRPC = Intercom entre cocinas**
No es para el cliente final. Es la comunicación interna entre el servicio de pedidos y el de inventario: ultrarrápido, binario, eficiente. Como el sistema de intercomunicación interno del restaurante.

```mermaid
graph LR
    subgraph REST["📋 REST"]
        R_C["Cliente"] -->|"GET /users/1\n(trae TODO el usuario)"| R_S["Servidor"]
        R_S -->|"{ id, name, email, address,\nphone, createdAt, ... }"| R_C
        style REST fill:#fff3cd
    end

    subgraph GQL["🎯 GraphQL"]
        G_C["Cliente"] -->|"query { user(id:1)\n{ name email } }"| G_S["Servidor"]
        G_S -->|"{ name: 'Andrés',\nemail: 'a@...' }"| G_C
        style GQL fill:#d4edda
    end

    subgraph GRPC["⚡ gRPC"]
        P_C["Servicio A"] -->|"Binario protobuf\n(ultrarrápido)"| P_S["Servicio B"]
        P_S -->|"Respuesta binaria"| P_C
        style GRPC fill:#cce5ff
    end
```

### Comparativa detallada

| Aspecto | REST | GraphQL | gRPC |
|---------|------|---------|------|
| **Formato** | JSON | JSON | Binario (Protobuf) |
| **Protocolo** | HTTP/1.1 | HTTP/1.1 | HTTP/2 |
| **Tipado** | ❌ (OpenAPI opcional) | ✅ Schema fuerte | ✅ Protobuf |
| **Overfetching** | ⚠️ Común | ✅ Ninguno | N/A |
| **Underfetching** | ⚠️ Múltiples requests | ✅ Todo en uno | N/A |
| **Curva aprendizaje** | Baja | Media | Alta |
| **Caching** | ✅ Nativo (HTTP) | ⚠️ Complejo | ❌ Manual |
| **Ideal para** | APIs públicas simples | Apps complejas, mobile | Comunicación interna |

### Ejemplo visual: El problema de underfetching en REST

```mermaid
sequenceDiagram
    participant App as 📱 App
    participant API as 🌐 REST API

    Note over App,API: Pantalla de perfil necesita: usuario + sus pedidos + sus reseñas

    App->>API: GET /users/1
    API->>App: { id, name, email... }

    App->>API: GET /users/1/orders
    API->>App: [{ orderId, total... }]

    App->>API: GET /users/1/reviews
    API->>App: [{ reviewId, text... }]

    Note over App: 3 requests para una sola pantalla 😰
```

```mermaid
sequenceDiagram
    participant App as 📱 App
    participant GQL as 🎯 GraphQL API

    Note over App,GQL: La misma pantalla con GraphQL

    App->>GQL: query { user(id:1) { name orders { total } reviews { text } } }
    GQL->>App: Todo en una sola respuesta ✅

    Note over App: 1 request para la misma pantalla 🎉
```

---

## 3. Event-Driven Architecture (Arquitectura Orientada a Eventos)

### La Analogía del Periódico

**Arquitectura tradicional (llamadas directas)**:
Como llamar por teléfono a cada persona para contarles una noticia. Tú llamas a Juan, luego a María, luego a Pedro... Si María no contesta → problema.

**Event-Driven**:
Como publicar una noticia en el periódico. Tú la publicas (evento), y quien quiera enterarse (suscriptores) la lee cuando pueda. Tú no necesitas saber quién la leerá.

```mermaid
graph TB
    subgraph Tradicional["📞 Arquitectura Tradicional (acoplada)"]
        OS["Servicio\nPedidos"] -->|"HTTP call"| PS["Servicio\nPagos"]
        OS -->|"HTTP call"| NS["Servicio\nNotificaciones"]
        OS -->|"HTTP call"| IS["Servicio\nInventario"]
        style Tradicional fill:#ffe0e0
        Note1["⚠️ Si Pagos falla → todo falla\n⚠️ Pedidos espera a que todos respondan"]
    end

    subgraph EDA["📰 Event-Driven (desacoplada)"]
        O2["Servicio\nPedidos"] -->|"publica evento\norder.created"| Bus["🚌 Message Bus\n(Kafka / RabbitMQ)"]
        Bus -->|"consume"| P2["Servicio\nPagos"]
        Bus -->|"consume"| N2["Servicio\nNotificaciones"]
        Bus -->|"consume"| I2["Servicio\nInventario"]
        style EDA fill:#e0ffe0
        Note2["✅ Pedidos solo publica y sigue\n✅ Si Notificaciones falla → se reintenta\n✅ Cero acoplamiento"]
    end
```

### Kafka vs RabbitMQ — ¿Cuál elegir?

**Kafka = Cinta transportadora de fábrica**
- Los mensajes quedan grabados (log inmutable)
- Puedes "rebobinar" y releer mensajes viejos
- Diseñado para millones de eventos por segundo
- Los consumidores llevan su propio "marcador" de dónde van

**RabbitMQ = Bandeja de entrada de correo**
- El mensaje llega, alguien lo procesa, y desaparece
- Si nadie lo procesa → se puede reencolar o ir a Dead Letter Queue
- Más simple, ideal para tareas de trabajo (job queue)

```mermaid
graph LR
    subgraph Kafka["🏭 Kafka (Event Stream)"]
        KP["Productor"] --> KT["Topic: order.events\n[msg1][msg2][msg3][msg4][msg5]"]
        KT -->|"Offset 3"| KC1["Consumidor A\n(Pagos)"]
        KT -->|"Offset 1"| KC2["Consumidor B\n(Analytics)"]
        Note["Los mensajes persisten\nCada consumidor lleva su posición"]
    end

    subgraph RMQ["📬 RabbitMQ (Message Queue)"]
        RP["Productor"] --> RQ["Queue: send_email"]
        RQ -->|"procesa y borra"| RC1["Worker 1"]
        RQ -->|"procesa y borra"| RC2["Worker 2"]
        Note2["El mensaje desaparece\nUno de los workers lo procesa"]
    end
```

| | Kafka | RabbitMQ |
|---|---|---|
| **Persistencia** | ✅ Días/meses | ⚠️ Hasta que se procesa |
| **Replay** | ✅ Puedes releer | ❌ No |
| **Throughput** | Millones/seg | Miles/seg |
| **Complejidad** | Alta | Media |
| **Ideal para** | Event sourcing, analytics | Tasks, emails, notificaciones |

---

## 4. CQRS (Command Query Responsibility Segregation)

### La Analogía de la Biblioteca

Imagina una biblioteca con dos mostradores:
- **Mostrador de CONSULTAS** 📖: Solo para buscar y leer libros. Muy rápido, hay muchos empleados, la cola es corta.
- **Mostrador de COMANDOS** ✏️: Para devolver, reservar, agregar libros nuevos. Puede ser más lento, pero no afecta a los que solo leen.

**CQRS = separar las operaciones de lectura (Query) de las de escritura (Command)**.

```mermaid
graph TB
    subgraph Sin["❌ Sin CQRS (mismo modelo para todo)"]
        Client1["Cliente"] -->|"leer pedidos\ny crear pedido\ny actualizar pedido"| DB1["📊 Base de Datos\n(una sola, sobrecargada)"]
    end

    subgraph Con["✅ Con CQRS"]
        Client2["Cliente"]
        
        Client2 -->|"Command: CreateOrder\nCommand: UpdateOrder"| CW["✏️ Write Model\n(optimizado para escritura)"]
        Client2 -->|"Query: GetOrders\nQuery: GetOrderById"| CR["📖 Read Model\n(optimizado para lectura)"]
        
        CW -->|"escribe"| DBW["🗄️ BD Principal\n(PostgreSQL)"]
        DBW -->|"sincroniza eventos"| DBR["📋 BD de Lectura\n(Redis / Elasticsearch)"]
        CR -->|"lee"| DBR
    end
```

```typescript
// ❌ Sin CQRS: el servicio hace todo
class OrderService {
  async createOrder(dto: CreateOrderDto) { /* escribe */ }
  async getOrders(userId: string) { /* lee */ }
  async getOrderById(id: string) { /* lee */ }
  async updateOrder(id: string, dto: UpdateOrderDto) { /* escribe */ }
}

// ✅ Con CQRS: separado por responsabilidad
// Commands (cambian estado)
class CreateOrderCommand {
  constructor(public readonly userId: string, public readonly items: Item[]) {}
}

class CreateOrderHandler {
  async execute(command: CreateOrderCommand) {
    const order = await this.orderRepo.save(new Order(command));
    await this.eventBus.publish(new OrderCreatedEvent(order.id)); // Emite evento
    return order.id;
  }
}

// Queries (solo leen, sin efectos secundarios)
class GetOrdersQuery {
  constructor(public readonly userId: string) {}
}

class GetOrdersHandler {
  async execute(query: GetOrdersQuery) {
    // Lee desde la BD optimizada para lectura (Redis/Elasticsearch)
    return this.readRepo.findByUserId(query.userId);
  }
}
```

**¿Cuándo tiene sentido?**
- Apps con **muchas más lecturas que escrituras** (redes sociales, catálogos)
- Necesitas **modelos de lectura especializados** (vistas desnormalizadas)
- Sistema con **Event Sourcing** (todo es un evento)

---

## 5. Clean Architecture / Arquitectura Hexagonal

### La Analogía de la Cebolla

Imagina una cebolla: tiene capas, y el núcleo (el centro) no sabe nada de las capas exteriores. Puedes cambiar la capa exterior sin afectar el centro.

**El centro = tu lógica de negocio** (reglas, validaciones, cálculos)
**Las capas exteriores = detalles técnicos** (base de datos, HTTP, Firebase, etc.)

La regla de oro: **las dependencias solo apuntan hacia adentro**, nunca hacia afuera.

```mermaid
graph TD
    subgraph Layers["🧅 Clean Architecture (capas)"]
        E["🎯 Entities / Domain\n(Reglas de negocio puras)\nOrder, Payment, User\nSin imports externos"]
        UC["📋 Use Cases / Application\n(Lógica de la app)\nCreateOrder, ProcessPayment\nDepende solo de Entities"]
        I["🔌 Interface Adapters\n(Controladores, Repositorios)\nOrderController, OrderRepository\nTraduce entre Use Cases y externos"]
        F["🌐 Frameworks & Drivers\n(Detalles técnicos)\nExpress/NestJS, PostgreSQL,\nFirebase, Kafka, Redis"]

        F -->|"solo llama a"| I
        I -->|"solo llama a"| UC
        UC -->|"solo llama a"| E
        E -.->|"no sabe nada de"| F
    end
```

```typescript
// ✅ Clean Architecture en NestJS

// 1. ENTITY (núcleo puro, sin dependencias)
export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public status: OrderStatus,
  ) {}

  // Lógica de negocio aquí, no en el servicio
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  canBeCancelled(): boolean {
    return this.status === OrderStatus.PENDING;
  }
}

// 2. REPOSITORY INTERFACE (contrato, no implementación)
export abstract class OrderRepository {
  abstract save(order: Order): Promise<Order>;
  abstract findById(id: string): Promise<Order | null>;
  abstract findByUserId(userId: string): Promise<Order[]>;
}

// 3. USE CASE (lógica de la aplicación)
@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository, // Interfaz, no implementación
    private readonly eventBus: EventBus,
  ) {}

  async execute(userId: string, items: Item[]): Promise<string> {
    const order = new Order(uuid(), userId, items, OrderStatus.PENDING);
    await this.orderRepo.save(order);
    await this.eventBus.publish(new OrderCreatedEvent(order.id));
    return order.id;
  }
}

// 4. IMPLEMENTACIÓN (capa de infraestructura)
@Injectable()
export class TypeOrmOrderRepository extends OrderRepository {
  // Aquí usas TypeORM, la interfaz no sabe nada de esto
  async save(order: Order): Promise<Order> {
    return this.ormRepo.save(order);
  }
}
```

**El beneficio**: puedes cambiar PostgreSQL por MongoDB, o NestJS por Express, sin tocar nada de tu lógica de negocio.

---

## 6. CAP Theorem

### La Analogía del Banco con Sucursales

Imagina un banco con 3 sucursales (nodos). El teorema CAP dice que **en caso de falla de red, solo puedes garantizar 2 de estas 3 cosas**:

- **C - Consistency (Consistencia)**: Todas las sucursales muestran el mismo saldo
- **A - Availability (Disponibilidad)**: Siempre puedes hacer una transacción
- **P - Partition Tolerance (Tolerancia a Particiones)**: El sistema sigue funcionando aunque una sucursal pierda comunicación

```mermaid
graph TD
    CAP["Teorema CAP\n(elige 2 de 3)"]
    
    C["C - Consistency\nTodos los nodos ven\nlos mismos datos al mismo tiempo"]
    A["A - Availability\nCada request recibe\nuna respuesta (sin timeout)"]
    P["P - Partition Tolerance\nEl sistema sigue si\nhay fallas de red"]

    CAP --- C
    CAP --- A
    CAP --- P

    CA["CA Systems\nPostgreSQL, MySQL\n(monolito, una sola red)"]
    CP["CP Systems\nMongoDB, HBase\nZooKeeper\n(consistente pero puede no responder)"]
    AP["AP Systems\nCassandra, CouchDB\nDynamoDB\n(siempre responde, puede ser stale)"]

    C & A --> CA
    C & P --> CP
    A & P --> AP

    style CA fill:#fff3cd
    style CP fill:#cce5ff
    style AP fill:#d4edda
```

**En la práctica**:
- La **P (tolerancia a particiones)** es casi obligatoria en sistemas distribuidos (la red siempre puede fallar)
- Por eso el dilema real es: **¿Consistencia o Disponibilidad?**
- **CP**: "Prefiero no responder antes que dar datos incorrectos" (ej: transacciones bancarias)
- **AP**: "Prefiero responder aunque los datos no sean los más recientes" (ej: timeline de redes sociales)

---

## 7. Patrones de Resiliencia

### Circuit Breaker — "El Interruptor de Luz"

**Analogía**: El breaker eléctrico de tu casa. Si hay un cortocircuito, el breaker se dispara (abre el circuito) para proteger el resto de la instalación. Después de un tiempo, puedes intentar volver a cerrarlo.

```mermaid
stateDiagram-v2
    [*] --> Cerrado: Estado inicial
    
    Cerrado --> Abierto: N fallos consecutivos\n(ej: 5 errores en 10 seg)
    Abierto --> MedioAbierto: Timeout de espera\n(ej: 30 segundos)
    MedioAbierto --> Cerrado: Request exitoso ✅
    MedioAbierto --> Abierto: Request falla ❌

    Cerrado: 🟢 Cerrado\nDeja pasar las llamadas
    Abierto: 🔴 Abierto\nRechaza todo inmediatamente\n(fail fast)
    MedioAbierto: 🟡 Medio Abierto\nPrueba con un request
```

```typescript
// Implementación simple de Circuit Breaker
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold = 5,       // Fallos antes de abrir
    private readonly timeout = 30_000,    // ms antes de probar de nuevo
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker OPEN: servicio no disponible');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Retry con Exponential Backoff — "El Vendedor Persistente"

**Analogía**: Llamas a un cliente, no contesta. Vuelves a llamar en 1 min, luego en 2 min, luego en 4 min... No llamas cada segundo (eso sería molesto y colapsaría el sistema).

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      // Espera exponencial: 1s, 2s, 4s... + jitter aleatorio
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Bulkhead — "Los Compartimentos del Barco"

**Analogía**: Los barcos tienen compartimentos estancos. Si uno se inunda, los demás no se ven afectados. El barco no se hunde todo.

En software: aislar los recursos (threads, conexiones) entre servicios para que si uno se satura, no afecte a los demás.

```mermaid
graph TB
    subgraph Sin["❌ Sin Bulkhead"]
        P1["Pool de conexiones: 100"]
        P1 -->|"90 conexiones"| S1["Servicio Pagos\n(lento)"]
        P1 -->|"solo 10 quedan"| S2["Servicio Usuarios\n(rápido pero sin recursos)"]
        P1 -->|"0 conexiones"| S3["Servicio Pedidos\n(bloqueado)"]
    end

    subgraph Con["✅ Con Bulkhead"]
        P2["Pool Pagos: 30"]
        P3["Pool Usuarios: 30"]
        P4["Pool Pedidos: 30"]
        P2 --> B1["Servicio Pagos"]
        P3 --> B2["Servicio Usuarios"]
        P4 --> B3["Servicio Pedidos"]
        Note["Si Pagos se satura, no afecta\na Usuarios ni Pedidos ✅"]
    end
```

---

## 8. Patrones de Datos

### Saga Pattern — "El Coordinador de la Boda"

**Problema**: En microservicios, una operación que toca varios servicios no puede usar una sola transacción de BD. ¿Cómo garantizas que todo queda consistente?

**Analogía**: Organizar una boda. Reservas el salón, el catering, el fotógrafo, el DJ. Si el fotógrafo cancela → tienes que cancelar todo lo demás en orden. La Saga es el coordinador que sabe qué cancelar y en qué orden.

```mermaid
sequenceDiagram
    participant O as 🛒 Order Service
    participant P as 💳 Payment Service
    participant I as 📦 Inventory Service
    participant N as 🔔 Notification Service

    Note over O,N: ✅ Camino feliz
    O->>P: Cobra el pago
    P->>O: ✅ Pago exitoso
    O->>I: Reserva inventario
    I->>O: ✅ Inventario reservado
    O->>N: Envía confirmación
    N->>O: ✅ Email enviado

    Note over O,N: ❌ Compensación si falla inventario
    O->>P: Cobra el pago
    P->>O: ✅ Pago exitoso
    O->>I: Reserva inventario
    I->>O: ❌ Sin stock
    O->>P: COMPENSACIÓN: Reembolsa el pago
    P->>O: ✅ Reembolso hecho
    O->>N: Notifica al usuario el fallo
```

### Event Sourcing — "La Historia Completa"

**Analogía**: En vez de guardar solo el saldo actual de tu cuenta bancaria, guardas **todo el historial de transacciones**: depósito +500, retiro -100, depósito +200... El saldo actual (500+200-100 = 600) se calcula a partir del historial.

```mermaid
graph LR
    subgraph CRUD["❌ CRUD Tradicional\n(solo guarda el estado actual)"]
        BD1["BD: Orders\norder_id: 1\nstatus: 'shipped'\ntotal: 150"]
        Note1["¿Cómo llegó a 'shipped'?\n¿Quién cambió el total?\nNo lo sé 🤷"]
    end

    subgraph ES["✅ Event Sourcing\n(guarda cada evento)"]
        E1["1. OrderCreated\n{items: [...], total: 150}"]
        E2["2. PaymentReceived\n{amount: 150}"]
        E3["3. OrderShipped\n{trackingId: 'XYZ'}"]
        E1 --> E2 --> E3
        Note2["Estado actual = replay de eventos\nAudit trail completo ✅\nPuedo volver a cualquier punto ✅"]
    end
```

---

## 🗺️ Mapa Mental de Todos los Conceptos

```mermaid
mindmap
  root((Arquitectura\nde Software))
    Estructura
      Monolito
      Microservicios
      Serverless
    Comunicación
      REST
      GraphQL
      gRPC
      Event-Driven
    Patrones de Diseño
      CQRS
      Clean Architecture
      Hexagonal
      Event Sourcing
      Saga
    Resiliencia
      Circuit Breaker
      Retry + Backoff
      Bulkhead
      Timeout
    Teoría
      CAP Theorem
      BASE vs ACID
      Consistencia eventual
```

---

## 🧭 ¿Qué patrón usar en cada situación?

| Situación | Patrón recomendado |
|-----------|-------------------|
| App pequeña que crece | Monolito bien estructurado → extraer microservicios cuando duela |
| App con muchas lecturas | CQRS + Read models optimizados |
| Operación distribuida que debe ser atómica | Saga Pattern |
| Necesitas auditoría total de cambios | Event Sourcing |
| Lógica de negocio compleja | Clean Architecture |
| Servicio externo poco confiable | Circuit Breaker + Retry |
| Comunicación entre servicios internos | gRPC o eventos (Kafka) |
| API para clientes móviles complejos | GraphQL |
| API pública simple | REST |

---

## 📌 Resumen de Todo

| Concepto | En una frase |
|----------|-------------|
| **Monolito** | Todo en uno, simple de empezar, difícil de escalar |
| **Microservicios** | Piezas independientes, complejas de operar, fáciles de escalar |
| **REST** | Menú fijo de endpoints, estándar y simple |
| **GraphQL** | Pide exactamente lo que necesitas, ideal para mobile |
| **gRPC** | Comunicación ultrarrápida entre servicios internos |
| **Event-Driven** | Servicios se comunican por eventos, no por llamadas directas |
| **CQRS** | Separa leer de escribir para optimizar cada uno |
| **Clean Architecture** | El negocio en el centro, los detalles técnicos afuera |
| **CAP Theorem** | Distribuido = elige entre consistencia o disponibilidad |
| **Circuit Breaker** | Corta el circuito si un servicio falla, para no cascadear fallos |
| **Saga** | Coordina transacciones distribuidas con compensaciones |
| **Event Sourcing** | Guarda eventos, no estados; el estado se reconstruye |

---

## 🔗 Navegación

👈 [04-Push-Notifications-Para-Dummies.md](./04-Push-Notifications-Para-Dummies.md)  
👈 [01-Firebase-Para-Dummies.md](./01-Firebase-Para-Dummies.md) ← volver al inicio
