import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckResponse } from '@filops/common';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): HealthCheckResponse {
    return this.healthService.getHealth();
  }

  @Get('version')
  @ApiOperation({ summary: 'Get service version' })
  @ApiResponse({ status: 200, description: 'Returns service version' })
  getVersion(): { version: string; service: string } {
    return this.healthService.getVersion();
  }
}
