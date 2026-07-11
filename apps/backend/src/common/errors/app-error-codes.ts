import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

export const appErrorCodes = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'AUTH_REQUIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL_ERROR',
  'DATABASE_UNAVAILABLE',
  'REDIS_UNAVAILABLE',
  'STORAGE_UNAVAILABLE',
  'VECTOR_UNAVAILABLE',
  'SEARCH_UNAVAILABLE',
  'GRAPH_UNAVAILABLE',
  'LLM_UNAVAILABLE',
  'EMBEDDING_UNAVAILABLE',
  'RERANKER_UNAVAILABLE',
  'OCR_UNAVAILABLE',
  'ASR_UNAVAILABLE',
  'VIDEO_UNAVAILABLE',
  'UNSUPPORTED_FILE_TYPE',
  'INGESTION_FAILED',
  'DOCUMENT_NOT_FOUND',
  'SPACE_NOT_FOUND',
  'CONVERSATION_NOT_FOUND',
  'EXECUTION_NOT_FOUND',
  'PIPELINE_NOT_FOUND',
] as const;

export type AppErrorCode = (typeof appErrorCodes)[number];

export interface AppErrorResponse {
  code: AppErrorCode;
  message: string;
  path?: string;
  requestId?: string;
  statusCode?: number;
  timestamp?: string;
}

export const appErrorMessages: Record<AppErrorCode, string> = {
  ASR_UNAVAILABLE: '语音转写服务不可用',
  AUTH_REQUIRED: '登录已失效，请重新登录',
  BAD_REQUEST: '请求参数不正确，请检查输入',
  CONFLICT: '当前操作与已有数据冲突',
  CONVERSATION_NOT_FOUND: '会话不存在或无权访问',
  DATABASE_UNAVAILABLE: '数据库服务不可用',
  DOCUMENT_NOT_FOUND: '文档不存在或无权访问',
  EMBEDDING_UNAVAILABLE: '向量模型不可用',
  EXECUTION_NOT_FOUND: '执行记录不存在或无权访问',
  FORBIDDEN: '没有权限执行此操作',
  GRAPH_UNAVAILABLE: '图谱服务未连接',
  INGESTION_FAILED: '文档入库处理失败',
  INTERNAL_ERROR: '系统暂时不可用，请稍后重试',
  INVALID_CREDENTIALS: '邮箱或密码不正确',
  LLM_UNAVAILABLE: '大模型服务不可用',
  NOT_FOUND: '请求的资源不存在',
  OCR_UNAVAILABLE: '图像识别服务不可用',
  PIPELINE_NOT_FOUND: '流水线任务不存在或无权访问',
  REDIS_UNAVAILABLE: '缓存服务不可用',
  RERANKER_UNAVAILABLE: '重排序服务不可用',
  SEARCH_UNAVAILABLE: '搜索服务不可用',
  SPACE_NOT_FOUND: '知识空间不存在或无权访问',
  STORAGE_UNAVAILABLE: '对象存储服务不可用',
  UNSUPPORTED_FILE_TYPE: '文件格式暂不支持',
  VALIDATION_ERROR: '请求参数不正确，请检查输入',
  VECTOR_UNAVAILABLE: '向量检索服务不可用',
  VIDEO_UNAVAILABLE: '视频理解服务不可用',
};

export const createAppErrorResponse = (
  code: AppErrorCode,
  message = appErrorMessages[code],
  options: {
    path?: string;
    requestId?: string;
    statusCode?: number;
    timestamp?: string;
  } = {},
): AppErrorResponse => ({
  code,
  message: sanitizeAppErrorMessage(message || appErrorMessages[code]),
  ...options,
});

export const createAppBadRequestException = (
  code: AppErrorCode,
  message?: string,
): BadRequestException => new BadRequestException(createAppErrorResponse(code, message));

export const createAppConflictException = (
  code: AppErrorCode,
  message?: string,
): ConflictException => new ConflictException(createAppErrorResponse(code, message));

export const createAppForbiddenException = (
  code: AppErrorCode,
  message?: string,
): ForbiddenException => new ForbiddenException(createAppErrorResponse(code, message));

