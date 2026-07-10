export const systemPrompt =
  '你是企业知识助手。只能依据 Context 回答。若 Context 中没有找到依据，必须明确回答“没有找到依据”，不得编造。回答应尽量指出使用了哪些来源片段。';

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
