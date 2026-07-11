'use client';

import { FormEvent } from 'react';
import { FileText, Gauge, History, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSearchStore } from '@/store/search.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import type {
  RetrievalPipelineBreakdown,
  RetrievalStageBreakdown,
  SearchHistoryItem,
  SearchMode,
  SearchResultItem,
  SearchSort,
} from '@/types/search';
import type { DocumentType } from '@/types/workbench';

interface SearchCenterProps {
  title?: string;
}

const searchModeLabels: Record<SearchMode, string> = {
  fulltext: '全文',
  hybrid: '混合',
  semantic: '语义',
};

const searchModeDescriptions: Record<SearchMode, string> = {
  fulltext: '基于 Elasticsearch BM25 的关键词命中。',
  hybrid: '合并全文、语义、图谱和重排序结果。',
  semantic: '基于 PGVector 的向量相似度召回。',
};

const sortLabels: Record<SearchSort, string> = {
  relevance: '相关度',
  updatedAt: '更新时间',
};

const documentTypeOptions: Array<{ label: string; value: DocumentType | 'ALL' }> = [
  { label: '全部类型', value: 'ALL' },
  { label: 'PDF', value: 'PDF' },
  { label: 'Word', value: 'WORD' },
  { label: 'TXT', value: 'TXT' },
  { label: 'Markdown', value: 'MARKDOWN' },
  { label: '图片', value: 'IMAGE' },
  { label: '音频', value: 'AUDIO' },
  { label: '视频', value: 'VIDEO' },
];

const stageLabels: Record<string, string> = {
  'context-builder': '上下文裁剪',
  graph: '图谱召回',
  keyword: '全文召回',
  'permission-filter': '权限过滤',
  reranker: '重排序',
  rrf: 'RRF 融合',
  vector: '向量召回',
};

