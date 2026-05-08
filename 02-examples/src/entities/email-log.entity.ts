/**
 * EmailLog Entity - Registro de Emails Enviados
 *
 * Propósito:
 * - Auditoría de emails enviados
 * - Rastrear fallos de envío
 * - Debugging y análisis
 *
 * Estados:
 * - SUCCESS: Email enviado exitosamente
 * - FAILED: Falló después de reintentos
 * - SKIPPED: Email no enviado (ej: cliente en blacklist)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EmailStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Entity('email_logs')
@Index(['orderId'])
@Index(['email'])
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  orderId!: string;

  @Column()
  email!: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.SUCCESS,
  })
  status!: EmailStatus;

  @Column({ nullable: true, type: 'text' })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
