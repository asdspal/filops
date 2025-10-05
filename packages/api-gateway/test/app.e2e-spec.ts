import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Gateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return 200 and health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.status).toBe('healthy');
          expect(res.body.version).toBeDefined();
          expect(res.body.timestamp).toBeDefined();
          expect(res.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });
  });

  describe('/version (GET)', () => {
    it('should return 200 and version information', () => {
      return request(app.getHttpServer())
        .get('/version')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.version).toBeDefined();
          expect(res.body.service).toBe('api-gateway');
        });
    });
  });
});
