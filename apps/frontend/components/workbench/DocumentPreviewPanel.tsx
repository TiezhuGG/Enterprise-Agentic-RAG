'use client';

import { useEffect } from 'react';
import { Eye, FileText, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkbenchStore } from '@/store/workbench.store';

export function DocumentPreviewPanel() {
  const documentPreview = useWorkbenchStore((state) => state.documentPreview);
  const documentPreviewError = useWorkbenchStore((state) => state.documentPreviewError);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadDocumentPreview = useWorkbenchStore((state) => state.loadDocumentPreview);
  const loadingDocumentPreview = useWorkbenchStore((state) => state.loadingDocumentPreview);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;

  useEffect(() => {
    if (selectedDocumentId) {
      void loadDocumentPreview(selectedDocumentId);
    }
  }, [loadDocumentPreview, selectedDocumentId]);

  return (
    <Card className="min-w-0">
      <CardHeader className="document-preview-panel__header">
        <div>
          <CardTitle>文档预览</CardTitle>
          <CardDescription>
            {selectedDocument
              ? '查看文档解析完成后的可检索内容。'
              : '请先选择一份文档。'}
          </CardDescription>
        </div>
        <Badge variant={documentPreview?.parsedContent.available ? 'success' : 'secondary'}>
          {documentPreview?.parsedContent.available ? '已解析' : '暂无内容'}
        </Badge>
      </CardHeader>
      <CardContent className="document-preview-panel">
        {documentPreviewError ? (
          <div className="workbench-error">{documentPreviewError}</div>
        ) : null}

        {!selectedDocument ? (
          <div className="document-preview-panel__empty">尚未选择文档。</div>
        ) : (
          <>
            <div className="document-preview-panel__toolbar">
              <div>
                <FileText />
                <span>{selectedDocument.title}</span>
              </div>
              <Button
                disabled={loadingDocumentPreview}
                onClick={() => void loadDocumentPreview(selectedDocument.id)}
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCw className={loadingDocumentPreview ? 'animate-spin' : undefined} />
                刷新
              </Button>
            </div>

            {loadingDocumentPreview ? (
              <div className="document-preview-panel__empty">正在加载预览...</div>
            ) : null}

            {!loadingDocumentPreview && !documentPreview?.parsedContent.available ? (
              <div className="document-preview-panel__empty">
                <Eye />
                <span>文档解析完成后会在这里显示已提取的内容。</span>
              </div>
            ) : null}

            {documentPreview?.parsedContent.available ? (
              <>
                <div className="document-preview-panel__meta">
                  <span>{documentPreview.parsedContent.contentLength} 个字符</span>
                  {documentPreview.parsedContent.truncated ? <span>内容已截断</span> : null}
                  {documentPreview.file.available ? <span>原始文件可用</span> : null}
                </div>
                <pre className="document-preview-panel__content">
                  {documentPreview.parsedContent.content}
                </pre>
              </>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
