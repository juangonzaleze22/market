import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { SeedService } from './database/seeders/seed.service.js';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET es obligatorio en producción');
    }
    const hasMailjet =
      process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY;
    if (!hasMailjet && !process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
      throw new Error(
        'MAILJET_API_KEY/MAILJET_SECRET_KEY, RESEND_API_KEY o SMTP_HOST es obligatorio en producción para enviar verificaciones y reseteos',
      );
    }
    if (process.env.AUTH_EXPOSE_VERIFICATION_TOKEN === 'true') {
      throw new Error(
        'AUTH_EXPOSE_VERIFICATION_TOKEN no puede estar activo en producción',
      );
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const trustProxyRaw = process.env.TRUST_PROXY?.trim();
  const trustProxy = trustProxyRaw ? Number(trustProxyRaw) : 1;
  app.set('trust proxy', Number.isFinite(trustProxy) ? trustProxy : 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api');

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Market API')
    .setDescription('API del e-commerce Market')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (process.env.RUN_SEED === 'true') {
    const seedService = app.get(SeedService);
    await seedService.run();
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
