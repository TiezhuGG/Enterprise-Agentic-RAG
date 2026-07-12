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
    <Card>
      <CardHeader className="document-preview-panel__header">
        <div>
          <CardTitle>{'\u6587\u6863\u9884\u89c8'}</CardTitle>
          <CardDescription>
            {selectedDocument
              ? '\u67e5\u770b\u6587\u6863\u89e3\u6790\u5b8c\u6210\u540e\u7684\u53ef\u68c0\u7d22\u5185\u5bb9\u3002'
              : '\u8bf7\u5148\u9009\u62e9\u4e00\u4efd\u6587\u6863\u3002'}
          </CardDescription>
        </div>
        <Badge variant={documentPreview?.parsedContent.available ? 'success' : 'secondary'}>
          {documentPreview?.parsedContent.available ? '\u5df2\u89e3\u6790' : '\u6682\u65e0\u5185\u5bb9'}
        </Badge>
      </CardHeader>
      <CardContent className="document-preview-panel">
        {documentPreviewError ? (
          <div className="workbench-error">{documentPreviewError}</div>
        ) : null}

        {!selectedDocument ? (
          <div className="document-preview-panel__empty">{'\u5c1a\u672a\u9009\u62e9\u6587\u6863\u3002'}</div>
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
                {'\u5237\u65b0'}
              </Button>
            </div>

            {loadingDocumentPreview ? (
              <div className="document-preview-panel__empty">{'\u6b63\u5728\u52a0\u8f7d\u9884\u89c8...'}</div>
            ) : null}

            {!loadingDocumentPreview && !documentPreview?.parsedContent.available ? (
              <div className="document-preview-panel__empty">
                <Eye />
                <span>{'\u6587\u6863\u89e3\u6790\u5b8c\u6210\u540e\u4f1a\u5728\u8fd9\u91cc\u663e\u793a\u5df2\u63d0\u53d6\u7684\u5185\u5bb9\u3002'}</span>
              </div>
            ) : null}

            {documentPreview?.parsedContent.available ? (
              <>
                <div className="document-preview-panel__meta">
                  <span>{documentPreview.parsedContent.contentLength}{' \u4e2a\u5b57\u7b26'}</span>
                  {documentPreview.parsedContent.truncated ? <span>{'\u5185\u5bb9\u5df2\u622a\u65ad'}</span> : null}
                  {documentPreview.file.available ? <span>{'\u539f\u59cb\u6587\u4ef6\u53ef\u7528'}</span> : null}
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
