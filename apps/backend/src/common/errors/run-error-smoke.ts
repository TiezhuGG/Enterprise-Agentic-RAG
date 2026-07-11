import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  appErrorCodes,
  appErrorMessages,
  createAppBadRequestException,
  createAppErrorResponse,
  getAppErrorResponse,
  inferAppErrorCode,
  sanitizeAppErrorMessage,
} from './app-error-codes';
import { AppExceptionFilter } from './app-exception.filter';
import type { ArgumentsHost } from '@nestjs/common';
import type { AppErrorResponse } from './app-error-codes';

function main(): void {
  const missingMessages = appErrorCodes.filter((code) => !appErrorMessages[code]?.trim());

  if (missingMessages.length > 0) {
    throw new Error(`Missing app error messages: ${missingMessages.join(', ')}`);
  }

  const unsupportedError = createAppBadRequestException('UNSUPPORTED_FILE_TYPE');
  const unsupportedResponse = getAppErrorResponse(unsupportedError);

  if (
    !unsupportedResponse ||
    unsupportedResponse.code !== 'UNSUPPORTED_FILE_TYPE' ||
    unsupportedResponse.message !== '文件格式暂不支持'
  ) {
    throw new Error('Expected UNSUPPORTED_FILE_TYPE app error response');
  }

  assertEqual(
    inferAppErrorCode(404, 'Document not found'),
    'DOCUMENT_NOT_FOUND',
    'Document not found should map to DOCUMENT_NOT_FOUND',
  );
  assertEqual(
    inferAppErrorCode(503, 'Neo4j graph connection failed'),
    'GRAPH_UNAVAILABLE',
    'Graph failure should map to GRAPH_UNAVAILABLE',
  );
  assertEqual(
    inferAppErrorCode(401, 'Invalid email or password'),
    'INVALID_CREDENTIALS',
    'Invalid credentials should map to INVALID_CREDENTIALS',
  );

  const validationCode = inferAppErrorCode(
    new BadRequestException(['email must be an email']).getStatus(),
    'email must be an email',
  );

  assertEqual(validationCode, 'VALIDATION_ERROR', 'Validation error should map correctly');

  const notFoundCode = inferAppErrorCode(
    new NotFoundException('Pipeline job not found').getStatus(),
    'Pipeline job not found',
  );

  assertEqual(notFoundCode, 'PIPELINE_NOT_FOUND', 'Pipeline error should map correctly');

  const serviceUnavailableCode = inferAppErrorCode(
    new ServiceUnavailableException('Embedding provider failed').getStatus(),
    'Embedding provider failed',
  );

  assertEqual(
    serviceUnavailableCode,
    'EMBEDDING_UNAVAILABLE',
    'Embedding failure should map correctly',
  );

  const redacted = sanitizeAppErrorMessage(
    'Provider failed api_key=sk-secret Bearer eyJhbGciOiJIUzI1 password=Admin123!',
  );

  if (/sk-secret|eyJhbGciOiJIUzI1|Admin123/.test(redacted)) {
    throw new Error('Expected sensitive values to be redacted');
  }

  const standardResponse = createAppErrorResponse('LLM_UNAVAILABLE', undefined, {
    path: '/agent/chat/stream',
    requestId: 'smoke-request',
    statusCode: 503,
    timestamp: '2026-01-01T00:00:00.000Z',
  });

  if (!standardResponse.statusCode || !standardResponse.timestamp || !standardResponse.path) {
    throw new Error('Expected standard app error response metadata');
  }

  const filterResponse = runFilterSmoke(new NotFoundException('Document not found'));

  if (
    filterResponse.statusCode !== 404 ||
    filterResponse.body.code !== 'DOCUMENT_NOT_FOUND' ||
    filterResponse.body.path !== '/documents/missing' ||
    filterResponse.body.requestId !== 'error-smoke-request'
  ) {
    throw new Error('Expected AppExceptionFilter to standardize HTTP error response');
  }

  console.log(
    JSON.stringify(
      {
        checkedCodes: appErrorCodes.length,
        filter: {
          code: filterResponse.body.code,
          path: filterResponse.body.path,
          requestId: filterResponse.body.requestId,
          statusCode: filterResponse.statusCode,
        },
        sampleMessages: {
          graph: appErrorMessages.GRAPH_UNAVAILABLE,
          llm: appErrorMessages.LLM_UNAVAILABLE,
          unsupported: unsupportedResponse.message,
        },
        status: 'ok',
      },
      null,
      2,
    ),
  );
}

function runFilterSmoke(exception: unknown): {
  body: AppErrorResponse;
  statusCode: number;
} {
  let body: AppErrorResponse | null = null;
  let statusCode = 0;
  const response = {
    json: (value: AppErrorResponse) => {
      body = value;
    },
    status: (value: number) => {
      statusCode = value;

      return response;
    },
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-request-id': 'error-smoke-request',
        },
        url: '/documents/missing',
      }),
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  new AppExceptionFilter().catch(exception, host);

  if (!body) {
    throw new Error('AppExceptionFilter did not write response body');
  }

  return {
    body,
    statusCode,
  };
}

function assertEqual<TValue>(actual: TValue, expected: TValue, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, received ${String(actual)}`);
  }
}

main();
