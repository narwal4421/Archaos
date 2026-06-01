import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TopologiesModule } from './modules/topologies/topologies.module';
import { ScenariosModule } from './modules/scenarios/scenarios.module';
import { BlastModule } from './modules/blast/blast.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { NarrationModule } from './modules/narration/narration.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TopologiesModule,
    ScenariosModule,
    BlastModule,
    SessionsModule,
    NarrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
