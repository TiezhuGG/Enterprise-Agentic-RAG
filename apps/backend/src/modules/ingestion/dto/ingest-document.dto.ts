import { IsBoolean, IsOptional } from 'class-validator';

export class IngestDocumentDto {
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
