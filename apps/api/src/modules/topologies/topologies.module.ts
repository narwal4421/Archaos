import { Module } from '@nestjs/common';
import { TopologiesService } from './topologies.service';
import { TopologiesController } from './topologies.controller';

@Module({
  providers: [TopologiesService],
  controllers: [TopologiesController],
  exports: [TopologiesService],
})
export class TopologiesModule {}
