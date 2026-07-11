import { IsArray, IsOptional, IsString } from 'class-validator';
import { BatchDocumentIdsDto } from './batch-document-ids.dto';

export class BatchTaxonomyDto extends BatchDocumentIdsDto {
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
