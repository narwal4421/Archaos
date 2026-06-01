import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Get()
  async getAll(@Request() req) {
    return this.sessionsService.findAll(req.user.id);
  }

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.sessionsService.create(req.user.id, body);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.sessionsService.update(id, req.user.id, body);
  }
}
