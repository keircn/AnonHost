'use client';

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Upload,
  X,
  Settings2,
  File,
  FileText,
  FileType,
  Code,
  Music,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSettingsModal } from '@/components/Files/FileSettingsModal';
import type { FileSettings } from '@/types/file-settings';
import { BLOCKED_TYPES, FILE_SIZE_LIMITS, CHUNK_SIZE } from '@/lib/upload';
import { uploadFileInChunks } from '@/lib/chunked-upload';
import { formatFileSize } from '@/lib/utils';
import pLimit from 'p-limit';
import { nanoid } from 'nanoid';

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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dragOver: {
    scale: 1.02,
    borderColor: 'rgba(var(--primary),1)',
    backgroundColor: 'rgba(var(--primary),0.1)',
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

interface UploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  message?: string;
}

export function UploadPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileSettings, setFileSettings] = useState<
    Record<number, FileSettings>
  >({});
  const [activeSettingsFile, setActiveSettingsFile] = useState<number | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<
    Record<number, UploadProgress>
  >({});

  if (status === 'unauthenticated') {
    redirect('/');
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
        toast.error('File type not allowed');
        return false;
      }

      const sizeLimit = session?.user?.premium
        ? FILE_SIZE_LIMITS.PREMIUM
        : FILE_SIZE_LIMITS.FREE;

      if (file.size > sizeLimit) {
        const limitInMb =
          sizeLimit >= 1024 * 1024 * 1024
            ? `${sizeLimit / (1024 * 1024 * 1024)}GB`
            : `${sizeLimit / (1024 * 1024)}MB`;
        toast.error(
          `Maximum file size is ${limitInMb} for ${session?.user?.premium ? 'premium' : 'free'} users`
        );
        return false;
      }

      return true;
    },
    [toast, session?.user?.premium]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter(validateFile);

        if (newFiles.length === 0) {
          toast.error('Invalid files');
          return;
        }

        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [toast, validateFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(validateFile);

      if (newFiles.length === 0) {
        toast.error('Invalid files');
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
          item.type.startsWith('image/') || item.type.startsWith('video/')
      );

      if (mediaItems.length === 0) return;

      const newFiles = await Promise.all(
        mediaItems.map((item) => {
          const file = item.getAsFile();
          if (!file) return null;
          return validateFile(file) ? file : null;
        })
      );

      const validFiles = newFiles.filter((file): file is File => file !== null);

      if (validFiles.length === 0) {
        toast.error('Invalid files');
        return;
      }

      setFiles((prev) => [...prev, ...validFiles]);

      toast.success(
        `Added ${validFiles.length} file${validFiles.length > 1 ? 's' : ''} from clipboard`
      );
    },
    [validateFile, toast]
  );

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
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

    if (file.type.startsWith('video/')) {
      return (
        <video
          src={URL.createObjectURL(file)}
          className="h-full w-full object-cover"
          controls={false}
        />
      );
    }

    if (file.type.startsWith('audio/')) {
      return <Music className="text-muted-foreground h-12 w-12" />;
    }

    const getFileIcon = () => {
      if (file.type.startsWith('text/')) {
        return <FileText className="text-muted-foreground h-12 w-12" />;
      }
      if (file.type.includes('json') || file.type.includes('xml')) {
        return <Code className="text-muted-foreground h-12 w-12" />;
      }
      if (file.type.includes('pdf')) {
        return <FileType className="text-muted-foreground h-12 w-12" />;
      }
      return <File className="text-muted-foreground h-12 w-12" />;
    };

    return getFileIcon();
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const uploadFileWithChunks = async (file: File, index: number) => {
    const settings = fileSettings[index] || defaultFileSettings;
    const fileId = nanoid(6);
    // Lower threshold for chunking to handle weak connections better
    const needsChunking = file.size > 50 * 1024 * 1024; // Reduced from 80MB to 50MB

    if (!needsChunking) {
      return uploadFileDirect(file, index, fileId, settings);
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    console.log(
      `Uploading ${file.name} in ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB each`
    );

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 0, status: 'uploading' },
    }));

    try {
      // Use the improved chunked upload with retry logic
      await uploadFileInChunks({
        file,
        maxConcurrentChunks: 1, // Sequential uploads for weak connections
        maxRetries: 3,
        timeoutMs: 60000, // 60 second timeout per chunk
        retryDelayMs: 1000,
        onProgress: (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [index]: { progress: Math.round(progress * 0.9), status: 'uploading' }, // Reserve 10% for reassembly
          }));
        },
        onChunkComplete: (chunkIndex, totalChunks) => {
          console.log(`Uploaded chunk ${chunkIndex + 1}/${totalChunks} for ${file.name}`);
        },
      });

      setUploadProgress((prev) => ({
        ...prev,
        [index]: { progress: 95, status: 'uploading' },
      }));

      const reassembleResponse = await fetch('/api/upload/reassemble', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          fileName: file.name,
          totalChunks,
          totalSize: file.size,
          settings: JSON.stringify(settings),
          customDomain:
            settings.domain && settings.domain !== 'anon.love'
              ? settings.domain
              : null,
        }),
      });

      if (!reassembleResponse.ok) {
        const errorData = await reassembleResponse.json();
        throw new Error(errorData.error || 'Failed to reassemble file');
      }

      const result = await reassembleResponse.json();

      setUploadProgress((prev) => ({
        ...prev,
        [index]: { progress: 100, status: 'completed' },
      }));

      return result;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      setUploadProgress((prev) => ({
        ...prev,
        [index]: {
          progress: 0,
          status: 'error',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      }));
      throw error;
    }
  };

  const uploadFileDirect = async (
    file: File,
    index: number,
    fileId: string,
    settings: FileSettings
  ) => {
    console.log(
      `Starting direct upload for ${file.name} (${formatFileSize(file.size)})`
    );

    setUploadProgress((prev) => ({
      ...prev,
      [index]: { progress: 0, status: 'uploading' },
    }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);
    formData.append('filename', file.name);
    formData.append('settings', JSON.stringify(settings));

    if (settings.domain && settings.domain !== 'anon.love') {
      formData.append('domain', settings.domain);
    }

    const xhr = new XMLHttpRequest();
    xhr.timeout = 120000; // 2 minute timeout for direct uploads
    
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress((prev) => ({
            ...prev,
            [index]: { progress, status: 'uploading' },
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress((prev) => ({
            ...prev,
            [index]: { progress: 100, status: 'completed' },
          }));
          resolve(response);
        } else {
          setUploadProgress((prev) => ({
            ...prev,
            [index]: {
              progress: 0,
              status: 'error',
              message: `Upload failed: HTTP ${xhr.status}`,
            },
          }));
          reject(new Error(`Upload failed: HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        setUploadProgress((prev) => ({
          ...prev,
          [index]: {
            progress: 0,
            status: 'error',
            message: 'Network error',
          },
        }));
        reject(new Error('Network error'));
      });

      xhr.addEventListener('timeout', () => {
        setUploadProgress((prev) => ({
          ...prev,
          [index]: {
            progress: 0,
            status: 'error',
            message: 'Upload timeout',
          },
        }));
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });

    return uploadPromise;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }

    setIsUploading(true);
    console.log(`Starting upload of ${files.length} files...`);

    try {
      const limit = pLimit(1); // Reduced to 1 for better reliability on weak connections
      let completedUploads = 0;
      const startTime = Date.now();

      const uploadPromises = files.map((file, index) =>
        limit(async () => {
          const uploadStartTime = Date.now();

          const result = await uploadFileWithChunks(file, index);

          completedUploads++;
          const uploadDuration = (Date.now() - uploadStartTime) / 1000;
          const uploadSpeed = (
            file.size /
            uploadDuration /
            1024 /
            1024
          ).toFixed(2);

          console.log(
            `Uploaded ${file.name} (${formatFileSize(file.size)}) in ${uploadDuration.toFixed(1)}s (${uploadSpeed} MB/s)`
          );
          console.log(
            `Progress: ${completedUploads}/${files.length} files completed`
          );

          return result;
        })
      );

      const results = await Promise.allSettled(uploadPromises);
      const totalDuration = (Date.now() - startTime) / 1000;

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const totalSize = files.reduce((acc, file) => acc + file.size, 0);

      console.log('\nUpload Summary:');
      console.log(`Successfully uploaded: ${successful} files`);
      console.log(`Failed uploads: ${failed} files`);
      console.log(`Total size: ${formatFileSize(totalSize)}`);
      console.log(`Total duration: ${totalDuration.toFixed(1)}s`);
      console.log(
        `Average speed: ${(totalSize / totalDuration / 1024 / 1024).toFixed(2)} MB/s`
      );

      if (successful > 0) {
        toast.success(
          `Successfully uploaded ${successful} file${successful > 1 ? 's' : ''}${
            failed > 0 ? `. ${failed} file${failed > 1 ? 's' : ''} failed.` : ''
          }`
        );
        router.push('/dashboard');
      } else {
        toast.error('All files failed to upload');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('There was an error uploading your files');
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileSettings = (
    fileIndex: number,
    settings: Partial<FileSettings>
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
              animate={isDragging ? 'dragOver' : 'animate'}
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
                  className="bg-primary/10 rounded-full p-4 lg:p-6"
                  whileHover={{ scale: 1.1 }}
                >
                  <Upload className="text-primary h-8 w-8 lg:h-12 lg:w-12" />
                </motion.div>
                <motion.div
                  className="space-y-2 lg:space-y-3"
                  variants={fadeIn}
                >
                  <h3 className="text-lg font-semibold lg:text-2xl">
                    Drag and drop your files here
                  </h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Click to browse from your device, or paste from your
                    clipboard
                  </p>
                </motion.div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
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
                    className="mb-4 text-lg font-semibold"
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
                          className="group relative"
                          layout
                        >
                          <div className="overflow-hidden rounded-lg border">
                            <div className="bg-muted relative aspect-square">
                              <div className="absolute inset-0 flex items-center justify-center">
                                {getFilePreview(file)}
                              </div>
                              {file.size > 80 * 1024 * 1024 && (
                                <div className="absolute top-2 left-2 rounded-md bg-blue-600/80 px-2 py-1 text-xs text-white backdrop-blur-sm">
                                  Chunked
                                </div>
                              )}
                              {fileSettings[index]?.compression.enabled && (
                                <div className="bg-background/50 absolute bottom-2 left-2 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
                                  {fileSettings[index].compression.quality}%
                                  Quality
                                </div>
                              )}
                              {fileSettings[index]?.conversion.enabled &&
                                fileSettings[index].conversion.format && (
                                  <div className="bg-background/50 absolute right-2 bottom-2 rounded-md px-2 py-1 text-xs uppercase backdrop-blur-sm">
                                    {fileSettings[index].conversion.format}
                                  </div>
                                )}
                            </div>{' '}
                            <div className="space-y-1 p-2">
                              <motion.div
                                className="truncate text-sm"
                                variants={fadeIn}
                              >
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
                              {uploadProgress[index]?.status === 'error' && (
                                <p className="text-destructive text-xs">
                                  {uploadProgress[index].message ||
                                    'Upload failed'}
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
                                    fileSettings[index]?.compression.enabled &&
                                      'Compressed',
                                    fileSettings[index]?.conversion.enabled &&
                                      `Convert to ${fileSettings[index]?.conversion.format}`,
                                    fileSettings[index]?.resize.enabled &&
                                      'Resized',
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
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
                                settings={
                                  fileSettings[activeSettingsFile] ||
                                  defaultFileSettings
                                }
                                onSettingsChange={(newSettings) => {
                                  updateFileSettings(
                                    activeSettingsFile,
                                    newSettings
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
                        {isUploading ? 'Uploading...' : 'Upload All Files'}
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
