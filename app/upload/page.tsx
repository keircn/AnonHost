"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, ImageIcon, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  if (status === "unauthenticated") {
    redirect("/")
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

        if (newFiles.length === 0) {
          toast({
            title: "Invalid files",
            description: "Only image files are allowed",
            variant: "destructive",
          })
          return
        }

        setFiles((prev) => [...prev, ...newFiles])
      }
    },
    [toast],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"))

      if (newFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Only image files are allowed",
          variant: "destructive",
        })
        return
      }

      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("public", "false")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return await response.json()
      })

      await Promise.all(uploadPromises)

      toast({
        title: "Upload successful",
        description: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully`,
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Images</h1>

      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Drag and drop your images here</h3>
                <p className="text-sm text-muted-foreground">or click to browse from your device</p>
              </div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button asChild variant="outline" disabled={isUploading}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Selected Files ({files.length})</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group"
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <div className="aspect-square relative bg-muted">
                          <div className="absolute inset-0 flex items-center justify-center">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file) || "/placeholder.svg"}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="p-2 text-sm truncate">{file.name}</div>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload All Files"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

