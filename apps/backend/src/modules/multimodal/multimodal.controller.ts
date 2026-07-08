import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { UploadMultimodalAttachmentDto } from './dto/upload-multimodal-attachment.dto';
import { MultimodalService } from './multimodal.service';
import type { MultimodalAttachmentResponse, UploadedMultimodalFile } from './multimodal.types';

@Controller('multimodal')
@UseGuards(JwtAuthGuard)
export class MultimodalController {
  constructor(
    private readonly multimodalService: MultimodalService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UploadMultimodalAttachmentDto,
    @UploadedFile() file: UploadedMultimodalFile | undefined,
  ): Promise<MultimodalAttachmentResponse> {
    return this.multimodalService.uploadAttachment(this.createExecutionContext(user), input, file);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
