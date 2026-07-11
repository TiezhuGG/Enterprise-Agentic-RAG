import { IsEmail, IsIn } from 'class-validator';
import { spaceMemberRoles, type SpaceMemberRole } from '../entities/knowledge-space.entity';

export class AddSpaceMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(spaceMemberRoles)
  role!: SpaceMemberRole;
}
