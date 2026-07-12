import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { enterpriseStatuses, type EnterpriseStatus } from '../enterprise.types';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  parentId?: string | null;

  @IsOptional()
  @IsIn(enterpriseStatuses)
  status?: EnterpriseStatus;
}
