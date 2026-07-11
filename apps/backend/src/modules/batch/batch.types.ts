export type BatchOperation = 'archive' | 'ingest' | 'taxonomy';

export type BatchItemStatus = 'success' | 'failed';

export interface BatchOperationItem<TData = unknown> {
  data?: TData;
  documentId: string;
  errorMessage?: string;
  status: BatchItemStatus;
}

export interface BatchOperationResponse<TData = unknown> {
  failed: number;
  operation: BatchOperation;
  results: Array<BatchOperationItem<TData>>;
  succeeded: number;
  total: number;
}
