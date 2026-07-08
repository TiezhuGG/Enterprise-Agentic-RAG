import { Injectable } from '@nestjs/common';
import {
  MAX_CONTEXT_TOKENS,
  type ContextChunk,
  retrievalPermissions,
  type KnowledgeRequestContext,
  type RetrievalAccessContext,
  type RetrievalResult,
} from '../retrieval.types';

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];
const tokenPattern =
  /(\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}|[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*|[^\sA-Za-z0-9])\s*/gu;

@Injectable()
export class ContextBuilder {
  build(context: KnowledgeRequestContext): RetrievalAccessContext {
    const roles = unique(context.roles);
    const permissions = unique(context.permissions);
    const spaceIds = unique(context.spaceIds);
    const hasRetrievalPermission = permissions.some((permission) =>
      retrievalPermissions.includes(permission as (typeof retrievalPermissions)[number]),
    );

    return {
      userId: context.userId,
      roles,
      permissions,
      spaceIds,
      canRetrieve: roles.length > 0 && hasRetrievalPermission && spaceIds.length > 0,
      metadata: context.metadata,
    };
  }

  buildContextChunks(results: RetrievalResult[], tokenBudget = MAX_CONTEXT_TOKENS): ContextChunk[] {
    const sortedResults = [...results].sort((left, right) => right.score - left.score);
    const contextChunks: ContextChunk[] = [];
    let usedTokens = 0;

    for (const result of sortedResults) {
      const tokenCount = this.countTokens(result.content);

      if (usedTokens + tokenCount > tokenBudget) {
        break;
      }

      contextChunks.push({
        chunkId: result.chunkId,
        documentId: result.documentId,
        content: result.content,
        score: result.score,
        metadata: result.metadata,
      });
      usedTokens += tokenCount;
    }

    return contextChunks;
  }

  private countTokens(content: string): number {
    return Array.from(content.matchAll(tokenPattern)).length;
  }
}
