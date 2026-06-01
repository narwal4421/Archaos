import { Module } from '@nestjs/common';
import { BlastService } from './blast.service';
import { BlastController } from './blast.controller';

@Module({
  providers: [BlastService],
  controllers: [BlastController],
  exports: [BlastService],
})
export class BlastModule {}
