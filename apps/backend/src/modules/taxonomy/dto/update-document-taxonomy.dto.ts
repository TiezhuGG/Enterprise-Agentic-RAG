import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentTaxonomyDto {
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
