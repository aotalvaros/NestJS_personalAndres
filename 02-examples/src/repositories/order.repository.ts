/**
 * OrderRepository - Patrón Repository para Orders
 *
 * Responsabilidades:
 * 1. Acceso a datos (TypeORM Repository)
 * 2. Queries custom complejas (QueryBuilder)
 * 3. Mitigación de N+1 queries (eager loading)
 * 4. Índices de BD optimizados
 *
 * Métodos:
 * - findOrderWithRelations: carga Order + items + payment en 1 query
 * - findByCustomerId: buscar por cliente (con índice)
 * - findByStatus: buscar por estado (para reportes)
 * - updateStatus: actualizar estado atomically
 * - getSalesStats: agregaciones (suma, promedio)
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities';

@Injectable()
export class OrderRepository extends Repository<Order> {
  constructor(dataSource: DataSource) {
    super(Order, dataSource.createEntityManager());
  }

  /**
   * Obtener Order con todas sus relaciones en una sola query
   * Evita N+1 queries usando leftJoinAndSelect
   */
  async findOrderWithRelations(orderId: string): Promise<Order | null> {
    return this.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.id = :orderId', { orderId })
      .getOne();
  }

  /**
   * Obtener todos los Orders de un cliente
   * Usa índice en customerId para performance
   */
  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.find({
      where: { customerId },
      relations: ['items', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener Orders por estado
   * Útil para reportes y auditoría
   */
  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.find({
      where: { status },
      relations: ['items'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Obtener Orders pendientes de pago
   */
  async findPending(): Promise<Order[]> {
    return this.find({
      where: { status: OrderStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Actualizar status de Order (atomically)
   * Actualiza también updatedAt automáticamente
   */
  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    await this.update(
      { id: orderId },
      {
        status: newStatus,
        updatedAt: new Date(),
      },
    );
  }

  /**
   * Obtener estadísticas de ventas
   * Ejemplo de agregación (SUM, AVG, COUNT)
   */
  async getSalesStats(fromDate: Date, toDate: Date): Promise<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  }> {
    const result = await this.createQueryBuilder('order')
      .select('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect('AVG(order.totalAmount)', 'avgOrderValue')
      .where('order.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      })
      .getRawOne();

    return {
      totalOrders: parseInt(result.totalOrders, 10),
      totalRevenue: parseFloat(result.totalRevenue),
      avgOrderValue: parseFloat(result.avgOrderValue),
    };
  }
}
