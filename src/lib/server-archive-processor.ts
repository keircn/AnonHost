import JSZip from "jszip";
import tar from "tar-stream";
import { Readable } from "stream";
import { gunzipSync } from "zlib";

export interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
  compressedSize?: number;
  lastModified?: Date;
  crc32?: number;
}

export interface ArchiveMetadata {
  totalFiles: number;
  totalDirectories: number;
  uncompressedSize: number;
  compressedSize: number;
  entries: ArchiveEntry[];
  archiveType: string;
  hasPassword?: boolean;
}

export type ArchiveType =
  | "zip"
  | "tar"
  | "tar.gz"
  | "tgz"
  | "tar.bz2"
  | "tbz2"
  | "7z"
  | "rar"
  | "gz"
  | "bz2";

const PREVIEWABLE_ARCHIVE_TYPES = new Set<ArchiveType>(["zip", "tar", "tar.gz", "tgz"]);

export class ServerArchiveProcessor {
  static async processArchive(buffer: Buffer, filename: string): Promise<ArchiveMetadata> {
    const archiveType = this.getArchiveType(filename);

    if (!archiveType) {
      throw new Error("Unsupported archive format");
    }

    switch (archiveType) {
      case "zip":
        return this.processZip(buffer);
      case "tar":
      case "tar.gz":
      case "tgz":
        return this.processTar(buffer, archiveType);
      default:
        throw new Error(`Archive preview is not supported for ${archiveType} files`);
    }
  }

  private static async processZip(buffer: Buffer): Promise<ArchiveMetadata> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const archiveEntries: ArchiveEntry[] = [];
      let totalFiles = 0;
      let totalDirectories = 0;
      let uncompressedSize = 0;

      zip.forEach((relativePath, file) => {
        const zipData = (file as unknown as { _data?: unknown })._data as
          | {
              uncompressedSize?: number;
              compressedSize?: number;
              crc32?: number;
            }
          | undefined;

        const entry: ArchiveEntry = {
          name: relativePath,
          size: file.dir ? 0 : (zipData?.uncompressedSize ?? 0),
          isDirectory: file.dir,
          compressedSize: file.dir ? undefined : zipData?.compressedSize,
          crc32: file.dir ? undefined : zipData?.crc32,
          lastModified: file.date || undefined,
        };

        archiveEntries.push(entry);

        if (file.dir) {
          totalDirectories++;
        } else {
          totalFiles++;
          uncompressedSize += entry.size;
        }
      });

      return {
        totalFiles,
        totalDirectories,
        uncompressedSize,
        compressedSize: buffer.length,
        entries: archiveEntries,
        archiveType: "zip",
      };
    } catch (error) {
      throw new Error(`Failed to process ZIP archive: ${error}`);
    }
  }

  private static async processTar(
    buffer: Buffer,
    archiveType: "tar" | "tar.gz" | "tgz",
  ): Promise<ArchiveMetadata> {
    const tarBuffer = archiveType === "tar" ? buffer : Buffer.from(gunzipSync(buffer));

    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      const entries: ArchiveEntry[] = [];
      let totalFiles = 0;
      let totalDirectories = 0;
      let uncompressedSize = 0;

      extract.on("entry", (header, stream, next) => {
        const entry: ArchiveEntry = {
          name: header.name,
          size: header.size || 0,
          isDirectory: header.type === "directory",
          lastModified: header.mtime,
        };

        entries.push(entry);

        if (entry.isDirectory) {
          totalDirectories++;
        } else {
          totalFiles++;
          uncompressedSize += entry.size;
        }

        stream.on("end", next);
        stream.resume();
      });

      extract.on("finish", () => {
        resolve({
          totalFiles,
          totalDirectories,
          uncompressedSize,
          compressedSize: buffer.length,
          entries,
          archiveType,
        });
      });

      extract.on("error", reject);

      const readable = new Readable();
      readable.push(tarBuffer);
      readable.push(null);
      readable.pipe(extract);
    });
  }

  static getArchiveType(filename: string): ArchiveType | null {
    const lower = filename.toLowerCase();

    if (lower.endsWith(".tar.gz")) return "tar.gz";
    if (lower.endsWith(".tar.bz2")) return "tar.bz2";

    const extension = lower.split(".").pop() as ArchiveType | undefined;
    const supportedTypes: ArchiveType[] = ["zip", "tar", "7z", "rar", "gz", "bz2", "tgz", "tbz2"];

    return extension && supportedTypes.includes(extension) ? extension : null;
  }

  static supportsPreview(filename: string): boolean {
    const archiveType = this.getArchiveType(filename);
    return archiveType ? PREVIEWABLE_ARCHIVE_TYPES.has(archiveType) : false;
  }
}