export const createAppInternalServerErrorException = (
  code: AppErrorCode,
  message?: string,
): InternalServerErrorException =>
  new InternalServerErrorException(createAppErrorResponse(code, message));

export const createAppNotFoundException = (
  code: AppErrorCode,
  message?: string,
): NotFoundException => new NotFoundException(createAppErrorResponse(code, message));

export const createAppServiceUnavailableException = (
  code: AppErrorCode,
  message?: string,
): ServiceUnavailableException =>
  new ServiceUnavailableException(createAppErrorResponse(code, message));

export const createAppUnauthorizedException = (
  code: AppErrorCode,
  message?: string,
): UnauthorizedException => new UnauthorizedException(createAppErrorResponse(code, message));

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
        message: sanitizeAppErrorMessage(candidate.message),
        path: typeof candidate.path === 'string' ? candidate.path : undefined,
        requestId: typeof candidate.requestId === 'string' ? candidate.requestId : undefined,
        statusCode: typeof candidate.statusCode === 'number' ? candidate.statusCode : undefined,
        timestamp: typeof candidate.timestamp === 'string' ? candidate.timestamp : undefined,
      }
    : null;
};

export const inferAppErrorCode = (statusCode: number, message = ''): AppErrorCode => {
  const normalized = message.toLowerCase();

  if (/unsupported|file type|文件格式/.test(normalized)) {
    return 'UNSUPPORTED_FILE_TYPE';
  }

  if (/credential|email or password|invalid email|password|邮箱|密码/.test(normalized)) {
    return statusCode === 401 ? 'INVALID_CREDENTIALS' : 'BAD_REQUEST';
  }

  if (/document/.test(normalized)) {
    return statusCode === 404 ? 'DOCUMENT_NOT_FOUND' : 'BAD_REQUEST';
  }

  if (/knowledge space|space/.test(normalized)) {
    return statusCode === 404 ? 'SPACE_NOT_FOUND' : 'BAD_REQUEST';
  }

  if (/conversation/.test(normalized)) {
    return statusCode === 404 ? 'CONVERSATION_NOT_FOUND' : 'BAD_REQUEST';
  }

  if (/execution/.test(normalized)) {
    return statusCode === 404 ? 'EXECUTION_NOT_FOUND' : 'BAD_REQUEST';
  }

  if (/pipeline/.test(normalized)) {
    return statusCode === 404 ? 'PIPELINE_NOT_FOUND' : 'BAD_REQUEST';
  }

  if (/llm|chat completion|model/.test(normalized)) {
    return 'LLM_UNAVAILABLE';
  }

  if (/embedding|vector/.test(normalized)) {
    return 'EMBEDDING_UNAVAILABLE';
  }

  if (/rerank/.test(normalized)) {
    return 'RERANKER_UNAVAILABLE';
  }

  if (/neo4j|graph/.test(normalized)) {
    return 'GRAPH_UNAVAILABLE';
  }

  if (/elastic|search/.test(normalized)) {
    return 'SEARCH_UNAVAILABLE';
  }

  if (/storage|minio|bucket|object/.test(normalized)) {
    return 'STORAGE_UNAVAILABLE';
  }

  if (/redis|cache/.test(normalized)) {
    return 'REDIS_UNAVAILABLE';
  }

  if (/database|prisma|postgres|pgvector/.test(normalized)) {
    return 'DATABASE_UNAVAILABLE';
  }

  switch (statusCode) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTH_REQUIRED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  }
};

export const isAppErrorCode = (value: unknown): value is AppErrorCode =>
  typeof value === 'string' && appErrorCodes.includes(value as AppErrorCode);

export const sanitizeAppErrorMessage = (message: string): string =>
  message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/(api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^,\s]+/gi, '$1=[redacted]')
    .replace(/\s+/g, ' ')
    .slice(0, 220)
    .trim();

export const toAppErrorMessage = (error: unknown, fallback: string): string => {
  const appError = getAppErrorResponse(error);

  if (appError) {
    return appError.message;
  }

  return error instanceof Error && error.message.trim()
    ? sanitizeAppErrorMessage(error.message)
    : fallback;
};