export function SearchCenter({ title = '搜索中心' }: SearchCenterProps) {
  const {
    categoryId,
    documentType,
    error,
    history,
    limit,
    loading,
    mode,
    nextPage,
    offset,
    previousPage,
    query,
    response,
    search,
    setCategoryId,
    setDocumentType,
    setLimit,
    setMode,
    setQuery,
    setSort,
    setTagId,
    sort,
    tagId,
    useHistoryItem: applyHistoryItem,
  } = useSearchStore();
  const authToken = useWorkbenchStore((state) => state.authToken);
  const categories = useWorkbenchStore((state) => state.categories);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaces = useWorkbenchStore((state) => state.spaces);
  const tags = useWorkbenchStore((state) => state.tags);
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const canSearch = Boolean(authToken && selectedSpaceId && query.trim() && !loading);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (canSearch) {
      void search({ offset: 0 });
    }
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    applyHistoryItem(item);
  };

  return (
    <div className="search-center">
      <div className="search-center__header">
        <div>
          <h2>{title}</h2>
          <span>独立检索文档片段，先看来源，再决定是否进入 AI 总结。</span>
        </div>
        <Badge variant={selectedSpace ? 'success' : 'warning'}>
          {selectedSpace ? selectedSpace.name : '请选择知识空间'}
        </Badge>
      </div>

      {error ? <div className="workbench-error">{error}</div> : null}

      <Card>
        <CardContent className="pt-5">
          <form className="search-center__form" onSubmit={handleSubmit}>
            <div className="search-center__query-row">
              <div className="search-center__query-input">
                <Search className="search-center__query-icon" />
                <Input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入关键词、制度名称或业务问题"
                  value={query}
                />
              </div>
              <Button disabled={!canSearch} type="submit">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                搜索
              </Button>
            </div>

            <div className="search-center__filters">
              <label className="search-center__field">
                <span>分类</span>
                <select onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
                  <option value="">全部分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-center__field">
                <span>标签</span>
                <select onChange={(event) => setTagId(event.target.value)} value={tagId}>
                  <option value="">全部标签</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>

              <SegmentedControl<SearchMode>
                label="模式"
                onChange={setMode}
                options={[
                  { label: '混合', value: 'hybrid' },
                  { label: '全文', value: 'fulltext' },
                  { label: '语义', value: 'semantic' },
                ]}
                value={mode}
              />

              <label className="search-center__field">
                <span>文档类型</span>
                <select
                  onChange={(event) => setDocumentType(event.target.value as DocumentType | 'ALL')}
                  value={documentType}
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="search-center__field">
                <span>排序</span>
                <select
                  onChange={(event) => setSort(event.target.value as SearchSort)}
                  value={sort}
                >
                  <option value="relevance">{sortLabels.relevance}</option>
                  <option value="updatedAt">{sortLabels.updatedAt}</option>
                </select>
              </label>

              <label className="search-center__field">
                <span>数量</span>
                <select
                  onChange={(event) => setLimit(Number(event.target.value))}
                  value={String(limit)}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>
            </div>

            <p className="search-center__hint">{searchModeDescriptions[mode]}</p>
          </form>
        </CardContent>
      </Card>

      {!authToken ? (
        <SearchEmptyState
          description="登录后才能根据当前用户的租户、空间和权限执行搜索。"
          title="请先登录"
        />
      ) : null}

      {authToken && !selectedSpaceId ? (
        <SearchEmptyState
          description="选择知识空间后，搜索会自动带上 spaceId 过滤，避免跨空间展示结果。"
          title="请选择知识空间"
        />
      ) : null}

      <div className="search-center__grid">
        <div className="search-center__results">
          <Card>
            <CardHeader className="search-center__section-header">
              <div>
                <CardTitle>搜索结果</CardTitle>
                <CardDescription>
                  {response
                    ? `${response.results.length} 条结果，候选总数 ${response.total}`
                    : '等待执行搜索'}
                </CardDescription>
              </div>
              {response ? <Badge variant="info">{searchModeLabels[response.mode]}</Badge> : null}
            </CardHeader>
            <CardContent>
              <SearchResultList loading={loading} query={query} results={response?.results ?? []} />
              {response ? (
                <div className="search-center__pagination">
                  <Button
                    disabled={loading || offset === 0}
                    onClick={() => void previousPage()}
                    type="button"
                    variant="outline"
                  >
                    上一页
                  </Button>
                  <span>
                    {offset + 1}-{offset + (response.results.length || 0)}
                  </span>
                  <Button
                    disabled={loading || response.results.length < limit}
                    onClick={() => void nextPage()}
                    type="button"
                    variant="outline"
                  >
                    下一页
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="search-center__side">
          <SearchBreakdownPanel breakdown={response?.breakdown ?? null} loading={loading} />
          <SearchHistoryPanel
            history={history}
            onSelect={handleHistoryClick}
            selectedSpaceId={selectedSpaceId}
          />
        </div>
      </div>
    </div>
  );
}

interface SegmentedControlProps<TValue extends string> {
  label: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
}

function SegmentedControl<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<TValue>) {
  return (
    <div className="search-center__segmented" aria-label={label}>
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SearchResultList({
  loading,
  query,
  results,
}: {
  loading: boolean;
  query: string;
  results: SearchResultItem[];
}) {
  if (loading && results.length === 0) {
    return (
      <div className="search-center__loading">
        <Loader2 className="animate-spin" />
        <span>正在检索知识库...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <SearchEmptyState
        description="可尝试更换关键词，或确认文档已完成入库并处于可检索状态。"
        title="暂无搜索结果"
      />
    );
  }

  return (
    <div className="search-center__result-list">
      {results.map((result) => (
        <SearchResultCard key={result.chunkId} query={query} result={result} />
      ))}
    </div>
  );
}

function SearchResultCard({ query, result }: { query: string; result: SearchResultItem }) {
  const sectionTitle =
    typeof result.metadata.sectionTitle === 'string' ? result.metadata.sectionTitle : '未命名片段';
  const documentType =
    result.document?.type ??
    (typeof result.metadata.documentType === 'string' ? result.metadata.documentType : 'UNKNOWN');

  return (
    <article className="search-result-card">
      <header>
        <div>
          <strong>{result.document?.title ?? result.documentId}</strong>
          <span>
            {documentType} · {sectionTitle}
          </span>
        </div>
        <Badge variant="secondary">相关度 {formatScore(result.score)}</Badge>
      </header>

      <p className="search-result-card__content">
        <HighlightedText query={query} text={toSnippet(result.content)} />
      </p>

      <footer>
        <span>
          {result.document ? formatDateTime(result.document.updatedAt) : '来源文档未加载'}
        </span>
        <span>{formatMetadataSummary(result.metadata)}</span>
      </footer>
    </article>
  );
}

function SearchBreakdownPanel({
  breakdown,
  loading,
}: {
  breakdown: RetrievalPipelineBreakdown | null;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="search-center__icon-title">
          <Gauge />
          检索分解
        </CardTitle>
        <CardDescription>
          {breakdown
            ? `${breakdown.totalDurationMs}ms · ${breakdown.contextCount} 个上下文`
            : '暂无执行数据'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !breakdown ? (
          <div className="search-center__loading search-center__loading--compact">
            <Loader2 className="animate-spin" />
            <span>等待返回检索过程</span>
          </div>
        ) : null}
        {breakdown ? (
          <div className="search-breakdown">
            <div className="search-breakdown__stats">
              <Metric label="向量召回" value={breakdown.vectorCount} />
              <Metric label="全文召回" value={breakdown.keywordCount} />
              <Metric label="图谱召回" value={breakdown.graphCount} />
              <Metric label="重排序" value={breakdown.rerankedCount} />
            </div>
            <div className="search-breakdown__stages">
              {breakdown.stages.map((stage) => (
                <StageRow key={stage.stage} stage={stage} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SearchHistoryPanel({
  history,
  onSelect,
  selectedSpaceId,
}: {
  history: SearchHistoryItem[];
  onSelect: (item: SearchHistoryItem) => void;
  selectedSpaceId: string | null;
}) {
  const visibleHistory = selectedSpaceId
    ? history.filter((item) => !item.spaceId || item.spaceId === selectedSpaceId)
    : history;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="search-center__icon-title">
          <History />
          搜索历史
        </CardTitle>
        <CardDescription>最近 10 次查询</CardDescription>
      </CardHeader>
      <CardContent className="search-history">
        {visibleHistory.length === 0 ? (
          <SearchEmptyState description="搜索完成后会记录在这里。" title="暂无历史" />
        ) : (
          visibleHistory.map((item) => (
            <button key={item.id} onClick={() => onSelect(item)} type="button">
              <strong>{item.query}</strong>
              <span>
                {searchModeLabels[item.mode]} · {item.resultCount} 条 ·{' '}
                {formatDateTime(item.createdAt)}
              </span>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SearchEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="search-empty-state">
      <FileText />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StageRow({ stage }: { stage: RetrievalStageBreakdown }) {
  return (
    <div className={`search-stage search-stage--${stage.status}`}>
      <div>
        <strong>{stageLabels[stage.stage] ?? stage.stage}</strong>
        <span>{stage.reason ?? stage.status}</span>
      </div>
      <span>
        {stage.outputCount} · {stage.durationMs}ms
      </span>
    </div>
  );
}

function HighlightedText({ query, text }: { query: string; text: string }) {
  const keyword = query.trim();

  if (!keyword) {
    return <>{text}</>;
  }

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index < 0) {
    return <>{text}</>;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + keyword.length)}</mark>
      {text.slice(index + keyword.length)}
    </>
  );
}

const toSnippet = (content: string): string => {
  const normalized = content.replace(/\s+/g, ' ').trim();

  return normalized.length > 520 ? `${normalized.slice(0, 520)}...` : normalized;
};

const formatScore = (score: number): string => score.toFixed(score >= 10 ? 1 : 3);

const formatDateTime = (value: string): string => new Date(value).toLocaleString();

const formatMetadataSummary = (metadata: Record<string, unknown>): string => {
  const language = typeof metadata.language === 'string' ? metadata.language : 'unknown';
  const securityLevel =
    typeof metadata.securityLevel === 'string' ? metadata.securityLevel : 'unknown';
  const documentType = typeof metadata.documentType === 'string' ? metadata.documentType : 'doc';

  return `${documentType} · ${language} · ${securityLevel}`;
};
