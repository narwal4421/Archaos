import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TopologiesService } from './topologies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('topologies')
export class TopologiesController {
  constructor(private topologiesService: TopologiesService) {}

  @Get()
  async getAll(@Request() req) {
    return this.topologiesService.findAll(req.user.id);
  }

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.topologiesService.create(req.user.id, body);
  }

  @Get(':id')
  async getOne(@Request() req, @Param('id') id: string) {
    return this.topologiesService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.topologiesService.update(id, req.user.id, body);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.topologiesService.remove(id, req.user.id);
  }

  @Post(':id/screenshot')
  async saveScreenshot(@Request() req, @Param('id') id: string, @Body('imageData') imageData: string) {
    return this.topologiesService.saveScreenshot(id, req.user.id, imageData);
  }
}
