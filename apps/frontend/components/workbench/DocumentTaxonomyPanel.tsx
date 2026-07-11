'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { FolderTree, Plus, Save, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useWorkbenchStore } from '@/store/workbench.store';

export function DocumentTaxonomyPanel() {
  const authUser = useWorkbenchStore((state) => state.authUser);
  const categories = useWorkbenchStore((state) => state.categories);
  const createCategory = useWorkbenchStore((state) => state.createCategory);
  const createTag = useWorkbenchStore((state) => state.createTag);
  const documentTaxonomy = useWorkbenchStore((state) => state.documentTaxonomy);
  const documentTaxonomyError = useWorkbenchStore((state) => state.documentTaxonomyError);
  const documents = useWorkbenchStore((state) => state.documents);
  const loadingDocumentTaxonomy = useWorkbenchStore((state) => state.loadingDocumentTaxonomy);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const spaceMembers = useWorkbenchStore((state) => state.spaceMembers);
  const tags = useWorkbenchStore((state) => state.tags);
  const taxonomyError = useWorkbenchStore((state) => state.taxonomyError);
  const updateDocumentTaxonomy = useWorkbenchStore((state) => state.updateDocumentTaxonomy);
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const currentMember = spaceMembers.find((member) => member.userId === authUser?.id) ?? null;
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'EDITOR';
  const selectedTagSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  useEffect(() => {
    setCategoryId(documentTaxonomy?.category?.id ?? '');
    setSelectedTagIds(documentTaxonomy?.tags.map((tag) => tag.id) ?? []);
  }, [documentTaxonomy]);

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await createCategory(newCategoryName);
    setNewCategoryName('');
  };

  const handleCreateTag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await createTag(newTagName);
    setNewTagName('');
  };

  const handleSave = async () => {
    await updateDocumentTaxonomy({
      categoryId: categoryId || null,
      tagIds: selectedTagIds,
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId],
    );
  };

  return (
    <Card>
      <CardHeader className="document-taxonomy-panel__header">
        <div>
          <CardTitle>Tags & Categories</CardTitle>
          <CardDescription>
            {selectedDocument
              ? 'Organize this document for management and search filtering.'
              : 'Select a document first.'}
          </CardDescription>
        </div>
        <Badge variant={canManage ? 'success' : 'secondary'}>
          {canManage ? 'Editable' : 'Read only'}
        </Badge>
      </CardHeader>
      <CardContent className="document-taxonomy-panel">
        {taxonomyError ? <div className="workbench-error">{taxonomyError}</div> : null}
        {documentTaxonomyError ? (
          <div className="workbench-error">{documentTaxonomyError}</div>
        ) : null}

        {!selectedSpaceId ? (
          <div className="document-taxonomy-panel__empty">Select a Space first.</div>
        ) : null}

        {selectedSpaceId && !selectedDocument ? (
          <div className="document-taxonomy-panel__empty">Select a document first.</div>
        ) : null}

        {selectedDocument ? (
          <>
            <div className="document-taxonomy-panel__summary">
              <div>
                <FolderTree />
                <span>{documentTaxonomy?.category?.name ?? 'Uncategorized'}</span>
              </div>
              <div>
                <Tag />
                <span>{documentTaxonomy?.tags.length ?? 0} tags</span>
              </div>
            </div>

            <label className="document-taxonomy-panel__field">
              <span>Category</span>
              <select
                disabled={!canManage || loadingDocumentTaxonomy}
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
            </label>

            <div className="document-taxonomy-panel__field">
              <span>Tags</span>
              <div className="document-taxonomy-panel__tags">
                {tags.length === 0 ? <small>No tags in this Space.</small> : null}
                {tags.map((tag) => (
                  <label key={tag.id}>
                    <input
                      checked={selectedTagSet.has(tag.id)}
                      disabled={!canManage || loadingDocumentTaxonomy}
                      onChange={() => toggleTag(tag.id)}
                      type="checkbox"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button disabled={!canManage || loadingDocumentTaxonomy} onClick={handleSave}>
              <Save />
              Save taxonomy
            </Button>

            {canManage ? (
              <div className="document-taxonomy-panel__create-grid">
                <form onSubmit={handleCreateCategory}>
                  <Input
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="New category"
                    value={newCategoryName}
                  />
                  <Button disabled={!newCategoryName.trim()} size="sm" type="submit">
                    <Plus />
                    Category
                  </Button>
                </form>
                <form onSubmit={handleCreateTag}>
                  <Input
                    onChange={(event) => setNewTagName(event.target.value)}
                    placeholder="New tag"
                    value={newTagName}
                  />
                  <Button disabled={!newTagName.trim()} size="sm" type="submit">
                    <Plus />
                    Tag
                  </Button>
                </form>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
