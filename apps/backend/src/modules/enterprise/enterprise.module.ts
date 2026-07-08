import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthModule } from '../auth';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseRepository } from './enterprise.repository';
import { EnterpriseService } from './enterprise.service';

@Module({
  imports: [AuthModule, PrismaModule, RequestContextModule],
  controllers: [EnterpriseController],
  providers: [EnterpriseRepository, EnterpriseService],
  exports: [EnterpriseRepository, EnterpriseService],
})
export class EnterpriseModule {}
