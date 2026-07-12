import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { enterpriseStatuses, type EnterpriseStatus } from '../enterprise.types';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsIn(enterpriseStatuses)
  status?: EnterpriseStatus;
}
