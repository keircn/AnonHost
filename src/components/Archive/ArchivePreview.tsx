'use client';

import { useMemo, useState } from 'react';
import {
  ArchiveIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileIcon,
  FolderIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFileSize } from '@/lib/upload';

interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
  lastModified?: Date;
}

interface ArchiveMetadata {
  totalFiles: number;
  totalDirectories: number;
  entries: ArchiveEntry[];
  archiveType: string;
  hasPassword?: boolean;
}

interface ArchivePreviewProps {
  metadata: ArchiveMetadata;
  filename: string;
  downloadUrl: string;
  uploader: string;
  uploadedAt: Date;
  fileId: string;
  fileSize: number;
}

interface TreeNode {
  name: string;
  path: string;
  parentPath: string | null;
  isDirectory: boolean;
  size: number;
  lastModified?: Date;
  children: Map<string, TreeNode>;
}

const ITEMS_PER_PAGE = 50;

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function splitPath(path: string): string[] {
  const normalized = normalizePath(path);
  return normalized ? normalized.split('/').filter(Boolean) : [];
}

function createNode(params: {
  name: string;
  path: string;
  parentPath: string | null;
  isDirectory: boolean;
}): TreeNode {
  return {
    name: params.name,
    path: params.path,
    parentPath: params.parentPath,
    isDirectory: params.isDirectory,
    size: 0,
    children: new Map(),
  };
}

function buildTree(entries: ArchiveEntry[]): TreeNode {
  const root = createNode({
    name: '',
    path: '',
    parentPath: null,
    isDirectory: true,
  });

  for (const rawEntry of entries) {
    const parts = splitPath(rawEntry.name);

    if (parts.length === 0) {
      continue;
    }

    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === parts.length - 1;
      const shouldBeDirectory = !isLastPart || rawEntry.isDirectory;

      let next = current.children.get(part);
      if (!next) {
        next = createNode({
          name: part,
          path: currentPath,
          parentPath: current.path || null,
          isDirectory: shouldBeDirectory,
        });
        current.children.set(part, next);
      }

      if (shouldBeDirectory) {
        next.isDirectory = true;
      }

      current = next;
    }

    current.size = rawEntry.size;
    current.lastModified =
      rawEntry.lastModified && !(rawEntry.lastModified instanceof Date)
        ? new Date(rawEntry.lastModified)
        : rawEntry.lastModified;
  }

  const assignDirectorySizes = (node: TreeNode): number => {
    if (!node.isDirectory) {
      return node.size;
    }

    let total = 0;
    for (const child of node.children.values()) {
      total += assignDirectorySizes(child);
    }
    node.size = total;
    return total;
  };

  assignDirectorySizes(root);
  return root;
}

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function formatDate(value?: Date): string {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(value);
}

export function ArchivePreview({
  metadata,
  filename,
  downloadUrl,
  uploader,
  uploadedAt,
  fileId,
  fileSize,
}: ArchivePreviewProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [page, setPage] = useState(1);

  const tree = useMemo(() => buildTree(metadata.entries), [metadata.entries]);

  const currentNode = useMemo(() => {
    const parts = splitPath(currentPath);
    let node = tree;

    for (const part of parts) {
      const next = node.children.get(part);
      if (!next || !next.isDirectory) {
        return tree;
      }
      node = next;
    }

    return node;
  }, [currentPath, tree]);

  const breadcrumbs = useMemo(() => {
    const parts = splitPath(currentNode.path);
    const crumbs: { label: string; path: string }[] = [
      { label: '/', path: '' },
    ];
    let pathAcc = '';

    for (const part of parts) {
      pathAcc = pathAcc ? `${pathAcc}/${part}` : part;
      crumbs.push({ label: part, path: pathAcc });
    }

    return crumbs;
  }, [currentNode.path]);

  const visibleItems = useMemo(
    () => sortNodes(Array.from(currentNode.children.values())),
    [currentNode]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(visibleItems.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = visibleItems.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const openDirectory = (path: string) => {
    setCurrentPath(path);
    setPage(1);
  };

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader className="space-y-4 pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <ArchiveIcon className="h-5 w-5" />
          <span className="break-all">{filename}</span>
          <Badge variant="secondary" className="ml-auto">
            {metadata.archiveType.toUpperCase()}
          </Badge>
        </CardTitle>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Files</div>
            <div className="font-semibold">
              {metadata.totalFiles.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Archive Size</div>
            <div className="font-semibold">{formatFileSize(fileSize)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Uploader</div>
            <div className="font-semibold break-all">{uploader}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Uploaded</div>
            <div className="font-semibold">{formatDate(uploadedAt)}</div>
          </div>
        </div>

        {metadata.hasPassword && (
          <Badge variant="destructive" className="w-fit">
            Password Protected
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-muted-foreground text-sm">
            Showing {pageItems.length.toLocaleString()} of{' '}
            {visibleItems.length.toLocaleString()} items in this directory
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(downloadUrl, '_blank')}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-md border p-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path || 'root'} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRightIcon className="text-muted-foreground h-3 w-3" />
              )}
              <button
                type="button"
                className="hover:bg-muted rounded px-2 py-1"
                onClick={() => openDirectory(crumb.path)}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="bg-muted/50 grid grid-cols-12 gap-2 border-b p-3 text-xs font-semibold tracking-wide uppercase sm:text-sm">
            <div className="col-span-7">Name</div>
            <div className="col-span-2 text-right">Size</div>
            <div className="col-span-3 text-right">Modified</div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {pageItems.length === 0 ? (
              <div className="text-muted-foreground p-4 text-sm">
                This directory is empty.
              </div>
            ) : (
              pageItems.map((item) => (
                <div
                  key={item.path}
                  className="hover:bg-muted/40 grid grid-cols-12 gap-2 border-b p-3 text-sm last:border-b-0"
                >
                  <div className="col-span-7 flex min-w-0 items-center gap-2">
                    {item.isDirectory ? (
                      <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    ) : (
                      <FileIcon className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    )}

                    {item.isDirectory ? (
                      <button
                        type="button"
                        className="hover:text-foreground text-left text-blue-600 underline-offset-2 hover:underline"
                        onClick={() => openDirectory(item.path)}
                        title={item.name}
                      >
                        <span className="truncate">{item.name}</span>
                      </button>
                    ) : (
                      <span className="truncate" title={item.name}>
                        {item.name}
                      </span>
                    )}
                  </div>

                  <div className="text-muted-foreground col-span-2 text-right text-xs sm:text-sm">
                    {formatFileSize(item.size)}
                  </div>
                  <div className="text-muted-foreground col-span-3 text-right text-xs sm:text-sm">
                    {formatDate(item.lastModified)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
