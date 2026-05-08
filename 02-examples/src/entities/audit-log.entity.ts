/**
 * AuditLog Entity - Registro de Auditoría
 *
 * Propósito:
 * - Capturar todos los eventos del sistema
 * - Permitir replay de eventos
 * - Debugging y análisis
 *
 * Eventos capturados:
 * - order.created: nuevo pedido creado
 * - order.paid: pago procesado
 * - order.shipped: pedido enviado
 * - payment.completed: pago completado
 * - payment.failed: pago fallido
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['eventType'])
@Index(['entityType'])
@Index(['entityId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventType!: string; // ej: "order.created", "order.paid"

  @Column()
  entityType!: string; // ej: "Order", "Payment"

  @Column('uuid')
  entityId!: string; // ID del Order o Payment

  @Column({
    type: 'jsonb',
    default: {},
  })
  data!: Record<string, any>; // Datos del evento

  @Column({
    type: 'varchar',
    nullable: true,
  })
  correlationId?: string; // Para rastrear flujos relacionados

  @CreateDateColumn()
  createdAt!: Date;
}
