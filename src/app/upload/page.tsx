"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, ImageIcon, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FILE_SIZE_LIMITS } from "@/lib/upload";
import { FileSettingsModal } from "@/components/file-settings-modal";
import type { FileSettings } from "@/types/file-settings";

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

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSettings, setFileSettings] = useState<
    Record<string, FileSettings>
  >({});
  const [activeSettingsFile, setActiveSettingsFile] = useState<number | null>(
    null,
  );

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
      const allowedTypes = {
        image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        video: ["video/mp4", "video/webm", "video/ogg"],
      };

      if (
        !allowedTypes.image.includes(file.type) &&
        !allowedTypes.video.includes(file.type)
      ) {
        toast({
          title: "Invalid file type",
          description:
            "Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, OGG) are allowed",
          variant: "destructive",
        });
        return false;
      }

      const isVideo = file.type.startsWith("video/");
      const sizeLimit = session?.user?.premium
        ? FILE_SIZE_LIMITS.PREMIUM[isVideo ? "VIDEO" : "IMAGE"]
        : FILE_SIZE_LIMITS.FREE[isVideo ? "VIDEO" : "IMAGE"];

      if (file.size > sizeLimit) {
        const limitInMb = sizeLimit / (1024 * 1024);
        toast({
          title: "File too large",
          description: `Maximum ${isVideo ? "video" : "image"} size is ${limitInMb}MB for ${
            session?.user?.premium ? "premium" : "free"
          } users`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    },
    [session, toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files)
          .filter(
            (file) =>
              file.type.startsWith("image/") || file.type.startsWith("video/"),
          )
          .filter(validateFile);

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
    },
    [toast, validateFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
        .filter(
          (file) =>
            file.type.startsWith("image/") || file.type.startsWith("video/"),
        )
        .filter(validateFile);

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

    try {
      const uploadPromises = files.map(async (file, index) => {
        const settings = fileSettings[index] || { public: false };
        const formData = new FormData();
        formData.append("file", file);
        formData.append("public", String(settings.public));

        if (settings.domain && settings.domain !== "keiran.cc") {
          formData.append("domain", settings.domain);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return await response.json();
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Upload successful",
        description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully`,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images",
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
        ...(prev[fileIndex] || { public: false }),
        ...settings,
        domain: settings.domain === "keiran.cc" ? null : settings.domain,
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

      <motion.div variants={cardHover} whileHover="hover">
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
                    Drag and drop your media here
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground">
                    or click to browse from your device
                  </p>
                </motion.div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="image/*,video/mp4,video/webm,video/ogg"
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
                                {file.type.startsWith("image/") ? (
                                  <Image
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    width={32}
                                    height={32}
                                    priority
                                    className="w-full h-full object-cover"
                                  />
                                ) : file.type.startsWith("video/") ? (
                                  <video
                                    src={URL.createObjectURL(file)}
                                    className="w-full h-full object-cover"
                                    controls={false}
                                  />
                                ) : (
                                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            <motion.div
                              className="p-2 text-sm truncate"
                              variants={fadeIn}
                            >
                              {file.name}
                            </motion.div>
                          </div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          >
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute top-2 left-2 z-10"
                          >
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => setActiveSettingsFile(index)}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>

                            {activeSettingsFile !== null && (
                              <FileSettingsModal
                                isOpen={true}
                                onClose={() => setActiveSettingsFile(null)}
                                fileName={files[activeSettingsFile].name}
                                settings={
                                  fileSettings[activeSettingsFile] || {
                                    public: false,
                                  }
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
