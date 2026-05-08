/**
 * AuditConsumer - Consumidor de Eventos Kafka
 *
 * Responsabilidades:
 * - Escuchar eventos de Kafka (topic: "events")
 * - Registrar en audit_logs table
 * - Mantener offset para permitir replay
 *
 * Inicializado cuando módulo carga (OnModuleInit)
 * Se ejecuta en background sin bloquear la aplicación
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { AuditLogRepository } from '../../repositories/audit-log.repository';

@Injectable()
export class AuditConsumer implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('AuditConsumer');
  private kafka: Kafka;
  private consumer: any;

  constructor(private auditLogRepository: AuditLogRepository) {
    this.kafka = new Kafka({
      clientId: 'audit-consumer',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'audit-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    // Solo conectar si Kafka está habilitado
    if (process.env.KAFKA_ENABLED === 'false') {
      this.logger.log('⏭️  AuditConsumer deshabilitado (KAFKA_ENABLED=false)');
      return;
    }

    try {
      await this.consumer.connect();
      this.logger.log('✅ AuditConsumer conectado a Kafka');

      // Suscribirse al topic "events"
      await this.consumer.subscribe({
        topic: 'events',
        fromBeginning: false, // Solo eventos nuevos (no replay histórico)
      });

      // Comenzar a procesar mensajes
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: any) => {
          await this.handleMessage(message);
        },
      });
    } catch (error) {
      this.logger.warn('⚠️  AuditConsumer no disponible (continuando sin él)');
      this.logger.debug(`Detalles: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('✅ AuditConsumer desconectado');
    } catch (error) {
      this.logger.error('❌ Fallo desconectar AuditConsumer:', error);
    }
  }

  /**
   * Procesar mensaje de Kafka
   */
  private async handleMessage(message: any) {
    try {
      const event = JSON.parse(message.value.toString());

      this.logger.debug(
        `📥 Evento recibido: ${event.eventType} (${event.entityId})`,
      );

      // Registrar en base de datos
      await this.auditLogRepository.logEvent(
        event.eventType,
        event.entityType,
        event.entityId,
        event.data,
        message.headers?.['correlation-id']?.toString(),
      );

      this.logger.debug(
        `✅ Evento registrado en audit_logs: ${event.eventType}`,
      );
    } catch (error) {
      this.logger.error('❌ Error procesando evento:', error);
      // No relanzar error para no parar el consumer
      // En implementación real, enviaríamos a DLQ
    }
  }
}
