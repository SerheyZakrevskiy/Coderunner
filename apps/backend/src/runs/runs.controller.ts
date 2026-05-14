import { Body, Controller, Post } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post()
  runCode(@Body() body: any) {
    return this.runsService.run(body);
  }
}
