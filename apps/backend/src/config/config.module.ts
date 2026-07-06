import { Global, Module } from '@nestjs/common';
import { CONFIGURATION, createConfiguration } from './configuration';
import { ConfigService } from './config.service';

@Global()
@Module({
  providers: [
    {
      provide: CONFIGURATION,
      useFactory: createConfiguration,
    },
    ConfigService,
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
