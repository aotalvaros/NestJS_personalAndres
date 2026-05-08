/**
 * PaymentService Unit Tests
 *
 * Patrón: Arrange → Act → Assert (AAA)
 *
 * Casos de prueba:
 * - Pago exitoso (primer intento)
 * - IDEMPOTENCIA: mismo idempotencyKey retorna cache
 * - Pago fallido (Stripe error)
 * - Order no existe
 * - Order no está en PENDING
 *
 * Coverage esperado: 85%+
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService, ProcessPaymentInput } from './payment.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { StripeService } from './mocks/stripe.service';
import { KafkaProducer } from './kafka.producer';
import { Payment, PaymentStatus, Order, OrderStatus } from '../entities';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockStripeService: jest.Mocked<StripeService>;
  let mockCache: jest.Mocked<any>;
  let mockKafkaProducer: jest.Mocked<KafkaProducer>;

  beforeEach(async () => {
    // Setup: crear mocks
    mockPaymentRepository = {
      save: jest.fn(),
      findByOrderId: jest.fn(),
      updatePaymentStatus: jest.fn(),
    } as any;

    mockOrderRepository = {
      findOrderWithRelations: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    mockStripeService = {
      createCharge: jest.fn(),
    } as any;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockKafkaProducer = {
      publishOrderPaid: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Setup: crear módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentRepository, useValue: mockPaymentRepository },
        { provide: OrderRepository, useValue: mockOrderRepository },
        { provide: StripeService, useValue: mockStripeService },
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: KafkaProducer, useValue: mockKafkaProducer },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('processPayment', () => {
    const mockOrder: Order = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: 200,
      status: OrderStatus.PENDING,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    const mockPayment: Payment = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      orderId: mockOrder.id,
      amount: 200,
      status: PaymentStatus.PROCESSING,
      transactionId: 'stripe_ch_12345',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    /**
     * TEST: Pago exitoso (primer intento)
     *
     * Given: Order existe en status PENDING, idempotencyKey único
     * When: procesa pago
     * Then: Payment creado, cacheado, evento publicado
     */
    it('should process payment successfully on first attempt', async () => {
      // ARRANGE
      const input: ProcessPaymentInput = {
        orderId: mockOrder.id,
        idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        paymentMethodId: 'stripe_pm_12345',
      };

      mockOrderRepository.findOrderWithRelations.mockResolvedValue(mockOrder);
      mockCache.get.mockResolvedValue(null); // No cached
      mockPaymentRepository.save.mockResolvedValue(mockPayment);
      mockStripeService.createCharge.mockResolvedValue({
        id: 'stripe_ch_12345',
        amount: 20000,
        status: 'succeeded',
        paymentMethodId: 'stripe_pm_12345',
        createdAt: new Date(),
      });
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(undefined);
      mockCache.set.mockResolvedValue(undefined);
      mockKafkaProducer.publishOrderPaid.mockResolvedValue(undefined);

      // ACT
      const result = await service.processPayment(input);

      // ASSERT
      expect(result.paymentId).toBe(mockPayment.id);
      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(result.transactionId).toBe('stripe_ch_12345');
      expect(result.amount).toBe(200);
      expect(mockStripeService.createCharge).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
      expect(mockKafkaProducer.publishOrderPaid).toHaveBeenCalled();
    });

    /**
     * TEST: IDEMPOTENCIA - mismo idempotencyKey retorna cache
     *
     * Given: Pagó con idempotencyKey X
     * When: Reenviá con MISMO idempotencyKey
     * Then: Retorna cache (< 10ms), no duplica cargo
     */
    it('should return cached result on idempotency key reuse', async () => {
      // ARRANGE
      const input: ProcessPaymentInput = {
        orderId: mockOrder.id,
        idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        paymentMethodId: 'stripe_pm_12345',
      };

      const cachedResult = {
        paymentId: mockPayment.id,
        status: PaymentStatus.COMPLETED,
        transactionId: 'stripe_ch_12345',
        amount: 200,
      };

      mockOrderRepository.findOrderWithRelations.mockResolvedValue(mockOrder);
      mockCache.get.mockResolvedValue(cachedResult);

      // ACT
      const result = await service.processPayment(input);

      // ASSERT
      expect(result).toEqual(cachedResult);
      expect(mockStripeService.createCharge).not.toHaveBeenCalled(); // No call Stripe
      expect(mockPaymentRepository.save).not.toHaveBeenCalled(); // No save again
    });

    /**
     * TEST: Pago fallido (Stripe error)
     *
     * Given: Stripe API falla
     * When: intenta procesar pago
     * Then: Payment.status = FAILED, resultado NO cacheado
     */
    it('should handle Stripe charge failure', async () => {
      // ARRANGE
      const input: ProcessPaymentInput = {
        orderId: mockOrder.id,
        idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        paymentMethodId: 'stripe_pm_12345',
      };

      mockOrderRepository.findOrderWithRelations.mockResolvedValue(mockOrder);
      mockCache.get.mockResolvedValue(null);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);
      mockStripeService.createCharge.mockRejectedValue(
        new Error('Simulated Stripe error'),
      );
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue(undefined);

      // ACT & ASSERT
      await expect(service.processPayment(input)).rejects.toThrow(
        'Simulated Stripe error',
      );

      expect(mockPaymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        mockPayment.id,
        PaymentStatus.FAILED,
      );
      expect(mockCache.set).not.toHaveBeenCalled(); // NO cachear resultado fallido
    });

    /**
     * TEST: Order no existe
     */
    it('should throw NotFoundException if order not found', async () => {
      // ARRANGE
      const input: ProcessPaymentInput = {
        orderId: 'nonexistent-uuid',
        idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        paymentMethodId: 'stripe_pm_12345',
      };

      mockOrderRepository.findOrderWithRelations.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.processPayment(input)).rejects.toThrow(
        NotFoundException,
      );
    });

    /**
     * TEST: Order no está en PENDING
     */
    it('should throw if order is not in PENDING status', async () => {
      // ARRANGE
      const paidOrder = { ...mockOrder, status: OrderStatus.PAID };
      const input: ProcessPaymentInput = {
        orderId: mockOrder.id,
        idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        paymentMethodId: 'stripe_pm_12345',
      };

      mockOrderRepository.findOrderWithRelations.mockResolvedValue(paidOrder);

      // ACT & ASSERT
      await expect(service.processPayment(input)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPaymentByOrderId', () => {
    /**
     * TEST: Obtener pago por Order ID
     */
    it('should return payment by order id', async () => {
      // ARRANGE
      const mockPayment: Payment = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        orderId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 200,
        status: PaymentStatus.COMPLETED,
        transactionId: 'stripe_ch_12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayment);

      // ACT
      const result = await service.getPaymentByOrderId(mockPayment.orderId);

      // ASSERT
      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(
        mockPayment.orderId,
      );
    });

    /**
     * TEST: Payment no existe
     */
    it('should throw NotFoundException if payment not found', async () => {
      // ARRANGE
      mockPaymentRepository.findByOrderId.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.getPaymentByOrderId('nonexistent-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
