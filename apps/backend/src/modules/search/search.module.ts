import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { DocumentModule } from '../document';
import { RetrievalModule } from '../retrieval';
import { TaxonomyModule } from '../taxonomy';
import { SearchController } from './search.controller';
import { SearchApiService } from './search.service';

@Module({
  controllers: [SearchController],
  imports: [DocumentModule, RequestContextModule, RetrievalModule, TaxonomyModule],
  providers: [SearchApiService],
  exports: [SearchApiService],
})
export class KnowledgeSearchModule {}
