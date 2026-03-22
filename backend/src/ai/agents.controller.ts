import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateSkillDto, AddKnowledgeDto } from './dto/agent-assets.dto';

@ApiTags('agents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  @ApiResponse({ status: 200, description: 'List of all agents with their skills and knowledge' })
  async findAll() {
    return this.agentsService.findAll();
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get all available skills' })
  @ApiResponse({ status: 200, description: 'List of all available skills for agents' })
  async findSkills() {
    return this.agentsService.findSkills();
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async create(@Body() dto: CreateAgentDto, @Request() req: any) {
    return this.agentsService.create(dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.agentsService.remove(id, req.user.id);
  }

  @Post('skills')
  @ApiOperation({ summary: 'Create a new skill (tool)' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  async createSkill(@Body() dto: CreateSkillDto) {
    return this.agentsService.createSkill(dto);
  }

  @Delete('skills/:id')
  @ApiOperation({ summary: 'Delete a skill' })
  @ApiResponse({ status: 200, description: 'Skill deleted successfully' })
  async removeSkill(@Param('id') id: string) {
    return this.agentsService.removeSkill(id);
  }

  @Post(':id/knowledge')
  @ApiOperation({ summary: 'Add knowledge (training) to an agent' })
  @ApiResponse({ status: 201, description: 'Knowledge added successfully' })
  async addKnowledge(@Param('id') id: string, @Body() dto: AddKnowledgeDto) {
    return this.agentsService.addKnowledge(id, dto);
  }

  @Delete('knowledge/:id')
  @ApiOperation({ summary: 'Delete knowledge entry' })
  @ApiResponse({ status: 200, description: 'Knowledge entry deleted successfully' })
  async removeKnowledge(@Param('id') id: string) {
    return this.agentsService.removeKnowledge(id);
  }
}

