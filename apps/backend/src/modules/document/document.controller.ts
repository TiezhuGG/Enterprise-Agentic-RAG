import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import type { DocumentEntity } from './entities/document.entity';
import { DocumentService } from './document.service';

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
