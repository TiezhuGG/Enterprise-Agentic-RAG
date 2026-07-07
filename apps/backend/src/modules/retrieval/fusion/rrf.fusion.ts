import { Injectable } from '@nestjs/common';
import { rrfRankConstant, type RetrievalResult, type RetrieverResult } from '../retrieval.types';

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
          return;
        }

        accumulatedResults.set(result.chunkId, {
          chunkId: result.chunkId,
          documentId: result.documentId,
          content: result.content,
          score,
          metadata: result.metadata,
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
}
