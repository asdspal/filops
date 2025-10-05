import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsObject, IsUUID, IsOptional } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ description: 'Project ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Policy name', example: 'Production Policy' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Policy document',
    example: {
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
    },
  })
  @IsObject()
  doc: any;

  @ApiProperty({ description: 'Whether policy is active', default: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
