"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  X,
  Settings2,
  File,
  FileText,
  FileType,
  Code,
  Music,
  Lock,
  Copy,
  Terminal,
  LinkIcon,
} from "lucide-react";
import { FileSettingsModal } from "@/components/Files/FileSettingsModal";
import type { FileSettings } from "@/types/file-settings";
import { BLOCKED_TYPES, FILE_SIZE_LIMITS } from "@/lib/upload";
import { formatFileSize } from "@/lib/utils";
import pLimit from "p-limit";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const defaultFileSettings: FileSettings = {
  public: false,
  disableEmbed: false,
  stripMetadata: true,
  optimizeForWeb: true,
  compression: {
    enabled: false,
    quality: 80,
  },
  conversion: {
    enabled: false,
  },
  resize: {
    enabled: false,
    maintainAspectRatio: true,
    fit: "inside",
  },
};

interface UploadProgress {
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  message?: string;
}

interface CreateDirectUploadData {
  imageId: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}

type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

interface FinalizeDirectUploadData {
  imageId: string;
  mediaId?: string;
  privateId?: string;
  url: string;
  webUrl?: string;
  terminalUrl?: string;
  curlCommand?: string;
}

interface UploadedLink {
  filename: string;
  webUrl: string;
  terminalUrl?: string;
  curlCommand?: string;
  deletionUrl?: string;
  deletionToken?: string;
}

