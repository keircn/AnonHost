'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArchiveIcon,
  FolderIcon,
  FileIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { formatFileSize } from '@/lib/upload';

interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
  compressedSize?: number;
  lastModified?: Date;
  crc32?: number;
}

interface ArchiveMetadata {
  totalFiles: number;
  totalDirectories: number;
  uncompressedSize: number;
  compressedSize: number;
  entries: ArchiveEntry[];
  archiveType: string;
  hasPassword?: boolean;
}

interface ArchivePreviewProps {
  metadata: ArchiveMetadata;
  filename: string;
  downloadUrl: string;
}

export function ArchivePreview({
  metadata,
  filename,
  downloadUrl,
}: ArchivePreviewProps) {
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const displayEntries = showAllEntries
    ? metadata.entries
    : metadata.entries.slice(0, 10);

  const sortedEntries = [...displayEntries].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        const aDate = a.lastModified?.getTime() || 0;
        const bDate = b.lastModified?.getTime() || 0;
        comparison = aDate - bDate;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const compressionRatio =
    metadata.compressedSize > 0 && metadata.uncompressedSize > 0
      ? (
          ((metadata.uncompressedSize - metadata.compressedSize) /
            metadata.uncompressedSize) *
          100
        ).toFixed(1)
      : '0';

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ArchiveIcon className="h-5 w-5" />
          {filename}
          <Badge variant="secondary" className="ml-auto">
            {metadata.archiveType.toUpperCase()}
          </Badge>
        </CardTitle>

        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Files</div>
            <div className="font-semibold">
              {metadata.totalFiles.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Directories</div>
            <div className="font-semibold">
              {metadata.totalDirectories.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Uncompressed</div>
            <div className="font-semibold">
              {formatFileSize(metadata.uncompressedSize)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Compression</div>
            <div className="font-semibold">{compressionRatio}%</div>
          </div>
        </div>

        {metadata.hasPassword && (
          <Badge variant="destructive" className="w-fit">
            Password Protected
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'name' | 'size' | 'date')
                }
                className="rounded border px-2 py-1 text-sm"
              >
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="date">Date</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="rounded border px-2 py-1 text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
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

          <div className="rounded-lg border">
            <div className="bg-muted/50 grid grid-cols-12 gap-2 border-b p-3 text-sm font-medium">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Compressed</div>
              <div className="col-span-2">Modified</div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {sortedEntries.map((entry, index) => (
                <div
                  key={index}
                  className="hover:bg-muted/25 grid grid-cols-12 gap-2 border-b p-3 transition-colors last:border-b-0"
                >
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    {entry.isDirectory ? (
                      <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    ) : (
                      <FileIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    )}
                    <span className="truncate" title={entry.name}>
                      {entry.name}
                    </span>
                  </div>
                  <div className="text-muted-foreground col-span-2 text-sm">
                    {!entry.isDirectory && formatFileSize(entry.size)}
                  </div>
                  <div className="text-muted-foreground col-span-2 text-sm">
                    {!entry.isDirectory &&
                      entry.compressedSize &&
                      formatFileSize(entry.compressedSize)}
                  </div>
                  <div className="text-muted-foreground col-span-2 text-sm">
                    {entry.lastModified?.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {metadata.entries.length > 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllEntries(!showAllEntries)}
              className="w-full"
            >
              {showAllEntries ? (
                <>
                  <EyeOffIcon className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Show All {metadata.entries.length} Entries
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
