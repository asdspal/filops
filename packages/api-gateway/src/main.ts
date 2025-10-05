import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '@filops/common';

async function bootstrap() {
  const logger = createLogger({
    service: 'api-gateway',
    level: process.env.LOG_LEVEL || 'info',
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FilOps API')
    .setDescription('FilOps Autonomous Agent Suite API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.info(`🚀 API Gateway running on http://localhost:${port}`);
  logger.info(`📚 API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
