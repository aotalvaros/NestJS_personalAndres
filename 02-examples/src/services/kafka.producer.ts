/**
 * KafkaProducer - Productor de Eventos
 *
 * Responsabilidades:
 * - Publicar eventos inmutables a Kafka
 * - Manejar reconexiones
 * - Logging de eventos publicados
 *
 * Eventos publicados:
 * - order.created: cuando se crea un pedido
 * - order.paid: cuando se procesa el pago
 * - order.shipped: cuando se envía el pedido
 *
 * Característica: Async (fire-and-forget)
 * El servicio de HTTP no espera confirmación de Kafka
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka } from 'kafkajs';

interface KafkaEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  timestamp: string;
  correlationId?: string;
}

/*La etiqueta @Injectable() permite que esta clase sea inyectada como dependencia en otros servicios o controladores de NestJS. 
Esto es fundamental para mantener una arquitectura modular y desacoplada, donde los servicios pueden interactuar entre sí sin necesidad de conocer los detalles de implementación de cada uno.*/
@Injectable() 
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('KafkaProducer');
  private kafka: Kafka;
  private producer: any;

  constructor() {
    // Inicializar Kafka con config desde env
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 5,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        multiplier: 2,
      },
    });
  }

  async onModuleInit() {
    // Solo conectar si Kafka está habilitado
    if (process.env.KAFKA_ENABLED === 'false') {
      this.logger.log('⏭️  Kafka Producer deshabilitado (KAFKA_ENABLED=false)');
      return;
    }

    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer conectado');
    } catch (error) {
      this.logger.warn('⚠️  Kafka Producer no disponible (continuando sin él)');
      this.logger.debug(`Detalles: ${error instanceof Error ? error.message : String(error)}`);
      // En dev/test puede fallar si Kafka no está disponible
      // En prod, lanzaríamos error
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('✅ Kafka Producer desconectado');
    } catch (error) {
      this.logger.error('❌ Fallo desconectar Kafka:', error);
    }
  }

  /**
   * Publicar evento a Kafka (async)
   *
   * Topic: "events"
   * Partition key: entityId (garantiza orden por entidad)
   */
  async publishEvent(event: KafkaEvent): Promise<void> {
    try {
      await this.producer.send({
        topic: 'events',
        messages: [
          {
            key: event.entityId, // Particionar por entityId → orden garantizado
            value: JSON.stringify(event),
            headers: {
              'event-type': event.eventType,
              'correlation-id': event.correlationId || event.entityId,
            },
          },
        ],
      });

      this.logger.debug(
        `📤 Evento publicado: ${event.eventType} (${event.entityId})`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Fallo publicar evento ${event.eventType}:`,
        error,
      );
      // En implementación real, reintentaríamos o usaríamos dead letter queue
      // Por ahora, solo loguear el error
    }
  }

  /**
   * Publicar evento específico: order.created
   */
  async publishOrderCreated(
    orderId: string,
    customerId: string,
    totalAmount: number,
    itemsCount: number,
    correlationId?: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: 'order.created',
      entityType: 'Order',
      entityId: orderId,
      data: {
        customerId,
        totalAmount,
        itemsCount,
      },
      timestamp: new Date().toISOString(),
      correlationId,
    });
  }

  /**
   * Publicar evento específico: order.paid
   */
  async publishOrderPaid(
    orderId: string,
    paymentId: string,
    amount: number,
    transactionId: string,
    correlationId?: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: 'order.paid',
      entityType: 'Order',
      entityId: orderId,
      data: {
        paymentId,
        amount,
        transactionId,
      },
      timestamp: new Date().toISOString(),
      correlationId,
    });
  }

  /**
   * Publicar evento específico: order.shipped
   */
  async publishOrderShipped(
    orderId: string,
    trackingNumber: string,
    correlationId?: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: 'order.shipped',
      entityType: 'Order',
      entityId: orderId,
      data: {
        trackingNumber,
      },
      timestamp: new Date().toISOString(),
      correlationId,
    });
  }
}
