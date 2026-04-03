import { ArchiveProcessor } from "@/lib/archive-processor";
import { BLOCKED_TYPES } from "@/lib/upload";
import { saveFile } from "@/lib/server/storage";

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  duration?: number | null;
  type: "image" | "video" | "text" | "document" | "audio" | "archive" | "other";
}

export async function uploadFile(
  file: Blob,
  userId: string,
  filename: string,
  fileId: string,
  type?: "avatar" | "banner",
): Promise<UploadResult> {
  try {
    const fileType = file.type;

    if (BLOCKED_TYPES.includes(fileType)) {
      throw new Error("File type is not allowed");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveFile(buffer, userId, filename, fileId, type);

    let mediaType: UploadResult["type"];
    if (ArchiveProcessor.isArchive(filename)) {
      mediaType = "archive";
    } else if (fileType.startsWith("image/")) {
      mediaType = "image";
    } else if (fileType.startsWith("video/")) {
      mediaType = "video";
    } else if (fileType.startsWith("audio/")) {
      mediaType = "audio";
    } else if (
      fileType.startsWith("text/") ||
      fileType.includes("json") ||
      fileType.includes("xml")
    ) {
      mediaType = "text";
    } else {
      mediaType = "document";
    }

    return {
      url,
      filename,
      size: file.size,
      width: mediaType === "image" ? 0 : null,
      height: mediaType === "image" ? 0 : null,
      ...(mediaType === "video" ? { duration: 0 } : {}),
      type: mediaType,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}
