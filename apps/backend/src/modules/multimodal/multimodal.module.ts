import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { ConfigModule } from '../../config';
import { PrismaModule } from '../../infrastructure/prisma';
import { StorageModule } from '../../infrastructure/storage';
import { AuthModule } from '../auth';
import { ConversationModule } from '../conversation';
import { MultimodalController } from './multimodal.controller';
import { MultimodalRepository } from './multimodal.repository';
import { MultimodalService } from './multimodal.service';
import { MetadataMultimodalProvider } from './providers/metadata-multimodal.provider';
import { MULTIMODAL_PROVIDER } from './providers/multimodal.provider';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    ConversationModule,
    PrismaModule,
    RequestContextModule,
    StorageModule,
  ],
  controllers: [MultimodalController],
  providers: [
    MultimodalRepository,
    MultimodalService,
    {
      provide: MULTIMODAL_PROVIDER,
      useClass: MetadataMultimodalProvider,
    },
  ],
  exports: [MultimodalService],
})
export class MultimodalModule {}
