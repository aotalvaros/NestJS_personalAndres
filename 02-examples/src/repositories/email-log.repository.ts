/**
 * EmailLogRepository - Acceso a EmailLog
 *
 * Responsabilidades:
 * - Guardar registros de emails enviados
 * - Consultar historial de emails
 * - Analizar fallos de envío
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EmailLog, EmailStatus } from '../entities';

@Injectable()
export class EmailLogRepository extends Repository<EmailLog> {
  constructor(dataSource: DataSource) {
    super(EmailLog, dataSource.createEntityManager());
  }

  /**
   * Registrar envío de email
   */
  async logEmail(
    orderId: string,
    email: string,
    status: EmailStatus,
    errorMessage?: string,
  ): Promise<EmailLog> {
    const log = this.create({
      orderId,
      email,
      status,
      errorMessage,
    });

    return this.save(log);
  }

  /**
   * Obtener emails enviados para un pedido
   */
  async findByOrderId(orderId: string): Promise<EmailLog[]> {
    return this.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener emails fallidos (para debugging)
   */
  async findFailedEmails(limit: number = 100): Promise<EmailLog[]> {
    return this.find({
      where: { status: EmailStatus.FAILED },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Contar emails por status
   */
  async getEmailStats(): Promise<
    Array<{ status: EmailStatus; count: number }>
  > {
    return this.createQueryBuilder('email')
      .select('email.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('email.status')
      .getRawMany();
  }
}
