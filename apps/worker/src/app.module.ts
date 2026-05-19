import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AppService } from './app.service';
import { CodeExecutionProcessor } from './code-execution.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'code-execution',
    }),
  ],
  providers: [AppService, CodeExecutionProcessor],
})
export class AppModule {}
