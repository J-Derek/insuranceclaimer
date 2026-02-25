import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const port = process.env.PORT || 3000;
    const apiPrefix = process.env.API_PREFIX || 'api/v1';

    // Global prefix
    app.setGlobalPrefix(apiPrefix);

    // Security
    app.use(helmet());
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // Global filters and interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TransformInterceptor(),
    );

    // Swagger
    const swaggerConfig = new DocumentBuilder()
        .setTitle('KlaimSwift API')
        .setDescription('Insurance Claims System — Production API')
        .setVersion('1.0')
        .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'access-token',
        )
        .addTag('Auth', 'Authentication and authorization')
        .addTag('Claims', 'Claims management')
        .addTag('Fraud', 'Fraud detection and scoring')
        .addTag('OCR', 'Document OCR processing')
        .addTag('Payments', 'Payment processing and M-Pesa')
        .addTag('Admin', 'Administration and analytics')
        .addTag('Health', 'System health checks')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });

    await app.listen(port);
    logger.log(`KlaimSwift API running on port ${port}`);
    logger.log(`Swagger docs: http://localhost:${port}/api`);
}

bootstrap();
