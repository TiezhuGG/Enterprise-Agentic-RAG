import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, finalize, tap } from 'rxjs';
import { ObservabilityService } from './observability.service';

type ObservableUser = {
  id?: string;
  metadata?: Record<string, unknown>;
};

type ObservableRequest = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  requestId?: string;
  route?: {
    path?: string;
  };
  url?: string;
  user?: ObservableUser;
};

type ObservableResponse = {
  setHeader?: (name: string, value: string) => void;
  statusCode?: number;
};

type HttpError = {
  status?: number;
  getStatus?: () => number;
};

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<ObservableRequest>();
    const response = context.switchToHttp().getResponse<ObservableResponse>();
    const requestId = this.observabilityService.resolveRequestId(request.headers?.['x-request-id']);
    const startedAt = Date.now();
    let capturedError: unknown;

    request.requestId = requestId;
    response.setHeader?.('x-request-id', requestId);

    if (request.user) {
      request.user.metadata = {
        ...request.user.metadata,
        requestId,
      };
    }

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          capturedError = error;
        },
      }),
      finalize(() => {
        const statusCode = capturedError
          ? this.resolveErrorStatus(capturedError)
          : (response.statusCode ?? 200);

        this.observabilityService.recordHttpRequest({
          durationMs: Date.now() - startedAt,
          error: capturedError,
          method: request.method ?? 'UNKNOWN',
          path: this.resolvePath(request),
          requestId,
          statusCode,
          userId: request.user?.id,
        });
      }),
    );
  }

  private resolvePath(request: ObservableRequest): string {
    if (request.route?.path) {
      return request.route.path;
    }

    return request.url?.split('?')[0] ?? 'unknown';
  }

  private resolveErrorStatus(error: unknown): number {
    const candidate = error as HttpError;

    if (typeof candidate.getStatus === 'function') {
      return candidate.getStatus();
    }

    if (typeof candidate.status === 'number') {
      return candidate.status;
    }

    return 500;
  }
}
