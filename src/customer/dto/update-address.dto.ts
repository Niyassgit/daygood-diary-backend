import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  pincode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}