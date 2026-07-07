import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { GraphClient } from './graph.client';
import { GraphService } from './graph.service';

@Module({
  imports: [ConfigModule],
  providers: [GraphClient, GraphService],
  exports: [GraphService],
})
export class GraphModule {}
