'use client';

import { ArrowRight, GitBranch, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AgentResponse, GraphReasoningPath } from '@/types/agent';

interface AgentGraphReasoningPathProps {
  finalResponse: AgentResponse | null;
  graphCount: number | null;
  paths: GraphReasoningPath[];
  plannerDecision: {
    needsGraph: boolean;
    needsRetrieval: boolean;
  } | null;
  running: boolean;
}

export function AgentGraphReasoningPath({
  finalResponse,
  graphCount,
  paths,
  plannerDecision,
  running,
}: AgentGraphReasoningPathProps) {
  const usedGraph = finalResponse?.metadata.usedGraph ?? plannerDecision?.needsGraph ?? false;
  const graphState = toGraphStateLabel({
    graphCount,
    paths,
    running,
    usedGraph,
  });

  return (
    <section className="agent-debug-graph-path">
      <header>
        <div>
          <h3>GraphRAG Path</h3>
          <span>展示图谱命中的实体、关系和来源文档。</span>
        </div>
        <Badge variant={graphState.variant}>{graphState.label}</Badge>
      </header>

      {!usedGraph ? (
        <div className="agent-debug-empty-state">
          <Network />
          <strong>GraphRAG 未使用</strong>
          <span>Planner 未选择图谱检索，本次回答仅使用普通检索或其它上下文。</span>
        </div>
      ) : paths.length === 0 ? (
        <div className="agent-debug-empty-state">
          <GitBranch />
          <strong>{running ? '等待图谱结果' : '未命中图谱路径'}</strong>
          <span>
            {running
              ? 'Graph node 正在执行或尚未返回。'
              : 'GraphRAG 已执行，但没有可展示的授权图谱路径。'}
          </span>
        </div>
      ) : (
        <div className="agent-debug-graph-path__list">
          {paths.slice(0, 8).map((path, index) => (
            <article className="agent-debug-graph-path__item" key={`${path.documentId}-${index}`}>
              <div>
                <strong>{path.source.name}</strong>
                <small>{path.source.type}</small>
              </div>
              <span className="agent-debug-graph-path__relation">
                <ArrowRight />
                {path.relation}
              </span>
              <div>
                <strong>{path.target.name}</strong>
                <small>{path.target.type}</small>
              </div>
              <footer>
                <span>documentId: {path.documentId}</span>
                {typeof path.score === 'number' ? <span>score {path.score.toFixed(3)}</span> : null}
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

const toGraphStateLabel = ({
  graphCount,
  paths,
  running,
  usedGraph,
}: {
  graphCount: number | null;
  paths: GraphReasoningPath[];
  running: boolean;
  usedGraph: boolean;
}): { label: string; variant: 'info' | 'secondary' | 'success' | 'warning' } => {
  if (!usedGraph) {
    return {
      label: 'skipped',
      variant: 'secondary',
    };
  }

  if (paths.length > 0) {
    return {
      label: `${paths.length} paths`,
      variant: 'success',
    };
  }

  if (running) {
    return {
      label: 'running',
      variant: 'info',
    };
  }

  return {
    label: `${graphCount ?? 0} results`,
    variant: 'warning',
  };
};
