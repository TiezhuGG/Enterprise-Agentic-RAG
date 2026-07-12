import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateGovernanceUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  departmentId?: string;

  @IsOptional()
  @IsIn(['admin', 'user'])
  systemRole?: 'admin' | 'user';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
