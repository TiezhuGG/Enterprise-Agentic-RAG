import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  knowledgeSpaceStatuses,
  knowledgeSpaceVisibilities,
  type KnowledgeSpaceStatus,
  type KnowledgeSpaceVisibility,
} from '../entities/knowledge-space.entity';

export class UpdateKnowledgeSpaceDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsIn(knowledgeSpaceVisibilities)
  visibility?: KnowledgeSpaceVisibility;

  @IsOptional()
  @IsIn(knowledgeSpaceStatuses)
  status?: KnowledgeSpaceStatus;
}
