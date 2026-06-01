import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      maxRetriesPerRequest: 1,
    });
  }

  @ApiOperation({ summary: 'Check API, database and Redis status' })
  @Get()
  async check() {
    const result = {
      status: 'ok',
      api: 'ok',
      database: 'unknown',
      redis: 'unknown',
      timestamp: new Date().toISOString(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      result.database = 'connected';
    } catch {
      result.status = 'degraded';
      result.database = 'disconnected';
    }

    try {
      await this.redis.ping();
      result.redis = 'connected';
    } catch {
      result.status = 'degraded';
      result.redis = 'disconnected';
    }

    return result;
  }
}
