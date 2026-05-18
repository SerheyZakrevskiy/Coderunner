import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'code-execution',
    }),
  ],
  controllers: [RunsController],
  providers: [RunsService],
})
export class RunsModule {}
