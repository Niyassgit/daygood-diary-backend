import { DayOfWeek } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubscriptionScheduleItemDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek!: DayOfWeek;

  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class UpdateSubscriptionScheduleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubscriptionScheduleItemDto)
  schedule!: SubscriptionScheduleItemDto[];
}
