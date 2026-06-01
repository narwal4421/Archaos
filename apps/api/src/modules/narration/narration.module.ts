import { Module } from '@nestjs/common';
import { NarrationGateway } from './narration.gateway';

@Module({
  providers: [NarrationGateway],
  exports: [NarrationGateway],
})
export class NarrationModule {}
