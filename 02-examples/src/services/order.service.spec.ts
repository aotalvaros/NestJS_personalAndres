/**
 * OrderService Unit Tests
 *
 * Patrón: Arrange → Act → Assert (AAA)
 *
 * Setup:
 * - Crear mocks de dependencias (repository, cache, kafka)
 * - Crear instancia de servicio
 * - Inyectar mocks
 *
 * Tests incluyen:
 * - Casos exitosos
 * - Validación de inputs
 * - Edge cases
 * - Error handling
 *
 * Coverage esperado: 85%+
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService, CreateOrderInput } from './order.service';
import { OrderRepository } from '../repositories/order.repository';
import { KafkaProducer } from './kafka.producer';
import { Order, OrderStatus } from '../entities';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('OrderService', () => {
  let service: OrderService;
  let mockRepository: jest.Mocked<OrderRepository>;
  let mockCache: jest.Mocked<any>;
  let mockKafkaProducer: jest.Mocked<KafkaProducer>;

  beforeEach(async () => {
    // Setup: crear mocks
    mockRepository = {
      save: jest.fn(),
      findOrderWithRelations: jest.fn(),
      findByCustomerId: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockKafkaProducer = {
      publishOrderCreated: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Setup: crear módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: KafkaProducer, useValue: mockKafkaProducer },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('createOrder', () => {
    /**
     * TEST: Crear order exitoso
     *
     * Given: datos válidos
     * When: llama createOrder
     * Then: retorna Order con status PENDING
     */
    it('should create order with valid data', async () => {
      // ARRANGE
      const input: CreateOrderInput = {
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 50 },
          { productId: 'prod-2', quantity: 1, unitPrice: 100 },
        ],
      };

      const mockOrder: Order = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        customerId: input.customerId,
        totalAmount: 200, // 2*50 + 1*100
        status: OrderStatus.PENDING,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.save.mockResolvedValue(mockOrder);
      mockCache.set.mockResolvedValue(undefined);

      // ACT
      const result = await service.createOrder(input);

      // ASSERT
      expect(result).toEqual(mockOrder);
      expect(result.totalAmount).toBe(200);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        `order:${mockOrder.id}`,
        mockOrder,
        3600000,
      );
    });

    /**
     * TEST: Validar items no vacío
     */
    it('should throw when items array is empty', async () => {
      const input: CreateOrderInput = {
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        items: [],
      };

      await expect(service.createOrder(input)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    /**
     * TEST: Validar quantity > 0
     */
    it('should throw when item quantity <= 0', async () => {
      const input: CreateOrderInput = {
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        items: [{ productId: 'prod-1', quantity: 0, unitPrice: 50 }],
      };

      await expect(service.createOrder(input)).rejects.toThrow(
        BadRequestException,
      );
    });

    /**
     * TEST: Validar unitPrice > 0
     */
    it('should throw when item unitPrice <= 0', async () => {
      const input: CreateOrderInput = {
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: -50 }],
      };

      await expect(service.createOrder(input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getOrder', () => {
    /**
     * TEST: Obtener order (cache miss)
     */
    it('should fetch from database if not in cache', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440001';
      const mockOrder: Order = {
        id: orderId,
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        totalAmount: 200,
        status: OrderStatus.PENDING,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCache.get.mockResolvedValue(null); // No en caché
      mockRepository.findOrderWithRelations.mockResolvedValue(mockOrder);
      mockCache.set.mockResolvedValue(undefined);

      // ACT
      const result = await service.getOrder(orderId);

      // ASSERT
      expect(result).toEqual(mockOrder);
      expect(mockRepository.findOrderWithRelations).toHaveBeenCalledWith(
        orderId,
      );
      expect(mockCache.set).toHaveBeenCalled();
    });

    /**
     * TEST: Obtener order (cache hit)
     */
    it('should return from cache if available', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440001';
      const cachedOrder: Order = {
        id: orderId,
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        totalAmount: 200,
        status: OrderStatus.PENDING,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCache.get.mockResolvedValue(cachedOrder);

      // ACT
      const result = await service.getOrder(orderId);

      // ASSERT
      expect(result).toEqual(cachedOrder);
      expect(mockRepository.findOrderWithRelations).not.toHaveBeenCalled();
    });

    /**
     * TEST: Order no existe
     */
    it('should throw NotFoundException if order not found', async () => {
      const orderId = 'nonexistent-uuid';

      mockCache.get.mockResolvedValue(null);
      mockRepository.findOrderWithRelations.mockResolvedValue(null);

      await expect(service.getOrder(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrderStatus', () => {
    /**
     * TEST: Actualizar estado (transición válida)
     */
    it('should update order status with valid transition', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440001';
      const mockOrder: Order = {
        id: orderId,
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        totalAmount: 200,
        status: OrderStatus.PENDING,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCache.get.mockResolvedValue(mockOrder);
      mockRepository.updateStatus.mockResolvedValue(undefined);
      mockCache.del.mockResolvedValue(undefined);

      // ACT
      await service.updateOrderStatus(orderId, OrderStatus.PAID);

      // ASSERT
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.PAID,
      );
      expect(mockCache.del).toHaveBeenCalledWith(`order:${orderId}`);
    });

    /**
     * TEST: Rechazar transición inválida
     */
    it('should throw on invalid status transition', async () => {
      const orderId = '550e8400-e29b-41d4-a716-446655440001';
      const mockOrder: Order = {
        id: orderId,
        customerId: '550e8400-e29b-41d4-a716-446655440000',
        totalAmount: 200,
        status: OrderStatus.DELIVERED, // final state
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCache.get.mockResolvedValue(mockOrder);

      // No puede transicionar de DELIVERED a PAID
      await expect(
        service.updateOrderStatus(orderId, OrderStatus.PAID),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
