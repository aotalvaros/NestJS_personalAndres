/**
 * Order Entity - Entidad Principal de Pedido
 *
 * Representa un pedido en el sistema.
 *
 * Relaciones:
 * - 1:N con OrderItem (un pedido tiene múltiples items)
 * - 1:1 con Payment (un pedido tiene máximo 1 pago)
 *
 * Cambios de estado permitidos:
 * PENDING → PAID o CANCELLED
 * PAID → SHIPPED o CANCELLED
 * SHIPPED → DELIVERED
 * DELIVERED/CANCELLED → (final state)
 *
 * Constraint: totalAmount > 0 (validado en BD)
 *
 * Cache:
 * - Cacheado en Redis con TTL 1 hora
 * - Invalidado cuando cambia status
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Check,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export enum OrderStatus {
  PENDING = 'PENDING',           // Creado pero sin pagar
  PAID = 'PAID',                 // Pago completado
  SHIPPED = 'SHIPPED',           // Enviado al cliente
  DELIVERED = 'DELIVERED',       // Entregado
  CANCELLED = 'CANCELLED',       // Cancelado
}

@Entity('orders')
@Check(`"total_amount" > 0`)      // Restricción: amount siempre positivo
@Index(['customerId'])             // Índice para búsquedas por cliente
@Index(['status'])                 // Índice para búsquedas por estado
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  customerId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  // Relación OneToMany con OrderItem
  // cascade: true → al eliminar Order, se eliminan OrderItems
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  // Relación OneToOne con Payment
  // eager: false → no cargar automáticamente (usar ResolveField)
  @OneToOne(() => Payment, (payment) => payment.order, { eager: false })
  payment?: Payment;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
