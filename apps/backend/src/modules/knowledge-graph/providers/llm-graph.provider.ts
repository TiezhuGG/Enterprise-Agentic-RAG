import { Inject, Injectable } from '@nestjs/common';
import { LLM_PROVIDER, type LlmProvider } from '../../chat/providers/llm.provider';
import type { ExtractedEntity, ExtractedRelation, GraphProvider } from '../knowledge-graph.types';

export const GRAPH_PROVIDER = Symbol('GRAPH_PROVIDER');

@Injectable()
export class LlmGraphProvider implements GraphProvider {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
  ) {}

  async extractEntities(content: string): Promise<ExtractedEntity[]> {
    const response = await this.llmProvider.chat([
      {
        role: 'system',
        content:
          'Extract knowledge graph entities from the input. Return only a JSON array of {"name":"...","type":"..."} objects.',
      },
      {
        role: 'user',
        content,
      },
    ]);

    return this.parseArray(response)
      .map((value) => ({
        name: String(value.name ?? '').trim(),
        type: String(value.type ?? 'UNKNOWN').trim() || 'UNKNOWN',
      }))
      .filter((entity) => entity.name.length > 0);
  }

  async extractRelations(
    content: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelation[]> {
    const response = await this.llmProvider.chat([
      {
        role: 'system',
        content:
          'Extract relations between provided entities. Return only a JSON array of {"subject":"...","predicate":"...","object":"..."} objects.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          content,
          entities,
        }),
      },
    ]);

    return this.parseArray(response)
      .map((value) => ({
        subject: String(value.subject ?? '').trim(),
        predicate: String(value.predicate ?? '').trim(),
        object: String(value.object ?? '').trim(),
      }))
      .filter(
        (relation) =>
          relation.subject.length > 0 &&
          relation.predicate.length > 0 &&
          relation.object.length > 0,
      );
  }

  private parseArray(content: string): Array<Record<string, unknown>> {
    const cleanedContent = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const start = cleanedContent.indexOf('[');
    const end = cleanedContent.lastIndexOf(']');

    if (start === -1 || end === -1 || end < start) {
      return [];
    }

    const parsed = JSON.parse(cleanedContent.slice(start, end + 1)) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Record<string, unknown> =>
            item !== null && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
  }
}
