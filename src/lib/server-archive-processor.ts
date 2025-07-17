import JSZip from 'jszip';
import tar from 'tar-stream';
import { Readable } from 'stream';

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

export class ServerArchiveProcessor {
  static async processArchive(
    buffer: Buffer,
    filename: string
  ): Promise<ArchiveMetadata> {
    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'zip':
        return this.processZip(buffer);
      case 'tar':
      case 'tar.gz':
      case 'tgz':
      case 'tar.bz2':
      case 'tbz2':
        return this.processTar(buffer);
      case '7z':
        return this.process7z(buffer);
      case 'rar':
        return this.processRar(buffer);
      default:
        throw new Error(`Unsupported archive format: ${extension}`);
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
        const entry: ArchiveEntry = {
          name: relativePath,
          size: 0,
          isDirectory: file.dir,
          lastModified: file.date || undefined,
        };

        archiveEntries.push(entry);

        if (file.dir) {
          totalDirectories++;
        } else {
          totalFiles++;
        }
      });

      return {
        totalFiles,
        totalDirectories,
        uncompressedSize,
        compressedSize: buffer.length,
        entries: archiveEntries,
        archiveType: 'zip',
      };
    } catch (error) {
      throw new Error(`Failed to process ZIP archive: ${error}`);
    }
  }

  private static async processTar(buffer: Buffer): Promise<ArchiveMetadata> {
    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      const entries: ArchiveEntry[] = [];
      let totalFiles = 0;
      let totalDirectories = 0;
      let uncompressedSize = 0;

      extract.on('entry', (header, stream, next) => {
        const entry: ArchiveEntry = {
          name: header.name,
          size: header.size || 0,
          isDirectory: header.type === 'directory',
          lastModified: header.mtime,
        };

        entries.push(entry);

        if (entry.isDirectory) {
          totalDirectories++;
        } else {
          totalFiles++;
          uncompressedSize += entry.size;
        }

        stream.on('end', next);
        stream.resume();
      });

      extract.on('finish', () => {
        resolve({
          totalFiles,
          totalDirectories,
          uncompressedSize,
          compressedSize: buffer.length,
          entries,
          archiveType: 'tar',
        });
      });

      extract.on('error', reject);

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(extract);
    });
  }

  private static async process7z(buffer: Buffer): Promise<ArchiveMetadata> {
    let estimatedFiles = 0;
    let estimatedDirectories = 0;

    if (
      buffer.length > 6 &&
      buffer[0] === 0x37 &&
      buffer[1] === 0x7a &&
      buffer[2] === 0xbc &&
      buffer[3] === 0xaf &&
      buffer[4] === 0x27 &&
      buffer[5] === 0x1c
    ) {
      estimatedFiles = 1;
    }

    return {
      totalFiles: estimatedFiles,
      totalDirectories: estimatedDirectories,
      uncompressedSize: 0,
      compressedSize: buffer.length,
      entries:
        estimatedFiles > 0
          ? [
              {
                name: '(7z archive contents - detailed listing not available)',
                size: 0,
                isDirectory: false,
                lastModified: undefined,
              },
            ]
          : [],
      archiveType: '7z',
      hasPassword: undefined,
    };
  }

  private static async processRar(buffer: Buffer): Promise<ArchiveMetadata> {
    let estimatedFiles = 0;

    if (
      buffer.length > 4 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x61 &&
      buffer[2] === 0x72 &&
      buffer[3] === 0x21
    ) {
      estimatedFiles = 1;
    }

    return {
      totalFiles: estimatedFiles,
      totalDirectories: 0,
      uncompressedSize: 0,
      compressedSize: buffer.length,
      entries:
        estimatedFiles > 0
          ? [
              {
                name: '(RAR archive contents - detailed listing not available)',
                size: 0,
                isDirectory: false,
                lastModified: undefined,
              },
            ]
          : [],
      archiveType: 'rar',
      hasPassword: undefined,
    };
  }

  static getArchiveType(filename: string): string | null {
    const extension = filename.toLowerCase().split('.').pop();
    const supportedTypes = [
      'zip',
      'tar',
      '7z',
      'rar',
      'gz',
      'bz2',
      'tgz',
      'tbz2',
    ];

    if (filename.toLowerCase().endsWith('.tar.gz')) return 'tar.gz';
    if (filename.toLowerCase().endsWith('.tar.bz2')) return 'tar.bz2';

    return supportedTypes.includes(extension || '') ? extension || null : null;
  }

  static isArchive(filename: string): boolean {
    return this.getArchiveType(filename) !== null;
  }
}
