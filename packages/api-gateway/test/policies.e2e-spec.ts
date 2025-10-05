import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Policies API (e2e)', () => {
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

  describe('POST /policies/validate', () => {
    it('should validate a correct policy document', () => {
      const validPolicy = {
        doc: {
          replication: {
            regions: [
              { code: 'NA', min_replicas: 2 },
              { code: 'EU', min_replicas: 1 },
            ],
          },
          availability_target: 0.999,
          cost_ceiling_usd_per_TiB_month: 100,
          renewal: {
            lead_time_days: 14,
            min_collateral_buffer_pct: 20,
          },
          arbitrage: {
            enable: false,
            min_expected_savings_pct: 10,
            verification_strategy: {
              hash_check: true,
              sample_retrieval: 0.01,
            },
          },
          conflict_strategy: 'warn',
        },
      };

      return request(app.getHttpServer())
        .post('/policies/validate')
        .send(validPolicy)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.valid).toBe(true);
          expect(res.body.errors).toHaveLength(0);
        });
    });

    it('should reject invalid policy document', () => {
      const invalidPolicy = {
        doc: {
          replication: {
            regions: [{ code: 'NA', min_replicas: 1 }], // Too few replicas
          },
          availability_target: 0.999,
          cost_ceiling_usd_per_TiB_month: 100,
          renewal: {
            lead_time_days: 14,
            min_collateral_buffer_pct: 20,
          },
          arbitrage: {
            enable: false,
            min_expected_savings_pct: 10,
            verification_strategy: {
              hash_check: true,
              sample_retrieval: 0.01,
            },
          },
        },
      };

      return request(app.getHttpServer())
        .post('/policies/validate')
        .send(invalidPolicy)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.valid).toBe(false);
          expect(res.body.conflicts.length).toBeGreaterThan(0);
        });
    });
  });
});
