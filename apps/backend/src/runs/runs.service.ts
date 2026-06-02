import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRunDto } from './dto/create-run.dto';

@Injectable()
export class RunsService {
  constructor(
    @InjectQueue('code-execution')
    private readonly codeExecutionQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async run(body: CreateRunDto, userId: string | null) {
    const run = await this.prisma.run.create({
      data: {
        language: body.language,
        code: body.code,
        status: 'queued',
        userId,
      },
    });

    await this.codeExecutionQueue.add('execute', {
      runId: run.id,
      language: body.language,
      code: body.code,
    });

    return {
      status: 'queued',
      runId: run.id,
    };
  }

  async getRun(id: string) {
    const run = await this.prisma.run.findUnique({
      where: {
        id,
      },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    return run;
  }

  async getHistory(userId: string) {
    return this.prisma.run.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }
}
