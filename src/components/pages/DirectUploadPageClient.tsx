"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createDirectUpload,
  finalizeDirectUpload,
  markDirectUploadFailed,
} from "@/app/upload/direct/actions";

type UploadState = "idle" | "requesting_url" | "uploading" | "finalizing" | "done" | "error";

export function DirectUploadPageClient() {
  const { status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (status === "unauthenticated") {
    redirect("/");
  }

  const isBusy =
    uploadState === "requesting_url" || uploadState === "uploading" || uploadState === "finalizing";

  const statusLabel = useMemo(() => {
    switch (uploadState) {
      case "requesting_url":
        return "Preparing upload";
      case "uploading":
        return `Uploading ${progress}%`;
      case "finalizing":
        return "Finalizing";
      case "done":
        return "Upload complete";
      case "error":
        return "Upload failed";
      default:
        return "Idle";
    }
  }, [progress, uploadState]);

  const uploadWithProgress = (uploadUrl: string, inputFile: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", inputFile.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading to R2"));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          resolve();
          return;
        }
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      };

      xhr.send(inputFile);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }

    setUploadedUrl(null);
    setErrorMessage(null);
    setProgress(0);
    setUploadState("requesting_url");

    const createResult = await createDirectUpload({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "application/octet-stream",
    });

    if (!createResult.ok) {
      setUploadState("error");
      setErrorMessage(createResult.error);
      toast.error(createResult.error);
      return;
    }

    const { imageId, objectKey, uploadUrl } = createResult.data;

    try {
      setUploadState("uploading");
      await uploadWithProgress(uploadUrl, file);

      setUploadState("finalizing");
      const finalizeResult = await finalizeDirectUpload({ imageId, objectKey });

      if (!finalizeResult.ok) {
        await markDirectUploadFailed(imageId);
        setUploadState("error");
        setErrorMessage(finalizeResult.error);
        toast.error(finalizeResult.error);
        return;
      }

      setUploadedUrl(finalizeResult.data.url);
      setUploadState("done");
      toast.success("Uploaded successfully");
    } catch (error) {
      await markDirectUploadFailed(imageId);
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadState("error");
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Direct-to-R2 Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              setUploadState("idle");
              setProgress(0);
              setUploadedUrl(null);
              setErrorMessage(null);
            }}
            disabled={isBusy}
          />

          {file && (
            <p className="text-muted-foreground text-sm">
              {file.name} - {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Status: {statusLabel}</p>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          <Button onClick={handleUpload} disabled={!file || isBusy}>
            {isBusy ? "Uploading..." : "Upload"}
          </Button>

          {uploadedUrl && (
            <p className="text-sm">
              Uploaded URL: <a href={uploadedUrl}>{uploadedUrl}</a>
            </p>
          )}

          {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
