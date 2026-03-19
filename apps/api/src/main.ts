import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnvironment } from './config/load-environment';

async function bootstrap() {
  loadEnvironment();
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
