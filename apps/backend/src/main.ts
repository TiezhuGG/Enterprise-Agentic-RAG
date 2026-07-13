import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common';
import { ConfigService } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  const configService = app.get(ConfigService);
  const { corsOrigins, port } = configService.getAppConfig();

  app.useGlobalFilters(new AppExceptionFilter());
  app.use(
    (
      _request: unknown,
      response: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      if (configService.getAppConfig().env === 'production') {
        response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }

      next();
    },
  );
  app.enableCors({
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: corsOrigins,
  });

  await app.listen(port);
}

void bootstrap();
