import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { AuthModule } from './modules/auth';
import { UserModule } from './modules/user';

@Module({
  imports: [ConfigModule, AuthModule, UserModule],
})
export class AppModule {}
