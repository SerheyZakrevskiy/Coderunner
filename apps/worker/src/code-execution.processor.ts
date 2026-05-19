import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execa } from 'execa';

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
    }
  }
}
