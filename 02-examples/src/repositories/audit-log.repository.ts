/**
 * AuditLogRepository - Acceso a AuditLog
 *
 * Responsabilidades:
 * - Guardar eventos de auditoría
 * - Permitir replay de eventos
 * - Análisis y debugging
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository, MoreThan } from 'typeorm';
import { AuditLog } from '../entities';

@Injectable()
export class AuditLogRepository extends Repository<AuditLog> {
  constructor(dataSource: DataSource) {
    super(AuditLog, dataSource.createEntityManager());
  }

  /**
   * Registrar un evento de auditoría
   */
  async logEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    correlationId?: string,
  ): Promise<AuditLog> {
    const log = this.create({
      eventType,
      entityType,
      entityId,
      data,
      correlationId,
    });

    return this.save(log);
  }

  /**
   * Obtener eventos de una entidad
   */
  async findByEntityId(entityId: string): Promise<AuditLog[]> {
    return this.find({
      where: { entityId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener eventos por tipo
   */
  async findByEventType(eventType: string, limit: number = 100): Promise<AuditLog[]> {
    return this.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener eventos desde un timestamp (para replay)
   */
  async findSince(since: Date): Promise<AuditLog[]> {
    return this.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener eventos correlacionados (mismo flujo)
   */
  async findByCorrelationId(correlationId: string): Promise<AuditLog[]> {
    return this.find({
      where: { correlationId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Estadísticas de eventos
   */
  async getEventStats(): Promise<
    Array<{ eventType: string; count: number }>
  > {
    return this.createQueryBuilder('audit')
      .select('audit.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.eventType')
      .orderBy('count', 'DESC')
      .getRawMany();
  }
}
