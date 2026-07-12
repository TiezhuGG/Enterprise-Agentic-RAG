import { IsOptional, IsString, Length } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 128)
  organizationId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  parentId?: string;
}
