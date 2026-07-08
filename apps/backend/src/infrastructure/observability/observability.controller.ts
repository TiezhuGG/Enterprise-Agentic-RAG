import { Controller, Get, Header } from '@nestjs/common';
import { ObservabilityService } from './observability.service';
import type { HealthResponse } from './observability.types';

@Controller()
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('health')
  getHealth(): HealthResponse {
    return this.observabilityService.getHealth();
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  getMetrics(): string {
    return this.observabilityService.getMetricsText();
  }
}
