import { Injectable } from '@nestjs/common';

@Injectable()
export class RunsService {
  run(data: any) {
    return {
      status: 'queued',
      language: data.language,
      code: data.code,
    };
  }
}
