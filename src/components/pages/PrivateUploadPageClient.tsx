"use client";

import type React from "react";
import { useState } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Check, Copy, FileKey, LinkIcon, Terminal, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatFileSize } from "@/lib/utils";

interface PrivateUploadResult {
  id: string;
  webUrl: string;
  terminalUrl: string;
  curlCommand: string;
  filename: string;
  size: number;
  oneUse: boolean;
}

export function PrivateUploadPageClient() {
  const { status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [oneUse, setOneUse] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PrivateUploadResult | null>(null);

  if (status === "unauthenticated") {
    redirect("/");
  }

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }

    if (password.trim().length < 8) {
      toast.error("Use a password with at least 8 characters");
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);
      formData.append("oneUse", String(oneUse));

      const response = await fetch("/api/private-upload", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Private upload failed");
      }

      setResult(body);
      setPassword("");
      toast.success("Private upload created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Private upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 sm:py-12 lg:py-16">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl font-bold lg:text-4xl">Private Upload</h1>
        <p className="text-muted-foreground text-sm">
          Password-gated transfers with a separate one-use terminal download link.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="private-file">File</Label>
              <Input
                id="private-file"
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                disabled={isUploading}
              />
              {file && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <FileKey className="h-4 w-4" />
                  <span className="break-all">
                    {file.name} · {formatFileSize(file.size)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="private-password">Password</Label>
              <Input
                id="private-password"
                type="password"
                value={password}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isUploading}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-1">
                <Label htmlFor="one-use">Delete after web download</Label>
                <p className="text-muted-foreground text-sm">
                  The terminal link is always one-use. Enable this to make the password page
                  one-use too.
                </p>
              </div>
              <Switch id="one-use" checked={oneUse} onCheckedChange={setOneUse} />
            </div>

            <Button onClick={handleUpload} disabled={isUploading} className="gap-2">
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Create Private Upload"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2">
              {result ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <FileKey className="text-muted-foreground h-5 w-5" />
              )}
              <h2 className="text-lg font-semibold">Links</h2>
            </div>

            {result ? (
              <div className="space-y-4">
                <LinkRow
                  icon={<LinkIcon className="h-4 w-4" />}
                  label="Web URL"
                  value={result.webUrl}
                  onCopy={() => copy(result.webUrl, "Web URL")}
                />
                <LinkRow
                  icon={<Terminal className="h-4 w-4" />}
                  label="Terminal URL"
                  value={result.terminalUrl}
                  onCopy={() => copy(result.terminalUrl, "Terminal URL")}
                />
                <LinkRow
                  icon={<Terminal className="h-4 w-4" />}
                  label="Curl"
                  value={result.curlCommand}
                  onCopy={() => copy(result.curlCommand, "Curl command")}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Your web URL, one-use terminal URL, and curl command will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase">
        {icon}
        {label}
      </div>
      <div className="flex min-w-0 gap-2">
        <code className="bg-muted min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 text-xs whitespace-nowrap">
          {value}
        </code>
        <Button type="button" variant="outline" size="icon" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
