'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Archive, Eraser, Layers3, Play, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkbenchStore } from '@/store/workbench.store';

export function BatchOperationsPanel() {
  const batchArchiveDocuments = useWorkbenchStore((state) => state.batchArchiveDocuments);
  const batchIngestDocuments = useWorkbenchStore((state) => state.batchIngestDocuments);
  const batchState = useWorkbenchStore((state) => state.batchState);
  const batchUpdateTaxonomy = useWorkbenchStore((state) => state.batchUpdateTaxonomy);
  const categories = useWorkbenchStore((state) => state.categories);
  const clearDocumentSelection = useWorkbenchStore((state) => state.clearDocumentSelection);
  const selectedDocumentIds = useWorkbenchStore((state) => state.selectedDocumentIds);
  const tags = useWorkbenchStore((state) => state.tags);
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const selectedTagSet = useMemo(() => new Set(tagIds), [tagIds]);
  const running = batchState.status === 'running';
  const hasSelection = selectedDocumentIds.length > 0;

  const handleArchive = async () => {
    if (!hasSelection) {
      return;
    }

    const confirmed = window.confirm(`Archive ${selectedDocumentIds.length} selected documents?`);

    if (confirmed) {
      await batchArchiveDocuments();
    }
  };

  const handleTaxonomySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await batchUpdateTaxonomy({
      categoryId: categoryId || null,
      tagIds,
    });
  };

  const toggleTag = (tagId: string) => {
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId],
    );
  };

  return (
    <Card>
      <CardHeader className="batch-panel__header">
        <div>
          <CardTitle>Batch Operations</CardTitle>
          <CardDescription>Apply management actions to selected documents.</CardDescription>
        </div>
        <Badge variant={hasSelection ? 'info' : 'secondary'}>
          {selectedDocumentIds.length} selected
        </Badge>
      </CardHeader>
      <CardContent className="batch-panel">
        {batchState.errorMessage ? (
          <div className="workbench-error">{batchState.errorMessage}</div>
        ) : null}

        {batchState.lastResult ? (
          <div className={`batch-panel__result batch-panel__result--${batchState.status}`}>
            <strong>{batchState.lastResult.operation}</strong>
            <span>
              {batchState.lastResult.succeeded} succeeded / {batchState.lastResult.failed} failed
            </span>
          </div>
        ) : null}

        <div className="batch-panel__actions">
          <Button disabled={!hasSelection || running} onClick={() => void batchIngestDocuments()}>
            <Play />
            Batch ingest
          </Button>
          <Button
            disabled={!hasSelection || running}
            onClick={handleArchive}
            type="button"
            variant="destructive"
          >
            <Archive />
            Archive
          </Button>
          <Button
            disabled={!hasSelection || running}
            onClick={clearDocumentSelection}
            variant="outline"
          >
            <Eraser />
            Clear
          </Button>
        </div>

        <form className="batch-panel__taxonomy" onSubmit={handleTaxonomySubmit}>
          <div className="batch-panel__field">
            <span>Category</span>
            <select
              disabled={!hasSelection || running}
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="batch-panel__field">
            <span>Tags</span>
            <div className="batch-panel__tags">
              {tags.length === 0 ? <small>No tags in this Space.</small> : null}
              {tags.map((tag) => (
                <label key={tag.id}>
                  <input
                    checked={selectedTagSet.has(tag.id)}
                    disabled={!hasSelection || running}
                    onChange={() => toggleTag(tag.id)}
                    type="checkbox"
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button disabled={!hasSelection || running} type="submit" variant="outline">
            <Layers3 />
            <Save />
            Apply taxonomy
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
