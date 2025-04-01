import { put } from "@vercel/blob"
import { nanoid } from "nanoid"
import sharp from "sharp"

interface UploadResult {
  url: string
  filename: string
  size: number
  width: number
  height: number
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const metadata = await sharp(buffer).metadata()
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  }
}

export async function uploadImage(file: File, userId: string): Promise<UploadResult> {
  try {
    const filename = `${userId}/${nanoid()}-${file.name}`
    const dimensions = await getImageDimensions(file)

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    return {
      url: blob.url,
      filename: file.name,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
}