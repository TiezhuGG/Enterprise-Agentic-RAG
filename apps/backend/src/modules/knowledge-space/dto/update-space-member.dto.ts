import { IsIn } from 'class-validator';
import { spaceMemberRoles, type SpaceMemberRole } from '../entities/knowledge-space.entity';

export class UpdateSpaceMemberDto {
  @IsIn(spaceMemberRoles)
  role!: SpaceMemberRole;
}
