'use client';

import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getCitationSectionTitle,
  getGraphCitationPath,
  isGraphCitation,
  toCitationExcerpt,
} from '@/lib/answer-trust';
import { useAnswerTrustStore } from '@/store/answer-trust.store';
import type { AgentCitation } from '@/types/agent';
import type { CitationPreviewMatch } from '@/types/answer-trust';

export function CitationPreviewDialog() {
  const citation = useAnswerTrustStore((state) => state.citation);
  const closePreview = useAnswerTrustStore((state) => state.closePreview);
  const document = useAnswerTrustStore((state) => state.document);
  const downloadCurrentDocument = useAnswerTrustStore((state) => state.downloadCurrentDocument);
  const error = useAnswerTrustStore((state) => state.error);
  const file = useAnswerTrustStore((state) => state.file);
  const loading = useAnswerTrustStore((state) => state.loading);
  const match = useAnswerTrustStore((state) => state.match);
  const open = useAnswerTrustStore((state) => state.open);
  const textPreview = useAnswerTrustStore((state) => state.textPreview);
  const graphPath = citation ? getGraphCitationPath(citation) : null;

  return (
    <Dialog onOpenChange={(nextOpen) => (!nextOpen ? closePreview() : undefined)} open={open}>
      <DialogContent className="answer-preview-dialog">
        <DialogHeader>
          <DialogTitle>
            {document?.title ?? getCitationSectionTitle(citation ?? fallbackCitation)}
          </DialogTitle>
          <DialogDescription>
            {citation ? `${citation.documentId} / ${citation.chunkId}` : '等待加载引用'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="answer-preview-loading">
            <Loader2 className="animate-spin" />
            <span>正在加载引用预览...</span>
          </div>
        ) : null}

        {!loading && error ? <div className="workbench-error">{error}</div> : null}

        {!loading && citation ? (
          <div className="answer-preview-layout">
            <section className="answer-preview-evidence">
              <h3>命中片段</h3>
              <p>{toCitationExcerpt(citation.content, 900)}</p>
              {graphPath ? (
                <div className="answer-preview-graph-path">
                  <strong>{graphPath.source.name}</strong>
                  <span>{graphPath.relation}</span>
                  <strong>{graphPath.target.name}</strong>
                </div>
              ) : null}
              {isGraphCitation(citation) ? <span>这是图谱引用，当前不打开原文件。</span> : null}
            </section>

            <section className="answer-preview-source">
              {document?.type === 'PDF' && file ? (
                <iframe src={file.url} title={document.title} />
              ) : null}

              {document?.type === 'IMAGE' && file ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={document.title} src={file.url} />
              ) : null}

              {textPreview !== null ? <TextPreview match={match} text={textPreview} /> : null}

              {!file && !textPreview && !isGraphCitation(citation) && !error ? (
                <div className="answer-preview-placeholder">
                  <strong>当前文档类型暂不支持内嵌预览</strong>
                  <span>仍可根据左侧片段确认引用内容。</span>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}

        <DialogFooter>
          {document ? (
            <Button onClick={() => void downloadCurrentDocument()} type="button" variant="outline">
              <Download />
              下载原文
            </Button>
          ) : null}
          <Button onClick={closePreview} type="button">
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TextPreview({ match, text }: { match: CitationPreviewMatch | null; text: string }) {
  if (!match) {
    return <pre>{text.slice(0, 1800)}</pre>;
  }

  if (!match.found) {
    return (
      <div className="answer-preview-text">
        <span>未在原文件中精确匹配片段，显示文档开头。</span>
        <pre>{match.before}</pre>
      </div>
    );
  }

  return (
    <div className="answer-preview-text">
      <span>已定位到相近片段</span>
      <pre>
        {match.before}
        <mark>{match.match}</mark>
        {match.after}
      </pre>
    </div>
  );
}

const fallbackCitation: AgentCitation = {
  chunkId: '',
  content: '',
  documentId: '',
  metadata: {},
  score: 0,
};
