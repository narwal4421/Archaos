import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { runHeadlessSim } from './modules/sessions/headless-runner';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Health check endpoint for Railway / Render / any PaaS uptime probe. */
  @Get('health')
  health(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  @Post('run-headless')
  runHeadless(
    @Body()
    body: {
      nodes: any[];
      edges: any[];
      chaosScript: any[];
      durationSecs?: number;
    },
  ) {
    return runHeadlessSim(
      body.nodes || [],
      body.edges || [],
      body.chaosScript || [],
      body.durationSecs || 30,
    );
  }
}
