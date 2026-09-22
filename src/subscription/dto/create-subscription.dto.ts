import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsDateString()
  startDate!: string;
}