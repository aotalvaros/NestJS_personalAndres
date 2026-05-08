/**
 * Payment Resolver - GraphQL Mutations para Pagos (IDEMPOTENTE)
 *
 * Responsabilidad: procesar pagos con garantía de no-duplicación
 *
 * Mutation processPayment es IDEMPOTENTE:
 * - Mismo idempotencyKey → retorna cache (< 10ms)
 * - Diferente idempotencyKey → nuevo pago (cliente quiso reintentar)
 */

import {
  Resolver,
  Mutation,
  Args,
} from '@nestjs/graphql';
import { Logger, BadRequestException } from '@nestjs/common';
import { PaymentService } from '../../services/payment.service';
import { PaymentType } from '../types/order.type';
import { ProcessPaymentInput } from '../inputs/order.input';

@Resolver(() => PaymentType)
export class PaymentResolver {
  private logger = new Logger('PaymentResolver');

  constructor(private paymentService: PaymentService) {}

  /**
   * Mutation: Procesar pago de un Order (IDEMPOTENTE)
   *
   * GARANTÍA: Exactly Once
   * - Si reintenta con mismo idempotencyKey: no duplica
   * - Si reintenta con diferente key: nuevo pago
   *
   * GraphQL:
   * mutation {
   *   processPayment(input: {
   *     orderId: "uuid"
   *     idempotencyKey: "uuid"        ← Cliente genera este
   *     paymentMethodId: "stripe_pm_123"
   *   }) {
   *     paymentId
   *     status                        ← COMPLETED o FAILED
   *     transactionId
   *     amount
   *   }
   * }
   *
   * Casos de uso:
   * 1. Primer pago:
   *    - Cliente envía mutation
   *    - Procesa en 2000ms
   *    - Retorna resultado
   *    - Guarda en Redis (24h)
   *
   * 2. Reintentar (timeout/conexión perdida):
   *    - Cliente reenvía con MISMO idempotencyKey
   *    - Redis hit en < 10ms
   *    - Retorna resultado previo
   *    - NO duplica cargo en Stripe
   *
   * 3. Cliente quiere reintentar conscientemente:
   *    - Cliente genera NUEVO idempotencyKey
   *    - Sistema procesa nuevo pago
   *    - Dos cargos (cliente lo pidió)
   */
  @Mutation(() => PaymentType, {
    description: 'Procesar pago de un pedido (idempotente)',
  })
  async processPayment(
    @Args('input') input: ProcessPaymentInput,
  ): Promise<any> {
    try {
      this.logger.log(
        `Processing payment for order ${input.orderId} with key ${input.idempotencyKey}`,
      );

      const result = await this.paymentService.processPayment(input);

      this.logger.log(`Payment processed: ${result.paymentId}`);
      return result;
    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`);
      throw new BadRequestException({
        message: 'Payment processing failed',
        originalError: error.message,
      });
    }
  }
}
