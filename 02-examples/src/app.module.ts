/**
 * AppModule - Módulo principal de la aplicación
 *
 * Responsabilidades:
 * 1. Conectar a PostgreSQL con TypeORM
 * 2. Configurar GraphQL Apollo Server
 * 3. Configurar Redis para caching
 * 4. Registrar todos los módulos, servicios, resolvers
 *
 * Arquitectura:
 * AppModule
 * ├── TypeOrmModule (PostgreSQL)
 * ├── GraphQLModule (Apollo Server)
 * ├── CacheModule (Redis)
 * ├── Services (lógica de negocio)
 * ├── Repositories (acceso a datos)
 * └── Resolvers (GraphQL)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { join } from 'path';

// Entities
import { Order, OrderItem, Payment, EmailLog, AuditLog } from './entities';

// Repositories
import { OrderRepository } from './repositories/order.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { EmailLogRepository } from './repositories/email-log.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

// Services
import { OrderService } from './services/order.service';
import { PaymentService } from './services/payment.service';
import { StripeService } from './services/mocks/stripe.service';
import { KafkaProducer } from './services/kafka.producer';
import { AuditConsumer } from './services/consumers/audit.consumer';
import { EmailConsumer } from './services/consumers/email.consumer';

// Resolvers
import { OrderResolver } from './graphql/resolvers/order.resolver';
import { PaymentResolver } from './graphql/resolvers/payment.resolver';

// Controllers
import { HealthController } from './health.controller';

@Module({
  imports: [
    /**
     * TypeORM - ORM para PostgreSQL
     *
     * Configuración:
     * - type: 'postgres' (database)
     * - database: 'orderdb' (nombre de BD)
     * - entities: [Order, OrderItem, Payment] (mapeos)
     * - synchronize: true en dev (auto-crear tablas)
     * - synchronize: false en prod (usar migrations)
     */
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'orderdb',
      entities: [Order, OrderItem, Payment, EmailLog, AuditLog],
      synchronize: process.env.NODE_ENV !== 'production', // false en prod
      logging: process.env.LOG_LEVEL === 'debug',
      dropSchema: process.env.NODE_ENV === 'test',
    }),

    /**
     * Registrar entidades para inyección de dependencias
     */
    TypeOrmModule.forFeature([Order, OrderItem, Payment, EmailLog, AuditLog]),

    /**
     * GraphQL - Apollo Server
     *
     * Configuración:
     * - driver: ApolloDriver
     * - autoSchemaFile: true (generar schema automáticamente)
     * - introspection: true (permitir exploración)
     * - playground: true en dev (Apollo Sandbox)
     */
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      introspection: true,
      playground: process.env.NODE_ENV !== 'production',
      sortSchema: true,
      context: ({ req }: any) => ({ req }),
    }),

    /**
     * Cache Manager - Redis
     *
     * Configuración:
     * - isGlobal: true (disponible en todos los servicios)
     * - ttl: 3600000 (1 hora default)
     *
     * En dev: memory store
     * En prod: redis store
     */
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000, // 1 hora
      // En producción, usar Redis:
      // store: redisStore,
      // host: 'localhost',
      // port: 6379,
    }),
  ],
  providers: [
    // Repositories
    OrderRepository,
    PaymentRepository,
    EmailLogRepository,
    AuditLogRepository,

    // Services
    OrderService,
    PaymentService,
    StripeService,
    KafkaProducer,

    // Consumers (escuchan eventos en background)
    AuditConsumer,
    EmailConsumer,

    // Resolvers
    OrderResolver,
    PaymentResolver,
  ],
  controllers: [HealthController],
})
export class AppModule {}
