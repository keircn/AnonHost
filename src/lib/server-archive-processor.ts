import JSZip from "jszip";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import { constants } from "fs";
import { access, chmod, mkdtemp, rm, writeFile } from "fs/promises";
import { path7za } from "7zip-bin";
import { join } from "path";
import { tmpdir } from "os";
import tar from "tar-stream";
import { Readable } from "stream";
import { promisify } from "util";
import { gunzipSync } from "zlib";

const execFileAsync = promisify(execFile);

interface ArchiveEntry {
  name: string;
  size: number;
  isDirectory: boolean;
  compressedSize?: number;
  lastModified?: Date;
  crc32?: number;
}

interface ArchiveMetadata {
  totalFiles: number;
  totalDirectories: number;
  uncompressedSize: number;
  compressedSize: number;
  entries: ArchiveEntry[];
  archiveType: string;
  hasPassword?: boolean;
}

type ArchiveType =
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

const PREVIEWABLE_ARCHIVE_TYPES = new Set<ArchiveType>(["zip", "tar", "tar.gz", "tgz", "7z"]);

function getBundled7zaFallbackPath(): string {
  const platformDir =
    process.platform === "darwin" ? "mac" : process.platform === "win32" ? "win" : "linux";
  const executable = process.platform === "win32" ? "7za.exe" : "7za";

  return join(process.cwd(), "node_modules", "7zip-bin", platformDir, process.arch, executable);
}

async function commandExists(command: string): Promise<boolean> {
  if (command.includes("/") || command.includes("\\")) {
    try {
      await access(command, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  return true;
}

async function ensureExecutable(command: string): Promise<void> {
  if (!command.includes("/") && !command.includes("\\")) {
    return;
  }

  try {
    await access(command, constants.X_OK);
  } catch {
    try {
      await chmod(command, 0o755);
    } catch {}
  }
}

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
      case "7z":
        return this.process7z(buffer);
      default:
        throw new Error(`Archive preview is not supported for ${archiveType} files`);
    }
  }

  private static parse7zEntries(output: string): ArchiveEntry[] {
    const entries: ArchiveEntry[] = [];
    const lines = output.split(/\r?\n/);
    let current: Record<string, string> | null = null;

    const flush = () => {
      if (!current) {
        return;
      }

      const name = current.Path;

      if (!name) {
        current = null;
        return;
      }

      const isDirectory =
        current.Folder === "+" || current.Attributes?.toUpperCase().includes("D") === true;
      const rawSize = Number.parseInt(current.Size || "0", 10);
      const rawCompressedSize = Number.parseInt(current["Packed Size"] || "0", 10);
      const modified = current.Modified ? new Date(current.Modified) : undefined;

      entries.push({
        name: name.replace(/\\/g, "/"),
        size: Number.isNaN(rawSize) ? 0 : rawSize,
        isDirectory,
        compressedSize:
          !isDirectory && !Number.isNaN(rawCompressedSize) ? rawCompressedSize : undefined,
        lastModified: modified && !Number.isNaN(modified.getTime()) ? modified : undefined,
      });

      current = null;
    };

    for (const line of lines) {
      if (!line.trim()) {
        flush();
        continue;
      }

      const delimiter = line.indexOf(" = ");

      if (delimiter === -1) {
        continue;
      }

      const key = line.slice(0, delimiter).trim();
      const value = line.slice(delimiter + 3).trim();

      if (key === "Path") {
        flush();
        current = { Path: value };
        continue;
      }

      if (!current) {
        continue;
      }

      current[key] = value;
    }

    flush();

    return entries;
  }

  private static async process7z(buffer: Buffer): Promise<ArchiveMetadata> {
    const tempDir = await mkdtemp(join(tmpdir(), "anonhost-archive-"));
    const archivePath = join(tempDir, `${randomUUID()}.7z`);

    try {
      await writeFile(archivePath, buffer);

      const commands = [
        process.env.SEVEN_ZIP_BINARY?.trim(),
        path7za,
        getBundled7zaFallbackPath(),
        "7z",
        "7za",
      ].filter((value): value is string => Boolean(value));

      let stdout = "";
      let lastError: unknown = null;

      for (const command of commands) {
        if (!(await commandExists(command))) {
          continue;
        }

        await ensureExecutable(command);

        try {
          const result = await execFileAsync(command, ["l", "-slt", "-ba", "-p", archivePath], {
            timeout: 10000,
            maxBuffer: 20 * 1024 * 1024,
          });
          stdout = result.stdout;
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          const code = (error as { code?: string }).code;

          if (code === "ENOENT" || code === "EACCES") {
            continue;
          }

          throw new Error(`7z command failed (${command}): ${error}`);
        }
      }

      if (!stdout) {
        throw new Error(
          `No usable 7z binary found (tried ${commands.join(", ")}). Last error: ${String(lastError)}`,
        );
      }

      const entries = this.parse7zEntries(stdout);
      let totalFiles = 0;
      let totalDirectories = 0;
      let uncompressedSize = 0;

      for (const entry of entries) {
        if (entry.isDirectory) {
          totalDirectories++;
        } else {
          totalFiles++;
          uncompressedSize += entry.size;
        }
      }

      return {
        totalFiles,
        totalDirectories,
        uncompressedSize,
        compressedSize: buffer.length,
        entries,
        archiveType: "7z",
      };
    } catch (error) {
      throw new Error(`Failed to process 7z archive: ${error}`);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
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
