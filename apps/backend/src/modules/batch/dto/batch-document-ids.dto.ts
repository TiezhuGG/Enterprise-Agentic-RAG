import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BatchDocumentIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  documentIds!: string[];
}
