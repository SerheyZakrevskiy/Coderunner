import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRunDto } from './dto/create-run.dto';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post()
  runCode(@Body() body: CreateRunDto) {
    return this.runsService.run(body);
  }

  @Get(':id')
  getRun(@Param('id') id: string) {
    return this.runsService.getRun(id);
  }
}
