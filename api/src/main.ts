import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  // Debug environment loading before app starts
  console.log('===== Environment Configuration =====');
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Parent directory: ${path.resolve(process.cwd(), '..')}`);
  
  // Check if .env exists in various locations
  const rootEnvPath = path.resolve(process.cwd(), '../.env');
  const apiEnvPath = path.resolve(process.cwd(), '.env');
  
  console.log(`Root .env exists: ${fs.existsSync(rootEnvPath) ? 'Yes ✓' : 'No ⨯'}`);
  console.log(`API .env exists: ${fs.existsSync(apiEnvPath) ? 'Yes ✓' : 'No ⨯'}`);
  console.log('===================================');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Log environment variables after app is created
  console.log('===== Loaded Environment Variables =====');
  console.log(`JWT_SECRET: ${configService.get('JWT_SECRET') ? 'Loaded ✓' : 'Missing ⨯'}`);
  console.log(`DB_HOST: ${configService.get('DB_HOST') || 'default'}`);
  console.log(`DB_PORT: ${configService.get('DB_PORT') || 'default'}`);
  console.log('=======================================');

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://yeee.pages.dev', // Add your Cloudflare domain here
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('The NestJS API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
