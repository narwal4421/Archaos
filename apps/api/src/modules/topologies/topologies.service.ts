import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TopologiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.topology.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const topology = await this.prisma.topology.findFirst({
      where: { id, userId },
    });
    if (!topology) {
      throw new NotFoundException('Topology not found');
    }
    return topology;
  }

  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      nodesJson: Prisma.InputJsonValue;
      edgesJson: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.topology.create({
      data: {
        userId,
        name: data.name,
        description: data.description || '',
        nodesJson: data.nodesJson,
        edgesJson: data.edgesJson,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      nodesJson?: Prisma.InputJsonValue;
      edgesJson?: Prisma.InputJsonValue;
      isPublic?: boolean;
    },
  ) {
    await this.findOne(id, userId);
    return this.prisma.topology.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        nodesJson: data.nodesJson,
        edgesJson: data.edgesJson,
        isPublic: data.isPublic,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.topology.delete({
      where: { id },
    });
  }

  async saveScreenshot(id: string, userId: string, thumbnail: string) {
    await this.findOne(id, userId);
    return this.prisma.topology.update({
      where: { id },
      data: { thumbnail },
    });
  }
}
