import { Inject, Injectable } from '@nestjs/common';
import { LLM_PROVIDER, type LlmProvider } from '../../chat/providers/llm.provider';
import {
  graphEntityCategories,
  graphRelationCategories,
  type ExtractedEntity,
  type ExtractedRelation,
  type GraphEntityCategory,
  type GraphProvider,
  type GraphRelationCategory,
} from '../knowledge-graph.types';

export const GRAPH_PROVIDER = Symbol('GRAPH_PROVIDER');
const graphEntityLimit = 18;
const graphRelationLimit = 30;
const graphMaxTokens = 4096;
const graphRequestTimeoutMs = 90000;
const graphRetryDelayMs = 1000;

@Injectable()
export class LlmGraphProvider implements GraphProvider {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
  ) {}

  async extractEntities(content: string): Promise<ExtractedEntity[]> {
    const response = await this.callGraphModel([
      {
        role: 'system',
        content: `Extract at most ${graphEntityLimit} salient enterprise knowledge entities. Use category values only from ${graphEntityCategories.join(', ')}. Return only a JSON array of {"name":"...","type":"...","category":"..."} objects.`,
      },
      {
        role: 'user',
        content,
      },
    ]);

    return this.parseArray(response)
      .map((value) => ({
        category: this.normalizeEntityCategory(value.category ?? value.type),
        name: String(value.name ?? '').trim(),
        type: String(value.type ?? 'UNKNOWN').trim() || 'UNKNOWN',
      }))
      .filter((entity) => entity.name.length > 0)
      .slice(0, graphEntityLimit);
  }

  async extractRelations(
    content: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelation[]> {
    const response = await this.callGraphModel([
      {
        role: 'system',
        content: `Extract at most ${graphRelationLimit} relations between provided entities. Use relationCategory values only from ${graphRelationCategories.join(', ')}. Evidence must be a short verbatim excerpt from the input. Return only a JSON array of {"subject":"...","predicate":"...","object":"...","relationCategory":"...","evidence":"..."} objects.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          content,
          entities: entities.slice(0, graphEntityLimit),
        }),
      },
    ]);

    return this.parseArray(response)
      .map((value) => ({
        evidence:
          String(value.evidence ?? '')
            .trim()
            .slice(0, 320) || undefined,
        subject: String(value.subject ?? '').trim(),
        predicate: String(value.predicate ?? '').trim(),
        object: String(value.object ?? '').trim(),
        relationCategory: this.normalizeRelationCategory(value.relationCategory ?? value.predicate),
      }))
      .filter(
        (relation) =>
          relation.subject.length > 0 &&
          relation.predicate.length > 0 &&
          relation.object.length > 0,
      )
      .slice(0, graphRelationLimit);
  }

  private async callGraphModel(messages: Parameters<LlmProvider['chat']>[0]): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.llmProvider.chat(messages, {
          maxTokens: graphMaxTokens,
          timeoutMs: graphRequestTimeoutMs,
        });
      } catch (error) {
        lastError = error;
        if (attempt === 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, graphRetryDelayMs));
        }
      }
    }

    throw lastError;
  }

  private normalizeEntityCategory(value: unknown): GraphEntityCategory {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();

    if (graphEntityCategories.includes(normalized as GraphEntityCategory)) {
      return normalized as GraphEntityCategory;
    }

    if (/(ORG|DEPARTMENT|TEAM|组织|部门)/i.test(normalized)) return 'ORGANIZATION';
    if (/(POSITION|JOB|岗位|职位)/i.test(normalized)) return 'POSITION';
    if (/(ROLE|PERSON|USER|角色|人员)/i.test(normalized)) return 'ROLE';
    if (/(PROCESS|WORKFLOW|流程|阶段)/i.test(normalized)) return 'PROCESS';
    if (/(BENEFIT|WELFARE|福利|薪资)/i.test(normalized)) return 'BENEFIT';
    if (/(POLICY|制度|政策|DOCUMENT)/i.test(normalized)) return 'POLICY';
    if (/(RULE|TERM|CLAUSE|规则|条款)/i.test(normalized)) return 'RULE';
    if (/(REQUIREMENT|MATERIAL|要求|材料|条件)/i.test(normalized)) return 'REQUIREMENT';
    if (/(DATA|CODE|AMOUNT|NUMBER|数据|编码|金额)/i.test(normalized)) return 'DATA';
    return 'OTHER';
  }

  private normalizeRelationCategory(value: unknown): GraphRelationCategory {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();

    if (graphRelationCategories.includes(normalized as GraphRelationCategory)) {
      return normalized as GraphRelationCategory;
    }

    if (/(负责|归属|属于|OWNER|BELONG|MANAGE)/i.test(normalized)) return 'OWNERSHIP';
    if (/(包含|组成|包括|CONTAIN|INCLUDE|PART)/i.test(normalized)) return 'CONTAINS';
    if (/(审批|审核|批准|APPROV|REVIEW)/i.test(normalized)) return 'APPROVAL';
    if (/(引用|依据|参考|CITE|REFERENCE)/i.test(normalized)) return 'REFERENCE';
    if (/(要求|需要|必须|REQUIRE|NEED|MUST)/i.test(normalized)) return 'REQUIREMENT';
    if (/(适用|面向|APPL|TARGET)/i.test(normalized)) return 'APPLIES_TO';
    if (/(之前|之后|先于|PRECEDE|FOLLOW)/i.test(normalized)) return 'PRECEDES';
    return 'RELATED';
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
