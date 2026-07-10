import { Injectable } from '@nestjs/common';
import {
  rrfRankConstant,
  type RetrievalResult,
  type RetrievalSource,
  type RetrieverResult,
} from '../retrieval.types';

interface AccumulatedResult extends RetrievalResult {
  bestSourceScore: number;
}

@Injectable()
export class RrfFusion {
  fuse(resultSets: RetrieverResult[][], limit: number): RetrievalResult[] {
    const accumulatedResults = new Map<string, AccumulatedResult>();

    for (const resultSet of resultSets) {
      resultSet.forEach((result, index) => {
        const rank = index + 1;
        const score = 1 / (rrfRankConstant + rank);
        const existingResult = accumulatedResults.get(result.chunkId);

        if (existingResult) {
          existingResult.score += score;
          existingResult.bestSourceScore = Math.max(existingResult.bestSourceScore, result.score);
          existingResult.metadata = this.mergeSourceMetadata(
            existingResult.metadata,
            result.source,
          );
          return;
        }

        accumulatedResults.set(result.chunkId, {
          chunkId: result.chunkId,
          documentId: result.documentId,
          content: result.content,
          score,
          metadata: this.mergeSourceMetadata(result.metadata, result.source),
          bestSourceScore: result.score,
        });
      });
    }

    return [...accumulatedResults.values()]
      .sort((left, right) => {
        const scoreDelta = right.score - left.score;

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return right.bestSourceScore - left.bestSourceScore;
      })
      .slice(0, limit)
      .map((result) => ({
        chunkId: result.chunkId,
        documentId: result.documentId,
        content: result.content,
        score: result.score,
        metadata: result.metadata,
      }));
  }

  private mergeSourceMetadata(
    metadata: RetrieverResult['metadata'],
    source: RetrievalSource,
  ): RetrieverResult['metadata'] {
    const existingSources = Array.isArray(metadata.retrievalSources)
      ? metadata.retrievalSources.filter((value): value is RetrievalSource =>
          ['vector', 'keyword', 'graph'].includes(String(value)),
        )
      : [];
    const retrievalSources = [...new Set([...existingSources, source])];

    return {
      ...metadata,
      retrievalSource: retrievalSources.includes('graph')
        ? 'graph'
        : retrievalSources.length > 1
          ? 'hybrid'
          : retrievalSources[0],
      retrievalSources,
    };
  }
}
