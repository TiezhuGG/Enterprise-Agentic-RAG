import { Transform } from 'class-transformer';
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
