import { Controller, Post, Param, UseGuards, Body } from '@nestjs/common';
import {
  BlastService,
  TopologyNode,
  TopologyEdge,
  BlastRadiusResult,
} from './blast.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blast')
export class BlastController {
  constructor(private blastService: BlastService) {}

  @Post('analyze')
  analyzeRaw(
    @Body()
    body: {
      nodes: TopologyNode[];
      edges: TopologyEdge[];
      rootNodeId: string;
    },
  ): BlastRadiusResult {
    return this.blastService.calculateBlastRadiusFromData(
      body.nodes,
      body.edges,
      body.rootNodeId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':topologyId/analyze/:nodeId')
  async analyze(
    @Param('topologyId') topologyId: string,
    @Param('nodeId') nodeId: string,
  ): Promise<BlastRadiusResult> {
    return this.blastService.calculateBlastRadius(nodeId, topologyId);
  }
}
