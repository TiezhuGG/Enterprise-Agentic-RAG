import { Module } from '@nestjs/common';
import { AgentModule } from '../agent';
import { RetrievalModule } from '../retrieval';
import { EvaluationService } from './evaluation.service';

@Module({
  imports: [AgentModule, RetrievalModule],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
