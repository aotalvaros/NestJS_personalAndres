/**
 * GraphQL Input Types para Orders
 *
 * @InputType: define tipo de entrada en GraphQL
 * @Field: expone propiedad
 *
 * Validaciones con class-validator:
 * - Se aplican automáticamente al recibir input
 * - GraphQL valida schema primero
 * - class-validator valida constraints lógicos
 *
 * Input esperado en GraphQL:
 * input CreateOrderInput {
 *   customerId: ID!
 *   items: [CreateOrderItemInput!]!
 * }
 */

import { InputType, Field, ID, Float } from '@nestjs/graphql';
import {
  IsUUID,
  IsArray,
  IsNotEmpty,
  IsPositive,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @Field(() => [CreateOrderItemInput])
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items!: CreateOrderItemInput[];
}

@InputType()
export class CreateOrderItemInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @Field(() => Number)
  @IsPositive({ message: 'quantity must be > 0' })
  quantity!: number;

  @Field(() => Float)
  @IsPositive({ message: 'unitPrice must be > 0' })
  unitPrice!: number;
}

@InputType()
export class ProcessPaymentInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  idempotencyKey!: string;

  @Field()
  @IsNotEmpty()
  paymentMethodId!: string;
}
