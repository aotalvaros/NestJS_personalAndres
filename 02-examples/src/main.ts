/**
 * main.ts - Entry Point de la Aplicación
 *
 * Responsabilidades:
 * 1. Crear la aplicación NestJS
 * 2. Configurar GraphQL Apollo Server
 * 3. Conectar servicios externos (DB, Kafka, RabbitMQ)
 * 4. Iniciar servidor en puerto 3000
 * 5. Configurar graceful shutdown
 *
 * Stack:
 * - NestJS Framework
 * - GraphQL Apollo Server
 * - TypeORM con PostgreSQL
 * - Redis para caching
 * - Kafka para eventos
 * - RabbitMQ para tareas
 *
 * Flujo de startup:
 * main.ts → AppModule → (Entities, Services, Resolvers, Consumers)
 *           ↓
 *       Conectar BD
 *           ↓
 *       Conectar Kafka
 *           ↓
 *       Conectar RabbitMQ
 *           ↓
 *       Escuchar en :3000
 */

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validar inputs automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en los DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no definidas
      transform: true,  // Transforma payloads a objetos de clase
      transformOptions: {
        enableImplicitConversion: true, // Permite conversión implícita de tipos (e.g., string a number)
      },
    }),
  );

  // CORS en development
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors();
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Order Service listening on port ${port}`);
  logger.log(`📡 GraphQL: http://localhost:${port}/graphql`);

  // Manejar shutdown gracioso, cerrando conexiones y liberando recursos
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // Manejar Ctrl+C (SIGINT) para shutdown gracioso
  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

// Iniciar la aplicación y manejar errores fatales
bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
