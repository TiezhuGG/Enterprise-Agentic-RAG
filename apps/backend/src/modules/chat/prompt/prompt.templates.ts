export const systemPrompt = '企业知识助手。只能依据Context回答。';

export interface UserPromptInput {
  historyContext: string;
  knowledgeContext: string;
  memoryContext: string;
  multimodalContext: string;
  question: string;
  summary: string;
}

export const buildUserPrompt = (input: UserPromptInput): string => `Memory Context:
${input.memoryContext}

Summary:
${input.summary}

History:
${input.historyContext}

Multimodal Context:
${input.multimodalContext}

Knowledge Context:
${input.knowledgeContext}

Question:
${input.question}`;
