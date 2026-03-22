import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateSkillDto, AddKnowledgeDto } from './dto/agent-assets.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.agent.findMany({
      include: { 
        skills: true,
        knowledge: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSkills() {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateAgentDto, userId: string) {
    const { name, role, systemPrompt, skillIds } = dto;
    return this.prisma.agent.create({
      data: {
        name,
        role,
        systemPrompt,
        userId,
        skills: {
          connect: (skillIds || []).map((id: string) => ({ id })),
        },
      },
      include: { skills: true },
    });
  }

  async remove(id: string, userId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundException('Agent not found');
    if (agent.userId && agent.userId !== userId) {
      throw new ForbiddenException('Only the owner can delete this agent');
    }
    return this.prisma.agent.delete({ where: { id } });
  }

  async createSkill(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: dto,
    });
  }

  async addKnowledge(agentId: string, dto: AddKnowledgeDto) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    return this.prisma.knowledge.create({
      data: {
        agentId,
        content: dto.content,
        metadata: dto.metadata,
      },
    });
  }

  async removeSkill(id: string) {
    return this.prisma.skill.delete({ where: { id } });
  }

  async removeKnowledge(id: string) {
    return this.prisma.knowledge.delete({ where: { id } });
  }
}

