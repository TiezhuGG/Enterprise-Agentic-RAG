import { IsOptional, IsString, Length } from 'class-validator';

export class KnowledgeSpaceMetadataDto {
  @IsOptional()
  @IsString()
  @Length(1, 128)
  customerCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  customerName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  departmentId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  ownerDepartmentId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  projectCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  projectName?: string;
}
