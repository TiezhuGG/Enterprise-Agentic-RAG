import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { ConfigModule } from '../../config';
import { ObservabilityModule } from '../../infrastructure/observability';
import { ReadinessModule } from '../../infrastructure/observability/readiness.module';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthModule } from '../auth';
import { OpsController } from './ops.controller';
import { OpsRepository } from './ops.repository';
import { OpsService } from './ops.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    ObservabilityModule,
    PrismaModule,
    ReadinessModule,
    RequestContextModule,
  ],
  controllers: [OpsController],
  providers: [OpsRepository, OpsService],
  exports: [OpsService],
})
export class OpsModule {}
