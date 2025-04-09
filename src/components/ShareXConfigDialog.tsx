"use client";

import { Button } from "@/components/ui/button";
import { SiSharex } from "react-icons/si";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ApiKey } from "@/types/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  generateShareXConfig,
  generateShareXShortenerConfig,
  downloadShareXConfig,
} from "@/lib/sharex";

interface ShareXConfigDialogProps {
  apiKey: ApiKey;
}

export function ShareXConfigDialog({ apiKey }: ShareXConfigDialogProps) {
  const { toast } = useToast();

  const handleCopyConfig = (config: any, type: string) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast({
      title: "Copied to clipboard",
      description: `${type} configuration copied`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Export ShareX Config">
          <SiSharex className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export ShareX Configuration</DialogTitle>
          <DialogDescription>
            Choose which ShareX configuration you want to use.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Select the type of configuration you want to export for ShareX.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShareXConfigCard
              title="Image Uploader"
              description="Upload images directly to AnonHost"
              apiKey={apiKey}
              configType="uploader"
              onDownload={() => {
                const config = generateShareXConfig(
                  apiKey.key,
                  window.location.origin,
                );
                downloadShareXConfig(config, `${apiKey.name}-uploader`);
              }}
              onCopy={() => {
                const config = generateShareXConfig(
                  apiKey.key,
                  window.location.origin,
                );
                handleCopyConfig(config, "Image uploader");
              }}
            />

            <ShareXConfigCard
              title="URL Shortener"
              description="Shorten URLs with AnonHost"
              apiKey={apiKey}
              configType="shortener"
              onDownload={() => {
                const config = generateShareXShortenerConfig(
                  apiKey.key,
                  window.location.origin,
                );
                downloadShareXConfig(config, `${apiKey.name}-shortener`);
              }}
              onCopy={() => {
                const config = generateShareXShortenerConfig(
                  apiKey.key,
                  window.location.origin,
                );
                handleCopyConfig(config, "URL shortener");
              }}
            />
          </div>
          <p className="text-sm">
            <a
              href="https://getsharex.com/docs/custom-uploader#sxcu-file"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn how to import ShareX configurations →
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ShareXConfigCardProps {
  title: string;
  description: string;
  apiKey: ApiKey;
  configType: "uploader" | "shortener";
  onDownload: () => void;
  onCopy: () => void;
}

function ShareXConfigCard({
  title,
  description,
  onDownload,
  onCopy,
}: ShareXConfigCardProps) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="flex flex-col gap-2">
          <Button onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={onCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
