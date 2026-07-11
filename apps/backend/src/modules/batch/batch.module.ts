import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { AuthModule } from '../auth';
import { DocumentModule } from '../document';
import { IngestionModule } from '../ingestion';
import { TaxonomyModule } from '../taxonomy';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';

@Module({
  imports: [AuthModule, DocumentModule, IngestionModule, RequestContextModule, TaxonomyModule],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}
