import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRunDto } from './dto/create-run.dto';
import { RunsService } from './runs.service';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  runCode(@Body() body: CreateRunDto, @Req() req: AuthenticatedRequest) {
    return this.runsService.run(body, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  history(@Req() req: AuthenticatedRequest) {
    return this.runsService.getHistory(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRun(@Param('id') id: string) {
    return this.runsService.getRun(id);
  }
}
