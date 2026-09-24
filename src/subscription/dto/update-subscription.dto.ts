import { IsDateString, IsOptional } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
