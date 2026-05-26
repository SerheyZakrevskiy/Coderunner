import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from '../prisma/prisma.module';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'code-execution',
    }),
  ],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