export function UploadPageClient() {
  const { status } = useSession();
  const router = useRouter();
  const isAnonymous = status === "unauthenticated";
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSettings, setFileSettings] = useState<Record<number, FileSettings>>({});
  const [activeSettingsFile, setActiveSettingsFile] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, UploadProgress>>({});
  const [privateMode, setPrivateMode] = useState(false);
  const [privatePassword, setPrivatePassword] = useState("");
  const [privateOneUse, setPrivateOneUse] = useState(false);
  const [uploadedLinks, setUploadedLinks] = useState<UploadedLink[]>([]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (BLOCKED_TYPES.includes(file.type)) {
        toast.error("File type not allowed");
        return false;
      }

      const sizeLimit = FILE_SIZE_LIMITS.FREE;

      if (file.size > sizeLimit) {
        const limitInMb =
          sizeLimit >= 1024 * 1024 * 1024
            ? `${sizeLimit / (1024 * 1024 * 1024)}GB`
            : `${sizeLimit / (1024 * 1024)}MB`;
        toast.error(`Maximum file size is ${limitInMb} for all users`);
        return false;
      }

      return true;
    },
    [toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter(validateFile);

        if (newFiles.length === 0) {
          toast.error("Invalid files");
          return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [toast, validateFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(validateFile);

      if (newFiles.length === 0) {
        toast.error("Invalid files");
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const mediaItems = Array.from(items).filter(
        (item) => item.type.startsWith("image/") || item.type.startsWith("video/"),
      );

      if (mediaItems.length === 0) return;

      const newFiles = await Promise.all(
        mediaItems.map((item) => {
          const file = item.getAsFile();
          if (!file) return null;
          return validateFile(file) ? file : null;
        }),
      );

      const validFiles = newFiles.filter((file): file is File => file !== null);

      if (validFiles.length === 0) {
        toast.error("Invalid files");
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);

      toast.success(
        `Added ${validFiles.length} file${validFiles.length > 1 ? "s" : ""} from clipboard`,
      );
    },
    [validateFile, toast],
  );

  const getFilePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return (
        <Image
          src={URL.createObjectURL(file)}
          alt={file.name}
          width={32}
          height={32}
          priority
          className="h-full w-full object-cover"
        />
      );
    }

    if (file.type.startsWith("video/")) {
      return (
        <video
          src={URL.createObjectURL(file)}
          className="h-full w-full object-cover"
          controls={false}
        />
      );
    }

    if (file.type.startsWith("audio/")) {
      return <Music className="text-muted-foreground h-12 w-12" />;
    }

    const getFileIcon = () => {
      if (file.type.startsWith("text/")) {
        return <FileText className="text-muted-foreground h-12 w-12" />;
      }
      if (file.type.includes("json") || file.type.includes("xml")) {
        return <Code className="text-muted-foreground h-12 w-12" />;
      }
      if (file.type.includes("pdf")) {
        return <FileType className="text-muted-foreground h-12 w-12" />;
      }
      return <File className="text-muted-foreground h-12 w-12" />;
    };

    return getFileIcon();
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const uploadDirectFile = async (file: File, index: number, settings: FileSettings) => {
    console.log(`Starting direct upload for ${file.name} (${formatFileSize(file.size)})`);

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 0, status: "uploading" },
    }));

    const createResponse = await fetch("/api/upload/direct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
        private: privateMode,
      }),
    });

    const createResult = (await createResponse.json()) as ActionResult<CreateDirectUploadData>;
    if (!createResponse.ok || !createResult.ok) {
      throw new Error(createResult.ok ? "Failed to start direct upload" : createResult.error);
    }

    const uploadResult = await fetch(createResult.data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadResult.ok) {
      await fetch("/api/upload/direct/fail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId: createResult.data.imageId }),
      });

      throw new Error(`Direct upload failed with status ${uploadResult.status}`);
    }

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 95, status: "uploading" },
    }));

    const finalizeResponse = await fetch("/api/upload/direct/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageId: createResult.data.imageId,
        objectKey: createResult.data.objectKey,
        public: Boolean(settings.public),
        disableEmbed: Boolean(settings.disableEmbed),
        domain: settings.domain || null,
        private: privateMode,
        password: privateMode ? privatePassword : undefined,
        oneUse: privateMode ? privateOneUse : undefined,
      }),
    });

    const finalizeResult =
      (await finalizeResponse.json()) as ActionResult<FinalizeDirectUploadData>;

    if (!finalizeResponse.ok || !finalizeResult.ok) {
      await fetch("/api/upload/direct/fail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId: createResult.data.imageId }),
      });

      throw new Error(finalizeResult.ok ? "Upload finalization failed" : finalizeResult.error);
    }

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 100, status: "completed" },
    }));

    return finalizeResult.data;
  };

  const uploadFileStandard = async (file: File, index: number) => {
    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 0, status: "uploading" },
    }));

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }

    const data = await response.json();

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 100, status: "completed" },
    }));

    return data;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("No files selected");
      return;
    }

    if (!isAnonymous && privateMode && privatePassword.trim().length < 8) {
      toast.error("Private uploads need a password with at least 8 characters");
      return;
    }

    setIsUploading(true);
    setUploadedLinks([]);
    console.log(`Starting upload of ${files.length} files...`);

    try {
      const limit = pLimit(2);
      let completedUploads = 0;
      const startTime = Date.now();

      const uploadPromises = files.map((file, index) =>
        limit(async () => {
          const uploadStartTime = Date.now();

          let result;
          if (isAnonymous) {
            result = await uploadFileStandard(file, index);
          } else {
            const settings = fileSettings[index] || defaultFileSettings;
            result = await uploadDirectFile(file, index, settings);
          }

          completedUploads++;
          const uploadDuration = (Date.now() - uploadStartTime) / 1000;
          const uploadSpeed = (file.size / uploadDuration / 1024 / 1024).toFixed(2);

          console.log(
            `Uploaded ${file.name} (${formatFileSize(file.size)}) in ${uploadDuration.toFixed(1)}s (${uploadSpeed} MB/s)`,
          );
          console.log(`Progress: ${completedUploads}/${files.length} files completed`);

          return result;
        }),
      );

      const results = await Promise.allSettled(uploadPromises);
      const totalDuration = (Date.now() - startTime) / 1000;

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);

      console.log("\nUpload Summary:");
      console.log(`Successfully uploaded: ${successful} files`);
      console.log(`Failed uploads: ${failed} files`);
      console.log(`Total size: ${formatFileSize(totalSize)}`);
      console.log(`Total duration: ${totalDuration.toFixed(1)}s`);
      console.log(`Average speed: ${(totalSize / totalDuration / 1024 / 1024).toFixed(2)} MB/s`);

      if (successful > 0) {
        toast.success(
          `Successfully uploaded ${successful} file${successful > 1 ? "s" : ""}${
            failed > 0 ? `. ${failed} file${failed > 1 ? "s" : ""} failed.` : ""
          }`,
        );
        const links = results
          .map((result, index) => ({ result, file: files[index] }))
          .filter(
            (
              item,
            ): item is {
              result: PromiseFulfilledResult<any>;
              file: File;
            } => item.result.status === "fulfilled",
          )
          .map(({ result, file }) => ({
            filename: file.name,
            webUrl: result.value.webUrl || result.value.url,
            terminalUrl: result.value.terminalUrl,
            curlCommand: result.value.curlCommand,
            deletionUrl: result.value.deletionToken
              ? `${window.location.origin}/api/media/${result.value.id}?deletionToken=${result.value.deletionToken}`
              : undefined,
            deletionToken: result.value.deletionToken,
          }));

        if (privateMode || isAnonymous) {
          setUploadedLinks(links);
          setFiles([]);
          if (privateMode) setPrivatePassword("");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error("All files failed to upload");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("There was an error uploading your files");
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileSettings = (fileIndex: number, settings: Partial<FileSettings>) => {
    setFileSettings((prev) => ({
      ...prev,
      [fileIndex]: {
        ...(prev[fileIndex] || defaultFileSettings),
        ...settings,
      },
    }));
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-1 py-3 sm:px-3 sm:py-5 lg:py-7">
      <div>
        <Card className="overflow-hidden p-0">
          <div className="bg-primary text-primary-foreground flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold sm:text-base">
                {isAnonymous ? "Anonymous upload" : "Upload files"}
              </h1>
              <p className="hidden text-xs text-white/90 sm:block">
                {isAnonymous
                  ? "Files are publicly accessible. Save the deletion URL to remove them."
                  : "Regular uploads or password-protected private transfers"}
              </p>
            </div>
            <div className="flex gap-1">
              <span className="h-4 w-4 border border-white/70 bg-card" />
              <span className="h-4 w-4 border border-white/70 bg-card" />
            </div>
          </div>
          <CardContent className="space-y-4 p-3 sm:p-5">
            {!isAnonymous && (
              <div className="mb-4 rounded-lg border bg-card p-3 shadow-sm sm:mb-5 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border bg-secondary p-1.5">
                        <Lock className="h-4 w-4" />
                      </span>
                      <h2 className="text-base font-semibold">Private upload</h2>
                    </div>
                    <p className="text-muted-foreground max-w-2xl text-sm">
                      Password-protect these files and generate a one-use terminal download URL.
                    </p>
                  </div>
                  <Switch
                    checked={privateMode}
                    onCheckedChange={setPrivateMode}
                    aria-label="Toggle private upload"
                  />
                </div>

                {privateMode && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,auto)] lg:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="private-password">Password</Label>
                      <Input
                        id="private-password"
                        type="password"
                        value={privatePassword}
                        minLength={8}
                        onChange={(event) => setPrivatePassword(event.target.value)}
                        disabled={isUploading}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex min-h-9 items-center justify-between gap-4 rounded-lg border bg-card px-3 py-2">
                      <Label htmlFor="private-one-use" className="text-sm leading-tight">
                        Delete after web download
                      </Label>
                      <Switch
                        id="private-one-use"
                        checked={privateOneUse}
                        onCheckedChange={setPrivateOneUse}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors sm:p-8 ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 bg-card"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="rounded-lg border bg-card p-3">
                  <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold sm:text-lg">Drop files here</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {isAnonymous
                      ? "Files will be public. You will receive a deletion URL."
                      : "Click to browse from your device, or paste from your clipboard"}
                  </p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <div>
                  <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="min-w-0 text-lg font-semibold">
                    Selected files ({files.length})
                  </h3>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    {isUploading
                      ? "Uploading..."
                      : isAnonymous
                        ? "Upload Anonymously"
                        : privateMode
                          ? "Create Private Uploads"
                          : "Upload Files"}
                  </Button>
                </div>
                <div className="grid gap-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`}>
                      <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-2 shadow-sm">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                          <div className="absolute inset-0 flex items-center justify-center">
                            {getFilePreview(file)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="truncate text-sm font-semibold">
                            {file.name}
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {formatFileSize(file.size)}
                          </p>
                          {uploadProgress[index] && (
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-200"
                                style={{ width: `${uploadProgress[index].progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setActiveSettingsFile(index)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>

                        {activeSettingsFile === index && (
                          <FileSettingsModal
                            isOpen={true}
                            onClose={() => setActiveSettingsFile(null)}
                            fileName={files[activeSettingsFile].name}
                            settings={fileSettings[activeSettingsFile] || defaultFileSettings}
                            onSettingsChange={(newSettings) => {
                              updateFileSettings(activeSettingsFile, newSettings);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedLinks.length > 0 && (
              <div className="mt-6 space-y-4 rounded-lg border bg-card p-4 shadow-sm sm:mt-8">
                <div>
                  <h3 className="text-lg font-semibold">
                    {isAnonymous ? "Upload Complete" : "Private Links"}
                  </h3>
                  {isAnonymous ? (
                    <p className="text-muted-foreground text-sm">
                      Save the deletion URL to remove this file later. It is only shown once.
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      The terminal URL is one-use. The web URL requires the password.
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  {uploadedLinks.map((link) => (
                    <div
                      key={`${link.filename}-${link.webUrl}`}
                      className="space-y-3 rounded-lg border bg-muted p-3"
                    >
                      <p className="text-sm font-medium break-all">{link.filename}</p>
                      <UploadLinkRow label="Web URL" value={link.webUrl} icon="web" />
                      {isAnonymous && link.deletionUrl && (
                        <UploadLinkRow
                          label="Deletion URL"
                          value={link.deletionUrl}
                          icon="terminal"
                        />
                      )}
                      {link.terminalUrl && (
                        <UploadLinkRow
                          label="Terminal URL"
                          value={link.terminalUrl}
                          icon="terminal"
                        />
                      )}
                      {link.curlCommand && (
                        <UploadLinkRow label="Curl" value={link.curlCommand} icon="terminal" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function UploadLinkRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: "web" | "terminal";
}) {
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase">
        {icon === "web" ? <LinkIcon className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
        {label}
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <code className="max-w-full min-w-0 overflow-x-auto border bg-muted px-3 py-2 text-xs whitespace-nowrap">
          {value}
        </code>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={copy}>
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
    </div>
  );
}
