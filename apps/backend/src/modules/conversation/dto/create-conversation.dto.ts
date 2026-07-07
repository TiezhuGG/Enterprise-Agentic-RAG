import { IsOptional, IsString, Length } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;
}
