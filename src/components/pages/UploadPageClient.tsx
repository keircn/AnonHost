"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  X,
  Settings2,
  File,
  FileText,
  FileType,
  Code,
  Music,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSettingsModal } from "@/components/FileSettingsModal";
import type { FileSettings } from "@/types/file-settings";
import { ALLOWED_TYPES, FILE_SIZE_LIMITS } from "@/lib/upload";
import pLimit from "p-limit";

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

const cardHover = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
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
  },
};

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export function UploadPageClient() {
  const status = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSettings, setFileSettings] = useState<
    Record<number, FileSettings>
  >({});
  const [activeSettingsFile, setActiveSettingsFile] = useState<number | null>(
    null,
  );

  if (status.status === "unauthenticated") {
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
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description:
            "Only images, videos, audio, text files, and documents are allowed",
          variant: "destructive",
        });
        return false;
      }

      const sizeLimit = status.data?.user.premium
        ? FILE_SIZE_LIMITS.PREMIUM
        : FILE_SIZE_LIMITS.FREE;

      if (file.size > sizeLimit) {
        const limitInMb = sizeLimit / (1024 * 1024);
        toast({
          title: "File too large",
          description: `Maximum file size is ${limitInMb}MB for ${status.data?.user.premium ? "premium" : "free"} users`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    },
    [toast, status.data?.user.premium],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter(validateFile);

        if (newFiles.length === 0) {
          toast({
            title: "Invalid files",
            description: "Files must be valid and within size limits",
            variant: "destructive",
          });
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
        toast({
          title: "Invalid files",
          description: "Files must be valid media and within size limits",
          variant: "destructive",
        });
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
        (item) =>
          item.type.startsWith("image/") || item.type.startsWith("video/"),
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
        toast({
          title: "Invalid files",
          description:
            "Pasted files must be valid media and within size limits",
          variant: "destructive",
        });
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);

      toast({
        title: "Files added",
        description: `Added ${validFiles.length} file${validFiles.length > 1 ? "s" : ""} from clipboard`,
      });
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
          className="w-full h-full object-cover"
        />
      );
    }

    if (file.type.startsWith("video/")) {
      return (
        <video
          src={URL.createObjectURL(file)}
          className="w-full h-full object-cover"
          controls={false}
        />
      );
    }

    if (file.type.startsWith("audio/")) {
      return <Music className="h-12 w-12 text-muted-foreground" />;
    }

    const getFileIcon = () => {
      if (file.type.startsWith("text/")) {
        return <FileText className="h-12 w-12 text-muted-foreground" />;
      }
      if (file.type.includes("json") || file.type.includes("xml")) {
        return <Code className="h-12 w-12 text-muted-foreground" />;
      }
      if (file.type.includes("pdf")) {
        return <FileType className="h-12 w-12 text-muted-foreground" />;
      }
      return <File className="h-12 w-12 text-muted-foreground" />;
    };

    return getFileIcon();
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    console.log(`Starting upload of ${files.length} files...`);

    try {
      const limit = pLimit(3);
      let completedUploads = 0;
      const startTime = Date.now();

      const uploadPromises = files.map((file, index) =>
        limit(async () => {
          console.log(
            `Starting upload for ${file.name} (${formatFileSize(file.size)})`,
          );
          const uploadStartTime = Date.now();

          const settings = fileSettings[index] || defaultFileSettings;
          const formData = new FormData();
          formData.append("file", file);
          formData.append("settings", JSON.stringify(settings));

          if (settings.domain && settings.domain !== "keiran.cc") {
            formData.append("domain", settings.domain);
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            console.error(`Failed to upload ${file.name}:`, error);
            throw new Error(error.error || `Failed to upload ${file.name}`);
          }

          const result = await response.json();
          completedUploads++;
          const uploadDuration = (Date.now() - uploadStartTime) / 1000;
          const uploadSpeed = (
            file.size /
            uploadDuration /
            1024 /
            1024
          ).toFixed(2);

          console.log(
            `✅ Uploaded ${file.name} (${formatFileSize(file.size)}) in ${uploadDuration.toFixed(1)}s (${uploadSpeed} MB/s)`,
          );
          console.log(
            `Progress: ${completedUploads}/${files.length} files completed`,
          );

          return result;
        }),
      );

      const results = await Promise.allSettled(uploadPromises);
      const totalDuration = (Date.now() - startTime) / 1000;

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);

      console.log("\nUpload Summary:");
      console.log(`✅ Successfully uploaded: ${successful} files`);
      console.log(`❌ Failed uploads: ${failed} files`);
      console.log(`📦 Total size: ${formatFileSize(totalSize)}`);
      console.log(`⏱️ Total duration: ${totalDuration.toFixed(1)}s`);
      console.log(
        `📈 Average speed: ${(totalSize / totalDuration / 1024 / 1024).toFixed(2)} MB/s`,
      );

      if (successful > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${successful} file${successful > 1 ? "s" : ""}${failed > 0 ? `. ${failed} file${failed > 1 ? "s" : ""} failed.` : ""}`,
          variant: failed ? "destructive" : "default",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Upload failed",
          description: "All files failed to upload",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileSettings = (
    fileIndex: number,
    settings: Partial<FileSettings>,
  ) => {
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
      className="container max-w-7xl mx-auto py-8 sm:py-12 lg:py-16 xl:py-20"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <motion.h1
        className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 lg:mb-8"
        variants={fadeIn}
      >
        Upload Media
      </motion.h1>

      <motion.div variants={fadeIn} initial="initial" animate="animate">
        <Card>
          <CardContent className="p-6 lg:p-8 xl:p-10">
            <motion.div
              className="border-2 border-dashed rounded-lg p-8 sm:p-12 lg:p-16 xl:p-20 text-center"
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
                <motion.div
                  className="rounded-full bg-primary/10 p-4 lg:p-6"
                  whileHover={{ scale: 1.1 }}
                >
                  <Upload className="h-8 w-8 lg:h-12 lg:w-12 text-primary" />
                </motion.div>
                <motion.div
                  className="space-y-2 lg:space-y-3"
                  variants={fadeIn}
                >
                  <h3 className="text-lg lg:text-2xl font-semibold">
                    Drag and drop your files here
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    Click to browse from your device, or paste from your
                    clipboard
                  </p>
                </motion.div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,text/*,.json,.xml,.pdf,.php,.sh,.yaml,.ts"
                  onChange={handleFileChange}
                />
                <motion.div whileHover={{ scale: 1.02 }}>
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
                  <motion.h3
                    className="text-lg font-semibold mb-4"
                    variants={fadeIn}
                  >
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
                          whileHover={cardHover}
                          className="relative group"
                          layout
                        >
                          <div className="border rounded-lg overflow-hidden">
                            <div className="aspect-square relative bg-muted">
                              <div className="absolute inset-0 flex items-center justify-center">
                                {getFilePreview(file)}
                              </div>
                              {fileSettings[index]?.compression.enabled && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/50 backdrop-blur-sm rounded-md text-xs">
                                  {fileSettings[index].compression.quality}%
                                  Quality
                                </div>
                              )}
                              {fileSettings[index]?.conversion.enabled &&
                                fileSettings[index].conversion.format && (
                                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/50 backdrop-blur-sm rounded-md text-xs uppercase">
                                    {fileSettings[index].conversion.format}
                                  </div>
                                )}
                            </div>
                            <div className="p-2 space-y-1">
                              <motion.div
                                className="text-sm truncate"
                                variants={fadeIn}
                              >
                                {file.name}
                              </motion.div>
                              {(fileSettings[index]?.compression.enabled ||
                                fileSettings[index]?.conversion.enabled ||
                                fileSettings[index]?.resize.enabled) && (
                                <motion.div
                                  className="text-xs text-muted-foreground truncate"
                                  variants={fadeIn}
                                >
                                  {[
                                    fileSettings[index]?.compression.enabled &&
                                      "Compressed",
                                    fileSettings[index]?.conversion.enabled &&
                                      `Convert to ${fileSettings[index]?.conversion.format}`,
                                    fileSettings[index]?.resize.enabled &&
                                      "Resized",
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
                              className="bg-background/50 backdrop-blur-sm hover:bg-destructive"
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
                              className="bg-background/50 backdrop-blur-sm hover:bg-secondary"
                              onClick={() => setActiveSettingsFile(index)}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>

                            {activeSettingsFile === index && (
                              <FileSettingsModal
                                isOpen={true}
                                onClose={() => setActiveSettingsFile(null)}
                                fileName={files[activeSettingsFile].name}
                                settings={
                                  fileSettings[activeSettingsFile] ||
                                  defaultFileSettings
                                }
                                onSettingsChange={(newSettings) => {
                                  updateFileSettings(
                                    activeSettingsFile,
                                    newSettings,
                                  );
                                }}
                              />
                            )}
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    className="mt-6 flex justify-end"
                    variants={fadeIn}
                  >
                    <motion.div whileHover={{ scale: 1.02 }}>
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
