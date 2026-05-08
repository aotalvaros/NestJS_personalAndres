/**
 * PaymentService - Lógica de Pago con IDEMPOTENCIA
 *
 * GARANTÍA: Exactly Once - nunca duplicar cargos, aunque cliente reintente
 *
 * Patrón Idempotencia con Redis:
 * 1. Cliente genera idempotencyKey (UUID)
 * 2. Sistema busca en Redis: payment:{orderId}:{idempotencyKey}
 * 3. SI EXISTE: retornar resultado previo (< 10ms, no duplicar)
 * 4. SI NO EXISTE: procesar pago y guardar en Redis (TTL 24h)
 *
 * Flujo:
 * 1. Validar Order existe y status PENDING
 * 2. Buscar en Redis (cache hit → fast return)
 * 3. Crear Payment con status PROCESSING
 * 4. Llamar Stripe API (mocked)
 * 5. Si éxito: Payment.status = COMPLETED, guardar en Redis
 * 6. Si error: Payment.status = FAILED, NO guardar en Redis (permitir reintentos)
 * 7. Publicar evento Kafka
 * 8. Retornar resultado
 *
 * Casos de uso:
 * - Primer intento: procesa pago (2000ms)
 * - Reintentar con MISMO key: retorna cache (< 10ms)
 * - Reintentar con DIFERENTE key: nuevo pago (cliente lo pidió)
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
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { Payment, PaymentStatus, OrderStatus } from '../entities';
import { StripeService } from './mocks/stripe.service';
import { KafkaProducer } from './kafka.producer';

export interface ProcessPaymentInput {
  orderId: string;
  idempotencyKey: string; // UUID generado por cliente
  paymentMethodId: string;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  transactionId: string;
  amount: number;
}

@Injectable()
export class PaymentService {
  private logger = new Logger('PaymentService');

  constructor(
    private paymentRepository: PaymentRepository,
    private orderRepository: OrderRepository,
    private stripeService: StripeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private kafkaProducer: KafkaProducer,
  ) {}

  /**
   * Procesar pago de una orden (IDEMPOTENTE)
   *
   * GARANTÍA: Exactly Once
   * - Reintentos con mismo idempotencyKey: no duplican cargo
   * - Cliente que cambia key conscientemente: nuevo cargo
   *
   * @param input contiene orderId, idempotencyKey, paymentMethodId
   * @returns PaymentResult con status y transactionId
   * @throws NotFoundException si Order no existe
   * @throws BadRequestException si Order no está en PENDING
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    // Paso 1: Validar Order existe y está en PENDING
    const order = await this.orderRepository.findOrderWithRelations(
      input.orderId,
    );
    if (!order) {
      throw new NotFoundException(`Order ${input.orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order must be in PENDING status, current: ${order.status}`,
      );
    }

    // Paso 2: Construir idempotency key
    const idempotencyKey = `payment:${input.orderId}:${input.idempotencyKey}`;

    // Paso 3: Verificar en Redis (IDEMPOTENCIA)
    const cachedResult = await this.cacheManager.get<PaymentResult>(
      idempotencyKey,
    );
    if (cachedResult) {
      this.logger.log(
        `[IDEMPOTENCY HIT] Returning cached result for ${idempotencyKey}`,
      );
      return cachedResult;
    }

    // Paso 4: Crear Payment con status PROCESSING
    let payment = new Payment();
    payment.orderId = input.orderId;
    payment.amount = order.totalAmount;
    payment.status = PaymentStatus.PROCESSING;
    payment.paymentMethodId = input.paymentMethodId;
    payment = await this.paymentRepository.save(payment);

    // Paso 5: Llamar Stripe API (mocked)
    let transactionId: string;
    try {
      const chargeResult = await this.stripeService.createCharge({
        amount: Math.round(order.totalAmount * 100), // Stripe usa centavos
        paymentMethodId: input.paymentMethodId,
        idempotencyKey: input.idempotencyKey,
      });
      transactionId = chargeResult.id;
      this.logger.log(`Stripe charge succeeded: ${transactionId}`);
    } catch (error) {
      // Si falla: marcar como FAILED, NO cachear (permitir reintentos)
      await this.paymentRepository.updatePaymentStatus(
        payment.id,
        PaymentStatus.FAILED,
      );
      this.logger.error(`Stripe charge failed: ${error.message}`);
      throw error;
    }

    // Paso 6: Actualizar Payment a COMPLETED
    await this.paymentRepository.updatePaymentStatus(
      payment.id,
      PaymentStatus.COMPLETED,
      transactionId,
    );

    // Actualizar Order a PAID
    await this.orderRepository.updateStatus(input.orderId, OrderStatus.PAID);
    this.logger.log(`Order ${input.orderId} marked as PAID`);

    // Paso 7: GUARDAR EN REDIS (CRÍTICO para idempotencia)
    const result: PaymentResult = {
      paymentId: payment.id,
      status: PaymentStatus.COMPLETED,
      transactionId,
      amount: order.totalAmount,
    };

    // TTL 24 horas = 86400 segundos = 86400000 ms
    await this.cacheManager.set(idempotencyKey, result, 86400000);
    this.logger.debug(
      `Payment cached with 24h TTL: ${idempotencyKey}`,
    );

    // Paso 8: Publicar evento Kafka (async - fire and forget)
    this.kafkaProducer
      .publishOrderPaid(input.orderId, payment.id, order.totalAmount, transactionId)
      .catch((error) =>
        this.logger.error(`Failed to publish order.paid event: ${error.message}`),
      );

    return result;
  }

  /**
   * Obtener pago por Order ID
   *
   * @param orderId UUID del order
   * @returns Payment con información completa
   * @throws NotFoundException si no existe pago
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }
    return payment;
  }
}
