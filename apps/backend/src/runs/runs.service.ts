import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

@Injectable()
export class RunsService {
  constructor(
    @InjectQueue('code-execution')
    private readonly queue: Queue,
  ) {}

  async run(data: any) {
    const job = await this.queue.add('execute', {
      language: data.language,
      code: data.code,
    });

    return {
      status: 'queued',
      jobId: job.id,
    };
  }

  async getRun(id: string) {
    const job = await Job.fromId(this.queue, id);

    if (!job) {
      throw new NotFoundException('Run not found');
    }

    const state = await job.getState();

    return {
      jobId: job.id,
      status: state,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    };
  }
}
