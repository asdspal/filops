import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AgentType, AgentStatus } from '@filops/agent-orchestrator';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new agent' })
  @ApiResponse({ status: 201, description: 'Agent registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async registerAgent(
    @Body()
    body: {
      type: AgentType;
      projectId: string;
      policyId: string;
      config?: any;
    }
  ) {
    return await this.agentsService.registerAgent(body);
  }

  @Get()
  @ApiOperation({ summary: 'List all agents' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'policyId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: AgentType })
  @ApiQuery({ name: 'status', required: false, enum: AgentStatus })
  @ApiResponse({ status: 200, description: 'List of agents' })
  async listAgents(
    @Query('projectId') projectId?: string,
    @Query('policyId') policyId?: string,
    @Query('type') type?: AgentType,
    @Query('status') status?: AgentStatus
  ) {
    return await this.agentsService.listAgents({
      projectId,
      policyId,
      type,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent status' })
  @ApiResponse({ status: 200, description: 'Agent status' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getAgentStatus(@Param('id') id: string) {
    return await this.agentsService.getAgentStatus(id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start an agent' })
  @ApiResponse({ status: 200, description: 'Agent started successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async startAgent(@Param('id') id: string) {
    return await this.agentsService.startAgent(id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an agent' })
  @ApiResponse({ status: 200, description: 'Agent paused successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async pauseAgent(@Param('id') id: string) {
    return await this.agentsService.pauseAgent(id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused agent' })
  @ApiResponse({ status: 200, description: 'Agent resumed successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @ApiResponse({ status: 400, description: 'Agent is not paused' })
  async resumeAgent(@Param('id') id: string) {
    return await this.agentsService.resumeAgent(id);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop an agent' })
  @ApiResponse({ status: 200, description: 'Agent stopped successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async stopAgent(@Param('id') id: string) {
    return await this.agentsService.stopAgent(id);
  }

  @Post(':id/actions/:actionId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve an action' })
  @ApiResponse({ status: 200, description: 'Action approved and executed' })
  @ApiResponse({ status: 404, description: 'Agent or action not found' })
  async approveAction(
    @Param('id') id: string,
    @Param('actionId') actionId: string
  ) {
    await this.agentsService.approveAction(id, actionId);
    return { message: 'Action approved and executed' };
  }

  @Post(':id/actions/:actionId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject an action' })
  @ApiResponse({ status: 200, description: 'Action rejected' })
  @ApiResponse({ status: 404, description: 'Agent or action not found' })
  async rejectAction(
    @Param('id') id: string,
    @Param('actionId') actionId: string,
    @Body() body: { reason?: string }
  ) {
    await this.agentsService.rejectAction(id, actionId, body.reason);
    return { message: 'Action rejected' };
  }
}
