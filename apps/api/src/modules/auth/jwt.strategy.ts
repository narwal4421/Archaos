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
    
    // Explicitly casting this.prisma as any to bypass local IDE TS errors regarding Prisma schema resolving,
    // then extracting properties safely to satisfy strict type rules.
    const prismaClient = this.prisma as any;
    
    const existingUser = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return {
        id: (existingUser as ValidatedUser).id,
        email: (existingUser as ValidatedUser).email,
        name: (existingUser as ValidatedUser).name,
      };
    }

    // Create user locally if they don't exist yet but have a valid token
    const email = payload.email || '';
    const name = payload.user_metadata?.name || email.split('@')[0] || 'User';
    
    const newUser = await prismaClient.user.create({
      data: {
        id: userId,
        email,
        name,
        passwordHash: '', // No password hash needed locally with Supabase
      },
    });

    return {
      id: (newUser as ValidatedUser).id,
      email: (newUser as ValidatedUser).email,
      name: (newUser as ValidatedUser).name,
    };
  }
}
