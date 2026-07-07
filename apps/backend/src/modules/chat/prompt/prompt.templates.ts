export const systemPrompt = '企业知识助手。只能依据Context回答。';

export interface UserPromptInput {
  history: string;
  context: string;
  question: string;
}

export const buildUserPrompt = (input: UserPromptInput): string => `History:
${input.history}

Context:
${input.context}

Question:
${input.question}`;
