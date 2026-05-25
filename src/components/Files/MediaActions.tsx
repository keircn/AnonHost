'use client';

import { Button } from '@/components/ui/button';
import { Download, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MediaActionsProps {
  url: string;
  filename: string;
}

export function MediaActions({ url, filename }: MediaActionsProps) {
  const handleCopyRawLink = () => {
    navigator.clipboard.writeText(url);
    toast(
      <div>
        <strong>Raw URL copied</strong>
        <div>The direct media URL has been copied</div>
      </div>
    );
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopyRawLink}
        aria-label="Copy raw URL"
        title="Copy raw URL"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleDownload}
        aria-label="Download file"
        title="Download file"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
