import { BadRequestException, HttpException, ServiceUnavailableException } from '@nestjs/common';

export const appErrorCodes = [
  'LLM_UNAVAILABLE',
  'EMBEDDING_UNAVAILABLE',
  'RERANKER_UNAVAILABLE',
  'GRAPH_UNAVAILABLE',
  'UNSUPPORTED_FILE_TYPE',
] as const;

export type AppErrorCode = (typeof appErrorCodes)[number];

export interface AppErrorResponse {
  code: AppErrorCode;
  message: string;
}

export const appErrorMessages: Record<AppErrorCode, string> = {
  EMBEDDING_UNAVAILABLE: '向量模型不可用',
  GRAPH_UNAVAILABLE: '图谱服务未连接',
  LLM_UNAVAILABLE: '大模型服务不可用',
  RERANKER_UNAVAILABLE: '重排序服务不可用',
  UNSUPPORTED_FILE_TYPE: '文件格式暂不支持',
};

export const createAppErrorResponse = (
  code: AppErrorCode,
  message = appErrorMessages[code],
): AppErrorResponse => ({
  code,
  message,
});

export const createAppBadRequestException = (
  code: AppErrorCode,
  message?: string,
): BadRequestException => new BadRequestException(createAppErrorResponse(code, message));

export const createAppServiceUnavailableException = (
  code: AppErrorCode,
  message?: string,
): ServiceUnavailableException =>
  new ServiceUnavailableException(createAppErrorResponse(code, message));

export const getAppErrorResponse = (error: unknown): AppErrorResponse | null => {
  if (!(error instanceof HttpException)) {
    return null;
  }

  const response = error.getResponse();

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return null;
  }

  const candidate = response as Partial<AppErrorResponse>;

  return isAppErrorCode(candidate.code) && typeof candidate.message === 'string'
    ? {
        code: candidate.code,
        message: candidate.message,
      }
    : null;
};

export const toAppErrorMessage = (error: unknown, fallback: string): string => {
  const appError = getAppErrorResponse(error);

  if (appError) {
    return appError.message;
  }

  return error instanceof Error && error.message.trim() ? error.message : fallback;
};

const isAppErrorCode = (value: unknown): value is AppErrorCode =>
  typeof value === 'string' && appErrorCodes.includes(value as AppErrorCode);
