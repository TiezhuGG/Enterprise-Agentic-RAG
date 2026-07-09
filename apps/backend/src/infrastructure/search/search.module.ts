import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { ObservabilityModule } from '../observability';
import { PrismaModule } from '../prisma';
import { SearchClient } from './search.client';
import { SearchService } from './search.service';

@Module({
  imports: [ConfigModule, ObservabilityModule, PrismaModule],
  providers: [SearchClient, SearchService],
  exports: [SearchService],
})
export class SearchModule {}
