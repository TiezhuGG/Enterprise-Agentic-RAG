import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  documentAccessSecurityLevels,
  type DocumentAccessSecurityLevel,
} from '../entities/document.entity';

export class UpdateDocumentAccessScopeDto {
  @IsIn(documentAccessSecurityLevels)
  securityLevel!: DocumentAccessSecurityLevel;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Length(1, 128, { each: true })
  allowedDepartmentIds?: string[];
}
