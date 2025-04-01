'use client'

import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ImageActionsProps {
  url: string
  filename: string
}

export function ImageActions({ url, filename }: ImageActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href)
          toast({
            title: "Copied",
            description: "Image URL copied to clipboard",
          })
        }}
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy Link
      </Button>
      <Button size="sm" asChild>
        <a href={url} download={filename}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </a>
      </Button>
    </div>
  )
}