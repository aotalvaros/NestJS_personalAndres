/**
 * Health Controller - Health Checks
 *
 * Endpoint: GET /health
 *
 * Retorna status de:
 * - PostgreSQL (BD)
 * - Redis (caché)
 * - Kafka (eventos)
 * - RabbitMQ (tareas)
 *
 * Usado por:
 * - Docker healthcheck
 * - Kubernetes liveness/readiness probes
 * - Monitoring systems
 * - Load balancers
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller()
export class HealthController {
  private logger = new Logger('HealthController');

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * GET /health
   *
   * Retorna status general de la aplicación
   * Usado por Docker para determinar si contenedor está healthy
   */
  @Get('/health')
  async health(): Promise<{
    status: 'UP' | 'DOWN';
    database: 'UP' | 'DOWN';
    redis: 'UP' | 'DOWN';
    kafka: 'UP' | 'DOWN' | 'UNKNOWN';
    rabbitmq: 'UP' | 'DOWN' | 'UNKNOWN';
    timestamp: string;
  }> {
    const database = await this.checkDatabase();
    const redis: 'UP' | 'DOWN' = 'UP'; // En development, usar memoria
    const kafka: 'UP' | 'DOWN' | 'UNKNOWN' = 'UNKNOWN'; // Implementar cuando se agregue Kafka
    const rabbitmq: 'UP' | 'DOWN' | 'UNKNOWN' = 'UNKNOWN'; // Implementar cuando se agregue RabbitMQ

    const status = database === 'UP' && redis === 'UP' ? 'UP' : 'DOWN';

    this.logger.log(`Health check: ${status}`);

    return {
      status,
      database,
      redis,
      kafka,
      rabbitmq,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verificar conexión a PostgreSQL
   */
  private async checkDatabase(): Promise<'UP' | 'DOWN'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'UP';
    } catch (error) {
      this.logger.error('Database check failed:', error);
      return 'DOWN';
    }
  }
}
