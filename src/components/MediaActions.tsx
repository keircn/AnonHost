"use client";

import { Button } from "@/components/ui/button";
import { Download, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaActionsProps {
  url: string;
  filename: string;
}

export function MediaActions({ url, filename }: MediaActionsProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "The link has been copied to your clipboard",
    });
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="icon" onClick={handleCopyLink}>
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleDownload}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
