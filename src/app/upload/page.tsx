"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FILE_SIZE_LIMITS } from "@/lib/upload";

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

  if (status === "unauthenticated") {
    redirect("/register");
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
      const sizeLimit = session?.user?.premium
        ? FILE_SIZE_LIMITS.PREMIUM
        : FILE_SIZE_LIMITS.FREE;

      if (file.size > sizeLimit) {
        const limitInMb = sizeLimit / (1024 * 1024);
        toast({
          title: "File too large",
          description: `Maximum file size is ${limitInMb}MB for ${
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
          .filter((file) => file.type.startsWith("image/"))
          .filter(validateFile);

        if (newFiles.length === 0) {
          toast({
            title: "Invalid files",
            description: "Files must be images and within size limits",
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
        .filter((file) => file.type.startsWith("image/"))
        .filter(validateFile);

      if (newFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Files must be images and within size limits",
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
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("public", "false");

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
        description: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully`,
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

  return (
    <motion.div
      className="container py-8"
      variants={fadeIn}
      initial="initial"
      animate="animate"
    >
      <motion.h1 className="text-3xl font-bold mb-6" variants={fadeIn}>
        Upload Images
      </motion.h1>

      <motion.div variants={cardHover} whileHover="hover">
        <Card>
          <CardContent className="p-6">
            <motion.div
              className={`border-2 border-dashed rounded-lg p-12 text-center`}
              variants={dropZoneVariants}
              initial="initial"
              animate={isDragging ? "dragOver" : "animate"}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <motion.div
                className="flex flex-col items-center justify-center space-y-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div
                  className="rounded-full bg-primary/10 p-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <Upload className="h-8 w-8 text-primary" />
                </motion.div>
                <motion.div className="space-y-2" variants={fadeIn}>
                  <h3 className="text-lg font-semibold">
                    Drag and drop your images here
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse from your device
                  </p>
                </motion.div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,application/json,text/plain"
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
                  className="mt-6"
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
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                                    src={
                                      URL.createObjectURL(file) ||
                                      "/placeholder.svg"
                                    }
                                    alt={file.name}
                                    width={32}
                                    height={32}
                                    priority
                                    className="w-full h-full object-cover"
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
