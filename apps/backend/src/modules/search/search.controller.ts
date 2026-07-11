import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchApiService } from './search.service';
import type { SearchRequest, SearchResponse } from './search.types';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly searchApiService: SearchApiService,
  ) {}

  @Get('fulltext')
  searchFulltext(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResponse> {
    return this.searchApiService.searchFulltext(
      this.createExecutionContext(user),
      this.toRequest(query),
    );
  }

  @Get('semantic')
  searchSemantic(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResponse> {
    return this.searchApiService.searchSemantic(
      this.createExecutionContext(user),
      this.toRequest(query),
    );
  }

  @Get('hybrid')
  searchHybrid(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResponse> {
    return this.searchApiService.searchHybrid(
      this.createExecutionContext(user),
      this.toRequest(query),
    );
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }

  private toRequest(query: SearchQueryDto): SearchRequest {
    return {
      categoryId: query.categoryId,
      documentType: query.documentType,
      limit: query.limit,
      offset: query.offset,
      query: query.q,
      sort: query.sort,
      spaceId: query.spaceId,
      tagId: query.tagId,
    };
  }
}
