import { S3Client } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { nanoid } from "nanoid"
import sharp from "sharp"

interface UploadResult {
  url: string
  filename: string
  size: number
  width: number
  height: number
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

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
    const buffer = Buffer.from(await file.arrayBuffer())

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
        ACL: "public-read",
      },
    })

    await upload.done()

    const url = `${process.env.R2_PUBLIC_URL}/${filename}`

    return {
      url,
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