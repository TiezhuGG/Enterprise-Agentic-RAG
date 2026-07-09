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
import { CompositeMultimodalProvider } from './providers/composite-multimodal.provider';
import { MetadataAsrProvider } from './providers/metadata-asr.provider';
import { MetadataOcrProvider } from './providers/metadata-ocr.provider';
import { MetadataVideoUnderstandingProvider } from './providers/metadata-video-understanding.provider';
import { MULTIMODAL_PROVIDER } from './providers/multimodal.provider';
import { OpenAiCompatibleAsrProvider } from './providers/openai-compatible-asr.provider';
import { OpenAiCompatibleOcrProvider } from './providers/openai-compatible-ocr.provider';
import { OpenAiCompatibleVideoUnderstandingProvider } from './providers/openai-compatible-video-understanding.provider';

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
    CompositeMultimodalProvider,
    MetadataAsrProvider,
    MetadataOcrProvider,
    MetadataVideoUnderstandingProvider,
    OpenAiCompatibleAsrProvider,
    OpenAiCompatibleOcrProvider,
    OpenAiCompatibleVideoUnderstandingProvider,
    {
      provide: MULTIMODAL_PROVIDER,
      useClass: CompositeMultimodalProvider,
    },
  ],
  exports: [MultimodalService, MULTIMODAL_PROVIDER],
})
export class MultimodalModule {}
