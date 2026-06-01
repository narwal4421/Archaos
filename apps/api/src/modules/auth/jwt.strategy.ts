import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface ValidatedUser {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'archaos-super-secret-key-12345',
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<ValidatedUser> {
    // With Supabase auth, sub is the user's UUID.
    // We can either find or upsert the user in our Prisma database dynamically
    // so they exist in our local system.
    const userId = payload.sub;
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return { id: existingUser.id, email: existingUser.email, name: existingUser.name };
    }

    // Create user locally if they don't exist yet but have a valid token
    const email = payload.email || '';
    const name = payload.user_metadata?.name || email.split('@')[0] || 'User';
    
    const newUser = await this.prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        passwordHash: '', // No password hash needed locally with Supabase
      },
    });

    return { id: newUser.id, email: newUser.email, name: newUser.name };
  }
}
