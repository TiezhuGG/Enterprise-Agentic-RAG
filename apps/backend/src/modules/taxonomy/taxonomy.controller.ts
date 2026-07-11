import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateDocumentTaxonomyDto } from './dto/update-document-taxonomy.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import type {
  DocumentCategoryEntity,
  DocumentTagEntity,
  DocumentTaxonomyEntity,
} from './entities/taxonomy.entity';
import { TaxonomyService } from './taxonomy.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TaxonomyController {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly taxonomyService: TaxonomyService,
  ) {}

  @Post('spaces/:spaceId/categories')
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<DocumentCategoryEntity> {
    return this.taxonomyService.createCategory(
      this.createExecutionContext(user),
      spaceId,
      createCategoryDto,
    );
  }

  @Post('spaces/:spaceId/tags')
  createTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
    @Body() createTagDto: CreateTagDto,
  ): Promise<DocumentTagEntity> {
    return this.taxonomyService.createTag(this.createExecutionContext(user), spaceId, createTagDto);
  }

  @Delete('categories/:id')
  deleteCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentCategoryEntity> {
    return this.taxonomyService.deleteCategory(this.createExecutionContext(user), id);
  }

  @Delete('tags/:id')
  deleteTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentTagEntity> {
    return this.taxonomyService.deleteTag(this.createExecutionContext(user), id);
  }

  @Get('documents/:id/taxonomy')
  getDocumentTaxonomy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DocumentTaxonomyEntity> {
    return this.taxonomyService.getDocumentTaxonomy(this.createExecutionContext(user), id);
  }

  @Get('spaces/:spaceId/categories')
  listCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
  ): Promise<DocumentCategoryEntity[]> {
    return this.taxonomyService.listCategories(this.createExecutionContext(user), spaceId);
  }

  @Get('spaces/:spaceId/tags')
  listTags(
    @CurrentUser() user: AuthenticatedUser,
    @Param('spaceId') spaceId: string,
  ): Promise<DocumentTagEntity[]> {
    return this.taxonomyService.listTags(this.createExecutionContext(user), spaceId);
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<DocumentCategoryEntity> {
    return this.taxonomyService.updateCategory(
      this.createExecutionContext(user),
      id,
      updateCategoryDto,
    );
  }

  @Patch('documents/:id/taxonomy')
  updateDocumentTaxonomy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDocumentTaxonomyDto: UpdateDocumentTaxonomyDto,
  ): Promise<DocumentTaxonomyEntity> {
    return this.taxonomyService.updateDocumentTaxonomy(
      this.createExecutionContext(user),
      id,
      updateDocumentTaxonomyDto,
    );
  }

  @Patch('tags/:id')
  updateTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<DocumentTagEntity> {
    return this.taxonomyService.updateTag(this.createExecutionContext(user), id, updateTagDto);
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
