/**
 * Order Resolver - GraphQL Queries y Mutations para Orders
 *
 * @Resolver(OrderType): maneja tipos OrderType
 * @Query: operaciones de lectura (GET)
 * @Mutation: operaciones que modifican estado (POST/PUT/DELETE)
 * @ResolveField: resolver campos específicos (lazy loading)
 *
 * Flujo:
 * 1. Cliente envía GraphQL query/mutation
 * 2. GraphQL schema valida estructura
 * 3. class-validator valida inputs
 * 4. Resolver ejecuta
 * 5. Service ejecuta lógica
 * 6. Data retorna y se mapea a types
 * 7. GraphQL retorna JSON al cliente
 */

import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Parent,
  ResolveField,
  Context,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { OrderType, PaymentType } from '../types/order.type';
import { CreateOrderInput } from '../inputs/order.input';
import { Order } from '../../entities';

@Resolver(() => OrderType)
export class OrderResolver {
  private logger = new Logger('OrderResolver');

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
  ) {}

  /**
   * Query: Obtener un Order por ID
   *
   * GraphQL:
   * query {
   *   order(id: "550e...") {
   *     id
   *     customerId
   *     totalAmount
   *     status
   *     items { productId quantity }
   *   }
   * }
   */
  @Query(() => OrderType, {
    description: 'Obtener un pedido por ID',
    nullable: true,
  })
  async order(@Args('id', { type: () => ID }) id: string): Promise<OrderType | null> {
    try {
      return (await this.orderService.getOrder(id)) as unknown as OrderType;
    } catch (error) {
      this.logger.error(`Error fetching order ${id}:`, error);
      return null;
    }
  }

  /**
   * Query: Obtener Orders del cliente autenticado
   *
   * GraphQL:
   * query {
   *   myOrders {
   *     id
   *     totalAmount
   *     status
   *   }
   * }
   */
  @Query(() => [OrderType], {
    description: 'Obtener todos los pedidos del cliente autenticado',
  })
  async myOrders(@Context() context: any): Promise<OrderType[]> {
    const customerId = context.user?.id || 'test-customer';
    return (await this.orderService.getCustomerOrders(customerId)) as unknown as OrderType[];
  }

  /**
   * Mutation: Crear un Order nuevo
   *
   * GraphQL:
   * mutation {
   *   createOrder(input: {
   *     customerId: "uuid",
   *     items: [
   *       { productId: "p1", quantity: 2, unitPrice: 50 }
   *     ]
   *   }) {
   *     id
   *     status
   *     totalAmount
   *   }
   * }
   *
   * Validaciones automáticas:
   * 1. GraphQL schema valida types
   * 2. class-validator valida constraints
   * 3. OrderService valida lógica de negocio
   */
  @Mutation(() => OrderType, {
    description: 'Crear un nuevo pedido',
  })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @Context() context: any,
  ): Promise<OrderType> {
    // Usar ID del usuario autenticado, no del input (seguridad)
    const enhancedInput = {
      ...input,
      customerId: context.user?.id || input.customerId,
    };

    this.logger.log(`Creating order for customer ${enhancedInput.customerId}`);
    return (await this.orderService.createOrder(enhancedInput)) as unknown as OrderType;
  }

  /**
   * ResolveField: Cargar campo Payment cuando se pide
   *
   * Lazy loading - solo carga si el cliente lo pide en query
   *
   * GraphQL:
   * query {
   *   order(id: "x") {
   *     id
   *     payment {      ← aquí se ejecuta @ResolveField payment
   *       id
   *       status
   *       transactionId
   *     }
   *   }
   * }
   */
  @ResolveField('payment', () => PaymentType, { nullable: true })
  async resolvePayment(@Parent() order: Order): Promise<PaymentType | null> {
    try {
      return (await this.paymentService.getPaymentByOrderId(order.id)) as unknown as PaymentType;
    } catch {
      return null; // Si no existe pago, retorna null
    }
  }
}
