import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execa } from 'execa';
import { nanoid } from 'nanoid';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

@Processor('code-execution')
export class CodeExecutionProcessor extends WorkerHost {
  async process(job: Job) {
    const { language, code } = job.data;

    if (language !== 'python') {
      return {
        status: 'failed',
        stdout: '',
        stderr: 'Unsupported language',
        exitCode: 1,
      };
    }

    const runId = nanoid();
    const tempDir = join(tmpdir(), `coderunner-${runId}`);
    const sourceFile = join(tempDir, 'main.py');

    try {
      await mkdir(tempDir, { recursive: true });
      await writeFile(sourceFile, code, 'utf8');

      const dockerMountPath = tempDir.replace(/\\/g, '/');

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
          '-v',
          `${dockerMountPath}:/sandbox:ro`,
          'coderunner-python-sandbox',
          'python3',
          '/sandbox/main.py',
        ],
        {
          timeout: 5000,
        },
      );

      return {
        status: 'completed',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (error: any) {
      return {
        status: error.timedOut ? 'timeout' : 'failed',
        stdout: error.stdout ?? '',
        stderr: error.timedOut
          ? 'Execution timeout exceeded'
          : (error.stderr ?? error.message),
        exitCode: error.exitCode ?? 1,
      };
    } finally {
      await rm(tempDir, {
        recursive: true,
        force: true,
      });
    }
  }
}
