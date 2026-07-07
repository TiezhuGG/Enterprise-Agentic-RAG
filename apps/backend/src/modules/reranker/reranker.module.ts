import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { BgeRerankerProvider } from './providers/bge-reranker.provider';
import { RERANKER_PROVIDER } from './providers/reranker.provider';
import { RerankerService } from './reranker.service';

@Module({
  imports: [ConfigModule],
  providers: [
    RerankerService,
    {
      provide: RERANKER_PROVIDER,
      useClass: BgeRerankerProvider,
    },
  ],
  exports: [RerankerService],
})
export class RerankerModule {}
