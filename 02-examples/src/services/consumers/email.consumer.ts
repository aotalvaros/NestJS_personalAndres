/**
 * EmailConsumer - Consumidor de Tareas RabbitMQ
 *
 * Responsabilidades:
 * - Escuchar mensajes de cola email-queue
 * - Obtener email del cliente
 * - Validar contra blacklist
 * - Enviar email (mocked)
 * - Registrar en email_logs
 * - Reintentar hasta 3 veces si falla
 *
 * Inicializado cuando módulo carga (OnModuleInit)
 * Se ejecuta en background
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EmailLogRepository } from '../../repositories/email-log.repository';
import { EmailStatus } from '../../entities';

@Injectable()
export class EmailConsumer implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('EmailConsumer');
  private connection: any;
  private channel: any;

  constructor(private emailLogRepository: EmailLogRepository) {}

  async onModuleInit() {
    // Solo conectar si RabbitMQ está habilitado
    if (process.env.RABBITMQ_ENABLED === 'false') {
      this.logger.log('⏭️  EmailConsumer deshabilitado (RABBITMQ_ENABLED=false)');
      return;
    }

    try {
      // Conectar a RabbitMQ
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.logger.log('✅ EmailConsumer conectado a RabbitMQ');

      // Declarar cola
      const queue = 'email-queue';
      const dlq = 'email-dlq'; // Dead Letter Queue

      await this.channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': dlq,
        },
      });

      await this.channel.assertQueue(dlq, { durable: true });

      // Consumir mensajes (máximo 1 a la vez para procesamiento secuencial)
      await this.channel.prefetch(1);
      await this.channel.consume(queue, async (msg: any) => {
        if (msg) {
          await this.handleMessage(msg);
        }
      });

      this.logger.log(`📨 EmailConsumer escuchando ${queue}`);
    } catch (error) {
      this.logger.warn('⚠️  EmailConsumer no disponible (continuando sin él)');
      this.logger.debug(`Detalles: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('✅ EmailConsumer desconectado');
    } catch (error) {
      this.logger.error('❌ Fallo desconectar EmailConsumer:', error);
    }
  }

  /**
   * Procesar mensaje de RabbitMQ
   */
  private async handleMessage(msg: amqp.ConsumeMessage) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const content = JSON.parse(msg.content.toString());
        const { orderId, customerId } = content;

        this.logger.debug(`📨 Enviando email para orden ${orderId}`);

        // 1. Obtener email del cliente (mocked)
        const email = await this.getCustomerEmail(customerId);

        // 2. Validar contra blacklist
        if (this.isBlacklisted(email)) {
          await this.emailLogRepository.logEmail(
            orderId,
            email,
            EmailStatus.SKIPPED,
            'Email en blacklist',
          );

          this.channel.ack(msg);
          this.logger.debug(`⏭️  Email skipped (blacklist): ${email}`);
          return;
        }

        // 3. Enviar email (mocked - simula fallo aleatorio 10%)
        const sendSuccess = Math.random() > 0.1; // 90% exitoso
        if (!sendSuccess && retries < maxRetries - 1) {
          throw new Error('Simulated email send failure');
        }

        // 4. Registrar exitoso
        await this.emailLogRepository.logEmail(
          orderId,
          email,
          EmailStatus.SUCCESS,
        );

        this.channel.ack(msg);
        this.logger.log(`✅ Email enviado: ${email}`);
        return;
      } catch (error) {
        retries++;
        this.logger.warn(
          `⚠️  Reintento ${retries}/${maxRetries}: ${error.message}`,
        );

        if (retries >= maxRetries) {
          // Guardar en email_logs como fallido
          try {
            const content = JSON.parse(msg.content.toString());
            await this.emailLogRepository.logEmail(
              content.orderId,
              content.email || 'unknown',
              EmailStatus.FAILED,
              error.message,
            );
          } catch (logError) {
            this.logger.error('Error logging failed email:', logError);
          }

          // Nack → Enviar a DLQ
          this.channel.nack(msg, false, false);
          this.logger.error(
            `❌ Email fallido después de ${maxRetries} reintentos`,
          );
          return;
        }

        // Esperar antes de reintentar (backoff exponencial)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retries - 1)),
        );
      }
    }
  }

  /**
   * Mock: Obtener email del cliente (en prod: llamar API)
   */
  private async getCustomerEmail(customerId: string): Promise<string> {
    // Simular latencia
    await new Promise((resolve) => setTimeout(resolve, 50));
    return `customer-${customerId.substring(0, 8)}@example.com`;
  }

  /**
   * Verificar si email está en blacklist
   */
  private isBlacklisted(email: string): boolean {
    const blacklist = ['noreply@', 'no-reply@', 'test@invalid.com'];
    return blacklist.some((pattern) => email.includes(pattern));
  }
}
