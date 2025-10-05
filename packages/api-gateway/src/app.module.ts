import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PoliciesModule } from './policies/policies.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [HealthModule, PoliciesModule, AgentsModule],
})
export class AppModule {}
