import { Controller, Get } from '@nestjs/common';
import type { ReadinessResponse } from './observability.types';
import { ReadinessService } from './readiness.service';

@Controller()
export class ReadinessController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get('health/readiness')
  getReadiness(): Promise<ReadinessResponse> {
    return this.readinessService.getReadiness();
  }
}
