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
}
