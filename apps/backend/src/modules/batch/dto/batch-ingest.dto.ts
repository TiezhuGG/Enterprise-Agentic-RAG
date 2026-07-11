import { IsBoolean, IsOptional } from 'class-validator';
import { BatchDocumentIdsDto } from './batch-document-ids.dto';

export class BatchIngestDto extends BatchDocumentIdsDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsBoolean()
  includeEmbedding?: boolean;

  @IsOptional()
  @IsBoolean()
  includeGraph?: boolean;
}
