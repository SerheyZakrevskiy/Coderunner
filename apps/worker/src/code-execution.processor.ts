import 'dotenv/config';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execa } from 'execa';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type ExecutionResult = {
  status: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

type DirectExecutionConfig = {
  image: string;
  command: string;
  args: string[];
};

const DIRECT_EXECUTION_CONFIGS: Record<string, DirectExecutionConfig> = {
  python: {
    image: 'coderunner-python-sandbox',
    command: 'python3',
    args: ['-c'],
  },
  javascript: {
    image: 'coderunner-javascript-sandbox',
    command: 'node',
    args: ['-e'],
  },
};

@Processor('code-execution')
export class CodeExecutionProcessor extends WorkerHost {
  async process(job: Job) {
    const { runId, language, code } = job.data;

    if (!runId) {
      return;
    }

    await this.updateRun(runId, {
      status: 'running',
      stdout: '',
      stderr: '',
      exitCode: null,
    });

    try {
      const result =
        language === 'cpp'
          ? await this.executeCpp(code)
          : await this.executeDirect(language, code);

      await this.updateRun(runId, result);
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

  private async executeDirect(
    language: string,
    code: string,
  ): Promise<ExecutionResult> {
    const config = DIRECT_EXECUTION_CONFIGS[language];

    if (!config) {
      return {
        status: 'failed',
        stdout: '',
        stderr: 'Unsupported language',
        exitCode: 1,
      };
    }

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
        config.image,
        config.command,
        ...config.args,
        code,
      ],
      {
        timeout: 5000,
      },
    );

    return {
      status: 'completed',
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 0,
    };
  }

  private async executeCpp(code: string): Promise<ExecutionResult> {
    const tempDir = await mkdtemp(join(tmpdir(), 'coderunner-cpp-'));
    const sourceFile = join(tempDir, 'main.cpp');

    try {
      await writeFile(sourceFile, code, 'utf8');

      const dockerPath = tempDir.replace(/\\/g, '/');

      const compileAndRun = [
        'g++ /sandbox/main.cpp -O2 -std=c++17 -o /tmp/main',
        '/tmp/main',
      ].join(' && ');

      const result = await execa(
        'docker',
        [
          'run',
          '--rm',
          '--memory=256m',
          '--cpus=0.5',
          '--network=none',
          '--pids-limit=64',
          '--read-only',
          '--tmpfs',
          '/tmp:rw,size=64m,exec',
          '-v',
          `${dockerPath}:/sandbox:ro`,
          'coderunner-cpp-sandbox',
          'sh',
          '-c',
          compileAndRun,
        ],
        {
          timeout: 8000,
        },
      );

      return {
        status: 'completed',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? 0,
      };
    } finally {
      await rm(tempDir, {
        recursive: true,
        force: true,
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
