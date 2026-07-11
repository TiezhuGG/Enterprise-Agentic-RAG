import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import {
  appErrorMessages,
  createAppErrorResponse,
  getAppErrorResponse,
  inferAppErrorCode,
  sanitizeAppErrorMessage,
} from './app-error-codes';
import type { AppErrorResponse } from './app-error-codes';

interface HttpRequestLike {
  headers?: Record<string, string | string[] | undefined>;
  originalUrl?: string;
  url?: string;
}

interface HttpResponseLike {
  json: (body: AppErrorResponse) => void;
  status: (statusCode: number) => HttpResponseLike;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const appError = this.resolveAppError(exception, statusCode);
    const body = createAppErrorResponse(appError.code, appError.message, {
      path: request.originalUrl ?? request.url,
      requestId: this.readRequestId(request),
      statusCode,
      timestamp: new Date().toISOString(),
    });

    response.status(statusCode).json(body);
  }

  private resolveAppError(
    exception: unknown,
    statusCode: number,
  ): Pick<AppErrorResponse, 'code' | 'message'> {
    const appError = getAppErrorResponse(exception);

    if (appError) {
      return {
        code: appError.code,
        message: appError.message,
      };
    }

    const rawMessage = this.readExceptionMessage(exception);
    const code = inferAppErrorCode(statusCode, rawMessage);

    return {
      code,
      message: appErrorMessages[code],
    };
  }

  private readExceptionMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return sanitizeAppErrorMessage(response);
      }

      if (response && typeof response === 'object') {
        const message = (response as { message?: unknown }).message;

        if (Array.isArray(message)) {
          return sanitizeAppErrorMessage(message.join(', '));
        }

        if (typeof message === 'string') {
          return sanitizeAppErrorMessage(message);
        }
      }
    }

    return exception instanceof Error ? sanitizeAppErrorMessage(exception.message) : '';
  }

  private readRequestId(request: HttpRequestLike): string | undefined {
    const headers = request.headers ?? {};
    const value = headers['x-request-id'] ?? headers['x-correlation-id'];

    if (Array.isArray(value)) {
      return value.find(Boolean);
    }

    return value || undefined;
  }
}
