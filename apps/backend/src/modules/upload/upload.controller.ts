import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import type { DocumentEntity } from '../document';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { maxUploadFileSizeBytes, type UploadedDocumentFile } from './upload.types';
import { UploadService } from './upload.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('spaces/:spaceId/documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: maxUploadFileSizeBytes,
        files: 1,
      },
    }),
  )
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ): Promise<DocumentEntity> {
    return this.uploadService.uploadDocument(
      this.createExecutionContext(user),
      spaceId,
      uploadDocumentDto,
      file,
    );
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
