import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadMultimodalAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  conversationId?: string;
}
