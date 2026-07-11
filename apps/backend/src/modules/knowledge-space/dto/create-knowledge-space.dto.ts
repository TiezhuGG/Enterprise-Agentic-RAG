import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import {
  knowledgeSpaceTypes,
  knowledgeSpaceVisibilities,
  type KnowledgeSpaceType,
  type KnowledgeSpaceVisibility,
} from '../entities/knowledge-space.entity';
import { KnowledgeSpaceMetadataDto } from './knowledge-space-metadata.dto';

export class CreateKnowledgeSpaceDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsIn(knowledgeSpaceVisibilities)
  visibility?: KnowledgeSpaceVisibility;

  @IsOptional()
  @IsIn(knowledgeSpaceTypes)
  type?: KnowledgeSpaceType;

  @IsOptional()
  @ValidateNested()
  @Type(() => KnowledgeSpaceMetadataDto)
  metadata?: KnowledgeSpaceMetadataDto;
}
