import {
  toShortSafeMessage,
  toUserFacingErrorMessage as toStandardUserFacingErrorMessage,
} from '@/lib/error-copy';
import type {
  DocumentStatus,
  IngestionState,
  PipelineEvent,
  PipelineEventStatus,
  PipelineJobStatus,
} from '@/types/workbench';

export const documentStatusLabels: Record<DocumentStatus, string> = {
  ARCHIVED: '已归档',
  CREATED: '待解析',
  FAILED: '解析失败',
  PROCESSING: '解析中',
  READY: '可检索',
};

export const documentStatusDescriptions: Record<DocumentStatus, string> = {
  ARCHIVED: '文档已归档，不参与检索。',
  CREATED: '文档已创建，等待上传或入库处理。',
  FAILED: '文档处理失败，请查看入库失败阶段。',
  PROCESSING: '文档已上传，等待或正在解析入库。',
  READY: '文档已完成处理，可以进入搜索和问答。',
};

export const ingestionStateLabels: Record<IngestionState['status'], string> = {
  error: '处理失败',
  idle: '等待操作',
  queued: '排队中',
  running: '处理中',
  success: '处理完成',
};

export const pipelineJobStatusLabels: Record<PipelineJobStatus, string> = {
  CANCELED: '已取消',
  FAILED: '失败',
  QUEUED: '排队中',
  RUNNING: '运行中',
  SUCCEEDED: '成功',
};

export const pipelineEventStatusLabels: Record<PipelineEventStatus, string> = {
  FAILED: '失败',
  SKIPPED: '跳过',
  STARTED: '开始',
  SUCCEEDED: '成功',
};

const pipelineStageLabels: Record<string, string> = {
  chunking: '语义分块与索引',
  done: '完成入库',
  embedding: '向量生成',
  'document-processing': '解析与清洗',
  'graph-extraction': '图谱抽取',
  'search-indexing': '搜索索引',
  validate: '文件校验',
};

const pipelineStageDescriptions: Record<string, string> = {
  chunking: '生成可检索片段，并同步关键词索引。',
  done: '确认内容、分块、向量和索引均满足检索要求。',
  embedding: '调用向量模型并写入向量索引。',
  'document-processing': '读取对象存储文件，解析为 Markdown，并进行内容清洗。',
  'graph-extraction': '可选抽取实体与关系，写入图谱存储。',
  'search-indexing': '将分块写入搜索索引，供关键词检索使用。',
  validate: '确认文档状态、类型和对象存储位置可用于处理。',
};

export const getPipelineStageLabel = (stage: string): string => pipelineStageLabels[stage] ?? stage;

export const getPipelineStageDescription = (stage: string): string =>
  pipelineStageDescriptions[stage] ?? '执行入库流水线阶段。';

export const toUserFacingErrorMessage = (
  error: unknown,
  fallback = '操作失败，请稍后重试。',
): string => toStandardUserFacingErrorMessage(error, fallback);

export const getPipelineEventErrorMessage = (event: PipelineEvent): string => {
  const rawMessage = event.errorMessage ?? '';
  const normalized = rawMessage.toLowerCase();

  if (event.stage === 'embedding') {
    return /unavailable|不可用/.test(normalized) ? '向量模型不可用' : '向量生成失败';
  }

  if (event.stage === 'graph-extraction') {
    return /unavailable|未连接/.test(normalized) ? '图谱服务未连接' : '图谱抽取失败';
  }

  if (event.stage === 'chunking' && /search|index|elastic|索引/.test(normalized)) {
    return '搜索索引失败';
  }

  if (event.stage === 'search-indexing') {
    return '搜索索引失败';
  }

  if (event.stage === 'document-processing') {
    return '文档解析失败';
  }

  if (event.stage === 'validate') {
    return '文件校验失败';
  }

  return toUserFacingErrorMessage(rawMessage, '流水线处理失败');
};

export const getPipelineEventErrorDetail = (event: PipelineEvent): string => {
  const rawMessage = toShortSafeMessage(event.errorMessage ?? '');
  const friendlyMessage = getPipelineEventErrorMessage(event);

  return rawMessage && rawMessage !== friendlyMessage ? rawMessage : '';
};
