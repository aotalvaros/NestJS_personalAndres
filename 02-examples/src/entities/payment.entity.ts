/**
 * Payment Entity - Información de Pago
 *
 * Representa un pago asociado a un pedido.
 *
 * Estados:
 * - PENDING: Esperando procesamiento
 * - PROCESSING: En proceso (llamada a API)
 * - COMPLETED: Exitoso
 * - FAILED: Falló
 *
 * Idempotencia:
 * - transactionId: ID externo (ej: stripe_ch_12345)
 * - Se guarda en Redis con TTL 24h para evitar duplicaciones
 *
 * Relación:
 * - 1:1 con Order (un pedido tiene máximo 1 pago)
 *
 * Constraint:
 * - amount > 0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',           // Esperando procesamiento
  PROCESSING = 'PROCESSING',     // En proceso
  COMPLETED = 'COMPLETED',       // Éxitoso
  FAILED = 'FAILED',             // Falló
}

@Entity('payments')
@Check(`"amount" > 0`)
@Index(['orderId'])              // Índice para búsquedas por order
@Index(['transactionId'])        // Índice para conciliación
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  orderId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ nullable: true })
  transactionId?: string;         // ID externo de Stripe/AWS/etc

  @Column({ nullable: true })
  paymentMethodId?: string;       // stripe_pm_12345, etc

  // Relación OneToOne con Order
  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
