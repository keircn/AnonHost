"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, ImageIcon, Trash2, Copy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

interface ImageData {
  id: string
  url: string
  displayUrl: string
  filename: string
  createdAt: string
  size: number
}

interface Stats {
  totalUploads: number
  storageUsed: number
  apiRequests: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [images, setImages] = useState<ImageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUploads: 0,
    storageUsed: 0,
    apiRequests: 0,
  })

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/images")
      if (!response.ok) {
        throw new Error("Failed to fetch images")
      }
      const data = await response.json()
      setImages(data.images || [])
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch images:", error)
      setImages([])
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteImage = async (id: string) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete image")
      }

      setImages((prev) => prev.filter((image) => image.id !== id))
      setStats((prev) => ({
        ...prev,
        totalUploads: prev.totalUploads - 1,
        storageUsed: prev.storageUsed - (images.find((img) => img.id === id)?.size || 0) / (1024 * 1024),
      }))

      toast({
        title: "Success",
        description: "Image deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete image:", error)
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      })
    }
  }

  const handleCopyUrl = (imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (image) {
      navigator.clipboard.writeText(image.displayUrl)
      toast({
        title: "Copied",
        description: "Image URL copied to clipboard",
      })
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/")
    }

    if (status === "authenticated") {
      Promise.all([fetchImages()])
    }
  }, [status])

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Tabs defaultValue="images" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="images">My Images</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <div className="grid gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Images</h2>
              <Link href="/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading your images...</div>
            ) : images.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't uploaded any images yet</p>
                  <Link href="/upload">
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Your First Image
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card>
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={image.url || "/placeholder.svg"}
                          alt={image.filename}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="truncate mr-2">
                            <p className="font-medium truncate">{image.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(image.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                          <Button size="icon" onClick={() => handleCopyUrl(image.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteImage(image.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Uploads</CardTitle>
                <CardDescription>Number of images you've uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUploads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Storage Used</CardTitle>
                <CardDescription>Total storage space used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.storageUsed < 0 ? 0 : stats.storageUsed} MB</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>API Requests</CardTitle>
                <CardDescription>API requests in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.apiRequests}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

