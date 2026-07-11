import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AccessPolicyModule } from '../access-policy';
import { AuthModule } from '../auth';
import { DocumentModule } from '../document';
import { KnowledgeSpaceModule } from '../knowledge-space';
import { TaxonomyController } from './taxonomy.controller';
import { TaxonomyRepository } from './taxonomy.repository';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [
    AccessPolicyModule,
    AuthModule,
    DocumentModule,
    KnowledgeSpaceModule,
    PrismaModule,
    RequestContextModule,
  ],
  controllers: [TaxonomyController],
  providers: [TaxonomyRepository, TaxonomyService],
  exports: [TaxonomyRepository, TaxonomyService],
})
export class TaxonomyModule {}
