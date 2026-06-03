import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { name?: string; email?: string; password?: string },
  ) {
    return this.authService.register(
      body.name || '',
      body.email || '',
      body.password || '',
    );
  }

  @Post('login')
  async login(@Body() body: { email?: string; password?: string }) {
    return this.authService.login(body.email || '', body.password || '');
  }

  @Post('refresh')
  refresh() {
    return { success: true, message: 'Token is active' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.id);
  }
}
