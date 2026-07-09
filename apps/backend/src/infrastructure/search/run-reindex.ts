import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SearchService } from './search.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const searchService = app.get(SearchService);
    const result = await searchService.reindexAll();

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

void main();
