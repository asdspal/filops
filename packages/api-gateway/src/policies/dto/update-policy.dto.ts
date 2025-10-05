import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdatePolicyDto {
  @ApiProperty({ description: 'Policy name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Policy document', required: false })
  @IsObject()
  @IsOptional()
  doc?: any;

  @ApiProperty({ description: 'Whether policy is active', required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
