import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.simSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        topology: {
          select: { name: true },
        },
      },
    });
  }

  async create(userId: string, data: { topologyId?: string; scenarioId?: string }) {
    return this.prisma.simSession.create({
      data: {
        userId,
        topologyId: data.topologyId || null,
        scenarioId: data.scenarioId || null,
        chaosEvents: [],
      },
    });
  }

  async update(id: string, userId: string, data: { durationSecs?: number; chaosEvents?: any; maxErrorRate?: number; nodesKilled?: number }) {
    const session = await this.prisma.simSession.findFirst({
      where: { id, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.simSession.update({
      where: { id },
      data: {
        durationSecs: data.durationSecs,
        chaosEvents: data.chaosEvents,
        maxErrorRate: data.maxErrorRate,
        nodesKilled: data.nodesKilled,
      },
    });
  }
}
