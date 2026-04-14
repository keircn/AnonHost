"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Settings2, File, FileText, FileType, Code, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSettingsModal } from "@/components/Files/FileSettingsModal";
import type { FileSettings } from "@/types/file-settings";
import { BLOCKED_TYPES, FILE_SIZE_LIMITS } from "@/lib/upload";
import { formatFileSize } from "@/lib/utils";
import pLimit from "p-limit";
import { nanoid } from "nanoid";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const dropZoneVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    borderColor: "rgba(255,255,255,0.2)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dragOver: {
    scale: 1.02,
    borderColor: "rgba(var(--primary),1)",
    backgroundColor: "rgba(var(--primary),0.1)",
  },
};

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

const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_CHUNK_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 800;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function UploadPageClient() {
  const { status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSettings, setFileSettings] = useState<Record<number, FileSettings>>({});
  const [activeSettingsFile, setActiveSettingsFile] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, UploadProgress>>({});

  if (status === "unauthenticated") {
    redirect("/");
  }

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

  const uploadFileResumable = async (
    file: File,
    index: number,
    fileId: string,
    settings: FileSettings,
  ) => {
    console.log(`Starting resumable upload for ${file.name} (${formatFileSize(file.size)})`);

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 0, status: "uploading" },
    }));

    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE_BYTES));
    let uploadedChunkIndexes = new Set<number>();

    try {
      const statusRes = await fetch(`/api/upload/chunk?uploadId=${encodeURIComponent(fileId)}`);
      if (statusRes.ok) {
        const statusJson = (await statusRes.json()) as { uploadedChunks?: number[] };
        uploadedChunkIndexes = new Set(statusJson.uploadedChunks || []);
      }
    } catch {
      console.warn("Could not fetch upload status; starting from chunk 0");
    }

    let uploadedBytes = 0;
    for (const existingChunkIndex of uploadedChunkIndexes) {
      const chunkStart = existingChunkIndex * CHUNK_SIZE_BYTES;
      const chunkEnd = Math.min(file.size, chunkStart + CHUNK_SIZE_BYTES);
      uploadedBytes += Math.max(0, chunkEnd - chunkStart);
    }

    const initialProgress = file.size > 0 ? Math.round((uploadedBytes / file.size) * 100) : 0;
    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: initialProgress, status: "uploading" },
    }));

    const uploadSingleChunk = async (chunkIndex: number) => {
      const chunkStart = chunkIndex * CHUNK_SIZE_BYTES;
      const chunkEnd = Math.min(file.size, chunkStart + CHUNK_SIZE_BYTES);
      const chunkBlob = file.slice(chunkStart, chunkEnd);
      const formData = new FormData();

      formData.append("chunk", chunkBlob);
      formData.append("uploadId", fileId);
      formData.append("filename", file.name);
      formData.append("fileType", file.type || "application/octet-stream");
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("totalChunks", String(totalChunks));
      formData.append("settings", JSON.stringify(settings));

      if (settings.domain && settings.domain !== "anonhost.cc") {
        formData.append("domain", settings.domain);
      }

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_CHUNK_RETRIES; attempt++) {
        try {
          const response = await fetch("/api/upload/chunk", {
            method: "POST",
            body: formData,
          });

          const json = (await response.json()) as {
            error?: string;
            complete?: boolean;
            uploadedChunks?: number[];
          };

          if (!response.ok) {
            throw new Error(json.error || "Chunk upload failed");
          }

          uploadedChunkIndexes.add(chunkIndex);
          uploadedBytes += chunkEnd - chunkStart;
          const progress = file.size > 0 ? Math.round((uploadedBytes / file.size) * 100) : 0;

          setUploadProgress((prev) => ({
            ...prev,
            [index]: { progress: Math.min(progress, 99), status: "uploading" },
          }));

          return json;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Chunk upload failed");

          if (attempt < MAX_CHUNK_RETRIES) {
            const retryDelay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
            setUploadProgress((prev) => ({
              ...prev,
              [index]: {
                progress: Math.min(Math.round((uploadedBytes / file.size) * 100), 99),
                status: "uploading",
                message: `Retrying chunk ${chunkIndex + 1}/${totalChunks} (${attempt}/${
                  MAX_CHUNK_RETRIES - 1
                })...`,
              },
            }));
            await wait(retryDelay);
            continue;
          }

          throw lastError;
        }
      }

      throw lastError || new Error("Chunk upload failed");
    };

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (uploadedChunkIndexes.has(chunkIndex)) {
        continue;
      }

      const chunkResponse = await uploadSingleChunk(chunkIndex);
      if (chunkResponse.complete) {
        setUploadProgress((prev) => ({
          ...prev,
          [index]: { progress: 100, status: "completed" },
        }));
        return chunkResponse;
      }
    }

    const finalizeFormData = new FormData();
    finalizeFormData.append("finalize", "true");
    finalizeFormData.append("uploadId", fileId);
    finalizeFormData.append("filename", file.name);
    finalizeFormData.append("fileType", file.type || "application/octet-stream");
    finalizeFormData.append("totalChunks", String(totalChunks));
    finalizeFormData.append("settings", JSON.stringify(settings));

    if (settings.domain && settings.domain !== "anonhost.cc") {
      finalizeFormData.append("domain", settings.domain);
    }

    const finalizeResponse = await fetch("/api/upload/chunk", {
      method: "POST",
      body: finalizeFormData,
    });
    const finalizeJson = (await finalizeResponse.json()) as {
      error?: string;
      complete?: boolean;
      [key: string]: unknown;
    };

    if (!finalizeResponse.ok || !finalizeJson.complete) {
      throw new Error(finalizeJson.error || "Upload finalization failed");
    }

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 100, status: "completed" },
    }));

    return finalizeJson;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("No files selected");
      return;
    }

    setIsUploading(true);
    console.log(`Starting upload of ${files.length} files...`);

    try {
      const limit = pLimit(2);
      let completedUploads = 0;
      const startTime = Date.now();

      const uploadPromises = files.map((file, index) =>
        limit(async () => {
          const uploadStartTime = Date.now();

          const settings = fileSettings[index] || defaultFileSettings;
          const result = await uploadFileResumable(file, index, nanoid(6), settings);

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
        router.push("/dashboard");
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
    <motion.div
      className="container mx-auto max-w-7xl py-8 sm:py-12 lg:py-16 xl:py-20"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <motion.h1
        className="mb-6 text-3xl font-bold lg:mb-8 lg:text-4xl xl:text-5xl"
        variants={fadeIn}
      >
        Upload Media
      </motion.h1>

      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="p-6 lg:p-8 xl:p-10">
            <motion.div
              className="rounded-lg border-2 border-dashed p-8 text-center sm:p-12 lg:p-16 xl:p-20"
              variants={dropZoneVariants}
              initial="initial"
              animate={isDragging ? "dragOver" : "animate"}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <motion.div
                className="flex flex-col items-center justify-center space-y-6 lg:space-y-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div className="bg-primary/10 rounded-full p-4 lg:p-6">
                  <Upload className="text-primary h-8 w-8 lg:h-12 lg:w-12" />
                </motion.div>
                <motion.div className="space-y-2 lg:space-y-3" variants={fadeIn}>
                  <h3 className="text-lg font-semibold lg:text-2xl">
                    Drag and drop your files here
                  </h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Click to browse from your device, or paste from your clipboard
                  </p>
                </motion.div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <motion.div>
                  <Button asChild variant="outline" disabled={isUploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <AnimatePresence mode="wait">
              {files.length > 0 && (
                <motion.div
                  className="mt-8 lg:mt-12"
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <motion.h3 className="mb-4 text-lg font-semibold" variants={fadeIn}>
                    Selected Files ({files.length})
                  </motion.h3>
                  <motion.div
                    className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    variants={staggerContainer}
                  >
                    <AnimatePresence>
                      {files.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, y: 20 }}
                          className="group relative"
                          layout
                        >
                          <div className="overflow-hidden rounded-lg border">
                            <div className="bg-muted relative aspect-square">
                              <div className="absolute inset-0 flex items-center justify-center">
                                {getFilePreview(file)}
                              </div>
                              {fileSettings[index]?.compression.enabled && (
                                <div className="bg-background/50 absolute bottom-2 left-2 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
                                  {fileSettings[index].compression.quality}% Quality
                                </div>
                              )}
                              {fileSettings[index]?.conversion.enabled &&
                                fileSettings[index].conversion.format && (
                                  <div className="bg-background/50 absolute right-2 bottom-2 rounded-md px-2 py-1 text-xs uppercase backdrop-blur-sm">
                                    {fileSettings[index].conversion.format}
                                  </div>
                                )}
                            </div>{" "}
                            <div className="space-y-1 p-2">
                              <motion.div className="truncate text-sm" variants={fadeIn}>
                                {file.name}
                              </motion.div>
                              {uploadProgress[index] && (
                                <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                                  <motion.div
                                    className="bg-primary h-full"
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${uploadProgress[index].progress}%`,
                                    }}
                                    transition={{ duration: 0.2 }}
                                  />
                                </div>
                              )}
                              {uploadProgress[index]?.status === "error" && (
                                <p className="text-destructive text-xs">
                                  {uploadProgress[index].message || "Upload failed"}
                                </p>
                              )}
                              {(fileSettings[index]?.compression.enabled ||
                                fileSettings[index]?.conversion.enabled ||
                                fileSettings[index]?.resize.enabled) && (
                                <motion.div
                                  className="text-muted-foreground truncate text-xs"
                                  variants={fadeIn}
                                >
                                  {[
                                    fileSettings[index]?.compression.enabled && "Compressed",
                                    fileSettings[index]?.conversion.enabled &&
                                      `Convert to ${fileSettings[index]?.conversion.format}`,
                                    fileSettings[index]?.resize.enabled && "Resized",
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </motion.div>
                              )}
                            </div>
                          </div>

                          <motion.div
                            initial={{ opacity: 0.5 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute top-2 right-2"
                          >
                            <Button
                              variant="destructive"
                              size="icon"
                              className="bg-background/50 hover:bg-destructive backdrop-blur-sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0.5 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute top-2 left-2 z-10"
                          >
                            <Button
                              variant="secondary"
                              size="icon"
                              className="bg-background/50 hover:bg-secondary backdrop-blur-sm"
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
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div className="mt-6 flex justify-end" variants={fadeIn}>
                    <motion.div>
                      <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Upload All Files"}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
