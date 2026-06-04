import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScenariosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.scenario.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id },
    });
    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }
    return scenario;
  }

  async recordPlay(id: string) {
    await this.findOne(id);
    return this.prisma.scenario.update({
      where: { id },
      data: {
        playCount: {
          increment: 1,
        },
      },
    });
  }

  async create(data: { name: string; description: string; category: string; difficulty: string; nodesJson: any; edgesJson: any; chaosScript: any; walkthroughScript: any }) {
    return this.prisma.scenario.create({
      data: {
        ...data,
        isBuiltIn: false,
        playCount: 0,
        upvotes: 0,
      },
    });
  }

  async upvote(id: string) {
    await this.findOne(id);
    return this.prisma.scenario.update({
      where: { id },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });
  }
}
