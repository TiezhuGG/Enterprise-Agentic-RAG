import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { spaceMemberRoles, type SpaceMemberRole } from '../entities/knowledge-space.entity';

class SpaceMemberAssignmentDto {
  @IsString()
  @Length(1, 128)
  userId!: string;

  @IsIn(spaceMemberRoles)
  role!: SpaceMemberRole;
}

export class AddSpaceMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SpaceMemberAssignmentDto)
  members!: SpaceMemberAssignmentDto[];
}
