import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('scenarios')
export class ScenariosController {
  constructor(private scenariosService: ScenariosService) {}

  @Get()
  async getAll() {
    return this.scenariosService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.scenariosService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.scenariosService.create(data);
  }

  @Post(':id/play')
  async recordPlay(@Param('id') id: string) {
    return this.scenariosService.recordPlay(id);
  }

  @Post(':id/upvote')
  async upvote(@Param('id') id: string) {
    return this.scenariosService.upvote(id);
  }
}
