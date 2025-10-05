import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@ApiTags('policies')
@Controller('policies')
// @ApiBearerAuth() // TODO: Add authentication
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiResponse({ status: 201, description: 'Policy created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation failed' })
  @ApiResponse({ status: 409, description: 'Policy conflicts detected' })
  async create(@Body() createPolicyDto: CreatePolicyDto) {
    const policyService = this.policiesService.getPolicyService();
    
    // TODO: Get actual user ID from authentication
    const actorId = 'system';

    const input = {
      ...createPolicyDto,
      active: createPolicyDto.active ?? false,
    };

    return policyService.create(input, actorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get policy by ID' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Policy found' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getById(@Param('id') id: string) {
    const policyService = this.policiesService.getPolicyService();
    return policyService.getById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List policies for a project' })
  @ApiQuery({ name: 'project_id', description: 'Project ID', required: true })
  @ApiQuery({
    name: 'active_only',
    description: 'Filter active policies only',
    required: false,
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: 'Policies retrieved' })
  async list(
    @Query('project_id') projectId: string,
    @Query('active_only') activeOnly?: boolean,
  ) {
    const policyService = this.policiesService.getPolicyService();
    return policyService.listByProject(projectId, activeOnly === true);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Policy updated successfully' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation failed' })
  async update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    const policyService = this.policiesService.getPolicyService();
    
    // TODO: Get actual user ID from authentication
    const actorId = 'system';

    return policyService.update(id, updatePolicyDto, actorId);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Policy activated' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async activate(@Param('id') id: string) {
    const policyService = this.policiesService.getPolicyService();
    
    // TODO: Get actual user ID from authentication
    const actorId = 'system';

    return policyService.activate(id, actorId);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Policy deactivated' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async deactivate(@Param('id') id: string) {
    const policyService = this.policiesService.getPolicyService();
    
    // TODO: Get actual user ID from authentication
    const actorId = 'system';

    return policyService.deactivate(id, actorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 204, description: 'Policy deleted' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete policy with active agents' })
  async delete(@Param('id') id: string) {
    const policyService = this.policiesService.getPolicyService();
    await policyService.delete(id);
  }

  @Get(':id/compliance')
  @ApiOperation({ summary: 'Get policy compliance status' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiResponse({ status: 200, description: 'Compliance status retrieved' })
  @ApiResponse({ status: 404, description: 'Policy not found' })
  async getCompliance(@Param('id') id: string) {
    const policyService = this.policiesService.getPolicyService();
    return policyService.getComplianceStatus(id);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate policy document without creating it' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(@Body() body: { doc: any }) {
    const policyService = this.policiesService.getPolicyService();
    return policyService.validateDocument(body.doc);
  }
}
