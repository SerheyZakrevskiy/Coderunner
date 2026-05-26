import 'dotenv/config';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execa } from 'execa';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

@Processor('code-execution')
export class CodeExecutionProcessor extends WorkerHost {
  async process(job: Job) {
    const { runId, language, code } = job.data;

    if (!runId) {
      return;
    }

    if (language !== 'python') {
      await this.updateRun(runId, {
        status: 'failed',
        stdout: '',
        stderr: 'Unsupported language',
        exitCode: 1,
      });

      return;
    }

    await this.updateRun(runId, {
      status: 'running',
      stdout: '',
      stderr: '',
      exitCode: null,
    });

    try {
      const result = await execa(
        'docker',
        [
          'run',
          '--rm',
          '--memory=128m',
          '--cpus=0.5',
          '--network=none',
          '--pids-limit=64',
          '--read-only',
          '--tmpfs',
          '/tmp:rw,size=64m',
          'coderunner-python-sandbox',
          'python3',
          '-c',
          code,
        ],
        {
          timeout: 5000,
        },
      );

      await this.updateRun(runId, {
        status: 'completed',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? 0,
      });
    } catch (error: any) {
      await this.updateRun(runId, {
        status: error.timedOut ? 'timeout' : 'failed',
        stdout: error.stdout ?? '',
        stderr: error.timedOut
          ? 'Execution timeout exceeded'
          : (error.stderr ?? error.message),
        exitCode: error.exitCode ?? 1,
      });
    }
  }

  private async updateRun(
    runId: string,
    data: {
      status: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
    },
  ) {
    await pool.query(
      `
      UPDATE "Run"
      SET "status" = $1,
          "stdout" = $2,
          "stderr" = $3,
          "exitCode" = $4
      WHERE "id" = $5
      `,
      [data.status, data.stdout, data.stderr, data.exitCode, runId],
    );
  }
}
