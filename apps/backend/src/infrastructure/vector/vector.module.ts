import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { VectorClient } from './vector.client';
import { VectorService } from './vector.service';

@Module({
  imports: [PrismaModule],
  providers: [VectorClient, VectorService],
  exports: [VectorService],
})
export class VectorModule {}
