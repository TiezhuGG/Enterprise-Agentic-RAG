import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  knowledgeSpaceVisibilities,
  type KnowledgeSpaceVisibility,
} from '../entities/knowledge-space.entity';

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
}
