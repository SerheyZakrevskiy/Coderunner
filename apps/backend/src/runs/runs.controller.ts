import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateRunDto } from './dto/create-run.dto';
import { RunsService } from './runs.service';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
  } | null;
};

@ApiTags('Runs')
@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create new code execution run' })
  @Post()
  runCode(@Body() body: CreateRunDto, @Req() req: AuthenticatedRequest) {
    return this.runsService.run(body, req.user?.userId ?? null);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user run history' })
  @Get('history')
  history(@Req() req: AuthenticatedRequest) {
    return this.runsService.getHistory(req.user!.userId);
  }

  @ApiOperation({ summary: 'Get run by ID' })
  @Get(':id')
  getRun(@Param('id') id: string) {
    return this.runsService.getRun(id);
  }
}
