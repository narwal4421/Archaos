import { Controller, Post, Param, UseGuards, Body } from '@nestjs/common';
import { BlastService } from './blast.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blast')
export class BlastController {
  constructor(private blastService: BlastService) {}

  @Post('analyze')
  async analyzeRaw(@Body() body: { nodes: any[]; edges: any[]; rootNodeId: string }): Promise<any> {
    return this.blastService.calculateBlastRadiusFromData(body.nodes, body.edges, body.rootNodeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':topologyId/analyze/:nodeId')
  async analyze(@Param('topologyId') topologyId: string, @Param('nodeId') nodeId: string): Promise<any> {
    return this.blastService.calculateBlastRadius(nodeId, topologyId);
  }
}
