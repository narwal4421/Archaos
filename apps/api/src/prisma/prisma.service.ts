/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Connected to Database via Prisma');
    } catch (e) {
      console.error('Database connection failed', e);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
