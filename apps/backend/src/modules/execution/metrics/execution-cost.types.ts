export interface ExecutionAnswerMetrics {
  currency: string;
  estimatedCost: number;
  llmModel: string;
  outputTokens: number;
  promptTokens: number;
  totalTokens: number;
}
