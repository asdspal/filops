import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthStatus } from '@filops/common';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = controller.getHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.version).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.dependencies).toBeDefined();
    });
  });

  describe('getVersion', () => {
    it('should return version information', () => {
      const result = controller.getVersion();

      expect(result).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.service).toBe('api-gateway');
    });
  });
});
