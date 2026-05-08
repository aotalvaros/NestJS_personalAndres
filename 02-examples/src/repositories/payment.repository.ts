/**
 * PaymentRepository - Patrón Repository para Payments
 *
 * Responsabilidades:
 * 1. Acceso a datos (TypeORM Repository)
 * 2. Queries para pagos
 * 3. Métodos para conciliación (por transactionId)
 * 4. Búsquedas por estado y rango de fechas
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { Payment, PaymentStatus } from '../entities';

@Injectable()
export class PaymentRepository extends Repository<Payment> {
  constructor(dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  /**
   * Obtener pago por Order ID
   * unique: true en orderId → máximo 1 resultado
   */
  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.findOne({
      where: { orderId },
      relations: ['order'],
    });
  }

  /**
   * Obtener pago por transaction ID externo
   * Necesario para conciliación con Stripe, AWS, etc
   * Usa índice en transactionId
   */
  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return this.findOne({
      where: { transactionId },
    });
  }

  /**
   * Obtener pagos completados en rango de fechas
   * Para reportes y conciliación
   */
  async findCompletedInRange(
    fromDate: Date,
    toDate: Date,
  ): Promise<Payment[]> {
    return this.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(fromDate, toDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener pagos fallidos
   * Para reintentos o investigación
   */
  async findFailed(): Promise<Payment[]> {
    return this.find({
      where: { status: PaymentStatus.FAILED },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Actualizar status de pago
   * Usado durante procesamiento
   */
  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string,
  ): Promise<void> {
    await this.update(
      { id: paymentId },
      {
        status,
        transactionId: transactionId || undefined,
        updatedAt: new Date(),
      },
    );
  }
}
