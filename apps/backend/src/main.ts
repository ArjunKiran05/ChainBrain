import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe());

  const server = app.getHttpAdapter().getInstance();

  server.post('/raw-test', (req, res) => {
    console.log('Content-Type:', req.headers['content-type']);
    console.log('req.file =', req.file);
    console.log('req.body =', req.body);

    res.json({ ok: true });
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
});
