/**
 * StripeService (Mock)
 *
 * Mock de Stripe API para development y testing
 *
 * En producción: reemplazar con @stripe/stripe-js real
 * En desarrollo: usa este mock que simula comportamiento
 *
 * Comportamiento del mock:
 * - 90% pagos exitosos
 * - 10% fallos aleatorios (para testear error handling)
 * - Latencia realista (~500ms)
 * - Idempotency key support
 *
 * Uso en tests: jest.mock() este servicio
 */

import { Injectable, Logger } from '@nestjs/common';

export interface StripeChargeRequest {
  amount: number; // en centavos (ej: 99900 = $999.00)
  paymentMethodId: string;
  idempotencyKey: string;
}

export interface StripeChargeResponse {
  id: string; // stripe_ch_12345
  amount: number;
  status: 'succeeded' | 'failed';
  paymentMethodId: string;
  createdAt: Date;
}

@Injectable()
export class StripeService {
  private logger = new Logger('StripeService');

  /**
   * Mock de Stripe API: crear cargo
   *
   * En producción sería:
   * const stripe = new Stripe(apiKey)
   * return await stripe.charges.create({...})
   *
   * @param request contiene amount, paymentMethodId, idempotencyKey
   * @returns información del cargo
   * @throws Error si falla (10% del tiempo)
   */
  async createCharge(request: StripeChargeRequest): Promise<StripeChargeResponse> {
    // Simular latencia de red
    await this.delay(500);

    // Simular falla el 10% de las veces
    if (Math.random() < 0.1) {
      this.logger.warn(`[MOCK] Stripe charge failed (simulated)`);
      throw new Error('Stripe API error: Card declined (simulated failure)');
    }

    // Éxito
    const result: StripeChargeResponse = {
      id: `stripe_ch_${Date.now()}_${request.idempotencyKey.slice(0, 8)}`,
      amount: request.amount,
      status: 'succeeded',
      paymentMethodId: request.paymentMethodId,
      createdAt: new Date(),
    };

    this.logger.log(`[MOCK] Stripe charge succeeded: ${result.id}`);
    return result;
  }

  /**
   * Mock: crear payment method
   * En producción: crear en Stripe y retornar ID
   */
  async createPaymentMethod(
    _cardToken: string,
  ): Promise<{ id: string; card_brand: string }> {
    await this.delay(200);
    return {
      id: `stripe_pm_${Date.now()}`,
      card_brand: 'visa',
    };
  }

  /**
   * Mock: refund
   */
  async refund(
    _chargeId: string,
    _amount: number,
  ): Promise<{ status: 'succeeded' | 'failed' }> {
    await this.delay(300);
    return { status: 'succeeded' };
  }

  /**
   * Utilidad: delay para simular latencia
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
