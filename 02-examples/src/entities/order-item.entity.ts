/**
 * OrderItem Entity - Detalle del Pedido
 *
 * Representa un artículo dentro de un pedido.
 *
 * Relación:
 * - N:1 con Order (muchos items pertenecen a 1 orden)
 *
 * Propiedades:
 * - productId: UUID (no FK porque podría estar en otro microservicio)
 * - quantity: cantidad de unidades
 * - unitPrice: precio unitario AL MOMENTO DE COMPRA (histórico)
 *
 * Constraint:
 * - quantity > 0
 * - unitPrice > 0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
@Check(`"quantity" > 0`)
@Check(`"unit_price" > 0`)
@Index(['orderId'])  // Índice para búsquedas por order
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  orderId!: string;

  @Column('uuid')
  productId!: string;

  @Column('integer')
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice!: number;

  // Relación ManyToOne con Order
  // onDelete: CASCADE → si se borra Order, se borra el OrderItem
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;
}
