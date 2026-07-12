import { IsEmail, IsIn, IsString, Length, MinLength } from 'class-validator';

export class CreateGovernanceUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 128)
  departmentId!: string;

  @IsIn(['admin', 'user'])
  systemRole!: 'admin' | 'user';

  @IsString()
  @MinLength(6)
  temporaryPassword!: string;
}
