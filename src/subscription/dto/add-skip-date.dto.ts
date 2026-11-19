import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class AddSkipDateDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
