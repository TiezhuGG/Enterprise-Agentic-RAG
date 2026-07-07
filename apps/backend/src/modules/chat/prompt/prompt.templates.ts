export const systemPrompt = '你是企业知识助手。只能依据Context回答。';

export const buildUserPrompt = (question: string, context: string): string => `Question:
${question}

Context:
${context}`;
