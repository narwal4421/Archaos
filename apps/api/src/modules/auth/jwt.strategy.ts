import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'archaos-super-secret-key-12345',
    });
  }

  async validate(payload: any) {
    // With Supabase auth, sub is the user's UUID.
    // We can either find or upsert the user in our Prisma database dynamically
    // so they exist in our local system.
    let user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      // Create user locally if they don't exist yet but have a valid token
      const email = payload.email || '';
      const name = payload.user_metadata?.name || email.split('@')[0] || 'User';
      
      user = await this.prisma.user.create({
        data: {
          id: payload.sub,
          email,
          name,
          passwordHash: '', // No password hash needed locally with Supabase
        },
      });
    }

    return { id: user.id, email: user.email, name: user.name };
  }
}
