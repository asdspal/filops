import { Injectable } from '@nestjs/common';
import { HealthStatus, HealthCheckResponse } from '@filops/common';

@Injectable()
export class HealthService {
  private readonly startTime: number;
  private readonly version: string;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '0.1.0';
  }

  getHealth(): HealthCheckResponse {
    return {
      status: HealthStatus.HEALTHY,
      version: this.version,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      dependencies: {
        database: HealthStatus.HEALTHY, // Will be implemented later
        kafka: HealthStatus.HEALTHY, // Will be implemented later
      },
    };
  }

  getVersion(): { version: string; service: string } {
    return {
      version: this.version,
      service: 'api-gateway',
    };
  }
}
