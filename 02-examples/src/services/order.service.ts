/**
 * OrderService - Lógica de Negocio para Orders
 *
 * Responsabilidades:
 * 1. Crear órdenes (validando datos)
 * 2. Obtener órdenes (del caché si está disponible)
 * 3. Cambiar estado de orden (con validación de transiciones)
 * 4. Publicar eventos en Kafka
 * 5. Cachear resultados en Redis
 *
 * Patrón Cache-Aside:
 * GET: intenta caché primero, luego BD
 * SET: guarda en BD + caché
 * UPDATE: actualiza BD, invalida caché
 *
 * Eventos Kafka:
 * - order.created
 * - order.paid
 * - order.shipped
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OrderRepository } from '../repositories/order.repository';
import { Order, OrderStatus } from '../entities';
import { OrderItem } from '../entities/order-item.entity';
import { KafkaProducer } from './kafka.producer';

export interface CreateOrderInput {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable()
export class OrderService {
  private logger = new Logger('OrderService');

  constructor(
    private orderRepository: OrderRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private kafkaProducer: KafkaProducer,
  ) {}

  /**
   * Crear un nuevo Order
   *
   * Flujo:
   * 1. Validar inputs
   * 2. Calcular totalAmount
   * 3. Crear entidades (Order + OrderItems)
   * 4. Guardar en BD (con transacción)
   * 5. Cachear en Redis
   * 6. Publicar evento Kafka
   * 7. Retornar Order creado
   *
   * @param input Contiene customerId e items
   * @returns Order creado con status PENDING
   * @throws BadRequestException si validation falla
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    // Paso 1: Validar
    this.validateCreateOrderInput(input);

    // Paso 2: Calcular totalAmount
    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    // Paso 3: Crear entidades
    const order = new Order();
    order.customerId = input.customerId;
    order.totalAmount = totalAmount;
    order.status = OrderStatus.PENDING;
    order.items = input.items.map((item) => {
      const orderItem = new OrderItem();
      orderItem.productId = item.productId;
      orderItem.quantity = item.quantity;
      orderItem.unitPrice = item.unitPrice;
      return orderItem;
    });

    // Paso 4: Guardar en BD
    const savedOrder = await this.orderRepository.save(order);
    this.logger.log(`Order created: ${savedOrder.id} for customer ${input.customerId}`);

    // Paso 5: Cachear en Redis (1 hora)
    const cacheKey = `order:${savedOrder.id}`;
    await this.cacheManager.set(cacheKey, savedOrder, 3600000);
    this.logger.debug(`Order cached: ${cacheKey}`);

    // Paso 6: Publicar evento Kafka (async - fire and forget)
    // No await para no bloquear la respuesta HTTP
    this.kafkaProducer
      .publishOrderCreated(
        savedOrder.id,
        input.customerId,
        totalAmount,
        input.items.length,
      )
      .catch((error) =>
        this.logger.error(`Failed to publish order.created event: ${error.message}`),
      );

    return savedOrder;
  }

  /**
   * Obtener Order por ID
   * Patrón Cache-Aside: intenta caché primero, si no, consulta BD
   *
   * @param orderId UUID del order
   * @returns Order con items y payment cargados
   * @throws NotFoundException si order no existe
   */
  async getOrder(orderId: string): Promise<Order> {
    // Intenta caché primero
    const cacheKey = `order:${orderId}`;
    const cached = await this.cacheManager.get<Order>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    // Si no está en caché, consulta BD
    this.logger.debug(`Cache MISS: ${cacheKey}`);
    const order = await this.orderRepository.findOrderWithRelations(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Cachear para próximas consultas
    await this.cacheManager.set(cacheKey, order, 3600000);
    return order;
  }

  /**
   * Obtener Orders de un cliente
   *
   * @param customerId UUID del cliente
   * @returns Array de Orders ordenados por fecha desc
   */
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    return this.orderRepository.findByCustomerId(customerId);
  }

  /**
   * Cambiar estado del Order
   *
   * Validaciones:
   * 1. Order existe
   * 2. Transición es válida (state machine)
   *
   * Acciones:
   * 1. Actualizar en BD
   * 2. Invalidar caché
   * 3. Publicar evento Kafka (según nuevo estado)
   *
   * @param orderId UUID del order
   * @param newStatus nuevo estado
   * @throws NotFoundException si order no existe
   * @throws BadRequestException si transición es inválida
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<void> {
    // Obtener order (usa caché si está disponible)
    const order = await this.getOrder(orderId);

    // Validar transición
    this.validateStatusTransition(order.status, newStatus);

    // Actualizar en BD
    await this.orderRepository.updateStatus(orderId, newStatus);
    this.logger.log(`Order status updated: ${orderId} → ${newStatus}`);

    // Invalidar caché
    const cacheKey = `order:${orderId}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Cache invalidated: ${cacheKey}`);

    // Publicar eventos según nuevo estado
    // if (newStatus === OrderStatus.PAID) {
    //   await this.kafkaService.publishOrderPaid(orderId);
    // } else if (newStatus === OrderStatus.SHIPPED) {
    //   await this.kafkaService.publishOrderShipped(orderId);
    // }
  }

  /**
   * Validar inputs de createOrder
   *
   * Valida:
   * - customerId no vacío
   * - items array no vacío
   * - cada item: quantity > 0, unitPrice > 0
   *
   * @throws BadRequestException si validation falla
   */
  private validateCreateOrderInput(input: CreateOrderInput): void {
    if (!input.customerId || input.customerId.trim() === '') {
      throw new BadRequestException('customerId is required');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('items cannot be empty');
    }

    for (const item of input.items) {
      if (!item.productId) {
        throw new BadRequestException('item productId is required');
      }
      if (item.quantity <= 0) {
        throw new BadRequestException('item quantity must be > 0');
      }
      if (item.unitPrice <= 0) {
        throw new BadRequestException('item unitPrice must be > 0');
      }
    }
  }

  /**
   * Validar transiciones de estado
   *
   * Máquina de estados:
   * PENDING → PAID, CANCELLED
   * PAID → SHIPPED, CANCELLED
   * SHIPPED → DELIVERED
   * DELIVERED/CANCELLED → (no transitions)
   *
   * @throws BadRequestException si transición es inválida
   */
  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
