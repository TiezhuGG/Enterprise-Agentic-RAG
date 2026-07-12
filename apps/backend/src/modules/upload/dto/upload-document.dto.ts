import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UploadDocumentDto {
  @IsOptional()
  @IsBoolean()
  autoIngest?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
