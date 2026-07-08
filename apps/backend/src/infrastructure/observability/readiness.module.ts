import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { GraphModule } from '../graph';
import { PrismaModule } from '../prisma';
import { RedisModule } from '../redis';
import { StorageModule } from '../storage';
import { VectorModule } from '../vector';
import { ObservabilityModule } from './observability.module';
import { ReadinessController } from './readiness.controller';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [
    ConfigModule,
    GraphModule,
    ObservabilityModule,
    PrismaModule,
    RedisModule,
    StorageModule,
    VectorModule,
  ],
  controllers: [ReadinessController],
  providers: [ReadinessService],
  exports: [ReadinessService],
})
export class ReadinessModule {}
