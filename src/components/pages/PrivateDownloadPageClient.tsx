"use client";

import { useState } from "react";
import { Download, FileKey } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFileSize } from "@/lib/utils";

export function PrivateDownloadPageClient({
  id,
  filename,
  size,
  oneUse,
}: {
  id: string;
  filename: string;
  size: number;
  oneUse: boolean;
}) {
  const [password, setPassword] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async () => {
    if (!password) {
      toast.error("Enter the password");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/private-upload/${id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      if (oneUse) {
        setPassword("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center py-8">
      <Card className="mx-auto w-full max-w-lg">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <div className="bg-primary/10 inline-flex rounded-full p-3">
              <FileKey className="text-primary h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold break-all">{filename}</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {formatFileSize(size)}
                {oneUse ? " · deleted after download" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="download-password">Password</Label>
            <Input
              id="download-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  download();
                }
              }}
              autoFocus
            />
          </div>

          <Button onClick={download} disabled={isDownloading} className="w-full gap-2">
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
