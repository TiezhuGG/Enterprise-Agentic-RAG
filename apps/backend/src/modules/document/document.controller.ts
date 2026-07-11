import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentAccessScopeDto } from './dto/update-document-access-scope.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import type { DocumentEntity } from './entities/document.entity';
import {
  DocumentService,
  type DocumentAccessScopeResponse,
  type DocumentMetadataResponse,
} from './document.service';

interface FileResponse {
  setHeader(name: string, value: string | number): void;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('spaces/:spaceId/documents')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentEntity> {
    return this.documentService.create(
      this.createExecutionContext(user),
      spaceId,
      createDocumentDto,
    );
  }

  @Get('spaces/:spaceId/documents')
  listBySpace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
  ): Promise<DocumentEntity[]> {
    return this.documentService.listBySpace(this.createExecutionContext(user), spaceId);
  }

  @Get('documents/:id/metadata')
  getMetadata(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentMetadataResponse> {
    return this.documentService.getMetadata(this.createExecutionContext(user), id);
  }

  @Get('documents/:id/access-scope')
  getAccessScope(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentAccessScopeResponse> {
    return this.documentService.getAccessScope(this.createExecutionContext(user), id);
  }

  @Patch('documents/:id/access-scope')
  updateAccessScope(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDocumentAccessScopeDto: UpdateDocumentAccessScopeDto,
  ): Promise<DocumentAccessScopeResponse> {
    return this.documentService.updateAccessScope(
      this.createExecutionContext(user),
      id,
      updateDocumentAccessScopeDto,
    );
  }

  @Get('documents/:id/file')
  async getFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('disposition') disposition: 'inline' | 'attachment' | undefined,
    @Res({ passthrough: true }) response: FileResponse,
  ): Promise<StreamableFile> {
    const file = await this.documentService.getFile(this.createExecutionContext(user), id);
    const normalizedDisposition = disposition === 'attachment' ? 'attachment' : 'inline';
    const asciiFilename = file.filename.replace(/[^\x20-\x7E]/g, '_');

    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Length', file.size);
    response.setHeader(
      'Content-Disposition',
      `${normalizedDisposition}; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(
        file.filename,
      )}`,
    );

    return new StreamableFile(file.buffer);
  }

  @Get('documents/:id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentEntity> {
    return this.documentService.getById(this.createExecutionContext(user), id);
  }

  @Patch('documents/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ): Promise<DocumentEntity> {
    return this.documentService.update(this.createExecutionContext(user), id, updateDocumentDto);
  }

  @Delete('documents/:id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<DocumentEntity> {
    return this.documentService.delete(this.createExecutionContext(user), id);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
