import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { documentTypes, type DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsIn(documentTypes)
  type!: DocumentType;

  @IsOptional()
  @IsString()
  @Length(1, 2048)
  storageKey?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  size?: number;
}
