import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  async getAll(@Request() req: AuthenticatedRequest) {
    return this.sessionsService.findAll(req.user.id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: { topologyId?: string; scenarioId?: string },
  ) {
    return this.sessionsService.create(req.user.id, body);
  }

  @Patch(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body()
    body: {
      durationSecs?: number;
      chaosEvents?: any;
      maxErrorRate?: number;
      nodesKilled?: number;
    },
  ) {
    return this.sessionsService.update(id, req.user.id, body);
  }
}
