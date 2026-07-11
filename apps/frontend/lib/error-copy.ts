export const appErrorMessages = {
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
} as const;

export type AppErrorCode = keyof typeof appErrorMessages;

export const isAppErrorCode = (value: unknown): value is AppErrorCode =>
  typeof value === 'string' && value in appErrorMessages;

export const getAppErrorMessage = (code: unknown): string | undefined =>
  isAppErrorCode(code) ? appErrorMessages[code] : undefined;

export const toUserFacingErrorMessage = (
  error: unknown,
  fallback = '操作失败，请稍后重试。',
): string => {
  const code = readErrorCode(error);
  const codeMessage = getAppErrorMessage(code);

  if (codeMessage) {
    return codeMessage;
  }

  const message = readErrorMessage(error);
  const inferredMessage = inferMessageFromText(message);

  if (inferredMessage) {
    return inferredMessage;
  }

  return toShortSafeMessage(message) || fallback;
};

export const toShortSafeMessage = (message: string): string =>
  message
    .replace(/\s+/g, ' ')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/(api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^,\s]+/gi, '$1=[redacted]')
    .slice(0, 180)
    .trim();

export const readErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;

  return typeof code === 'string' ? code : undefined;
};

export const readErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return '';
};

const inferMessageFromText = (message: string): string | undefined => {
  const normalized = message.toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (/unsupported|file type|文件格式/.test(normalized)) {
    return appErrorMessages.UNSUPPORTED_FILE_TYPE;
  }

  if (/credential|email or password|invalid email|password|邮箱|密码/.test(normalized)) {
    return appErrorMessages.INVALID_CREDENTIALS;
  }

  if (/unauthorized|authentication|required|登录|认证/.test(normalized)) {
    return appErrorMessages.AUTH_REQUIRED;
  }

  if (/forbidden|denied|permission|无权|权限/.test(normalized)) {
    return appErrorMessages.FORBIDDEN;
  }

  if (/embedding|vector|向量/.test(normalized)) {
    return appErrorMessages.EMBEDDING_UNAVAILABLE;
  }

  if (/rerank|重排序|重排/.test(normalized)) {
    return appErrorMessages.RERANKER_UNAVAILABLE;
  }

  if (/graph|neo4j|图谱/.test(normalized)) {
    return appErrorMessages.GRAPH_UNAVAILABLE;
  }

  if (/llm|model|chat completion|大模型/.test(normalized)) {
    return appErrorMessages.LLM_UNAVAILABLE;
  }

  if (/search|elastic|索引/.test(normalized)) {
    return appErrorMessages.SEARCH_UNAVAILABLE;
  }

  if (/storage|minio|bucket|object|对象存储/.test(normalized)) {
    return appErrorMessages.STORAGE_UNAVAILABLE;
  }

  if (/not found|不存在/.test(normalized)) {
    return appErrorMessages.NOT_FOUND;
  }

  return undefined;
};
