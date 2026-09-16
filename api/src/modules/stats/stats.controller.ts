import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { QueryStatsDto } from './dto/query-stats.dto.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  resumen(@Query() query: QueryStatsDto) {
    return this.statsService.resumen(query);
  }
}