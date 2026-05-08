/**
 * GraphQL Types para Order
 *
 * @ObjectType: define tipo GraphQL
 * @Field: expone propiedad en schema
 *
 * Schema GraphQL generado:
 * type Order {
 *   id: ID!
 *   customerId: ID!
 *   totalAmount: Float!
 *   status: OrderStatusEnum!
 *   items: [OrderItem!]!
 *   payment: Payment
 *   createdAt: DateTime!
 * }
 */

import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatusEnum, {
  name: 'OrderStatus',
  description: 'Estado del pedido',
});

@ObjectType('Order')
export class OrderType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  customerId!: string;

  @Field(() => Number)
  totalAmount!: number;

  @Field(() => OrderStatusEnum)
  status!: OrderStatusEnum;

  @Field(() => [OrderItemType])
  items!: OrderItemType[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => PaymentType, { nullable: true })
  payment?: PaymentType;
}

@ObjectType('OrderItem')
export class OrderItemType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => ID)
  productId!: string;

  @Field(() => Number)
  quantity!: number;

  @Field(() => Number)
  unitPrice!: number;
}

@ObjectType('Payment')
export class PaymentType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => Number)
  amount!: number;

  @Field(() => PaymentStatusEnum)
  status!: PaymentStatusEnum;

  @Field({ nullable: true })
  transactionId?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

registerEnumType(PaymentStatusEnum, {
  name: 'PaymentStatus',
  description: 'Estado del pago',
});
