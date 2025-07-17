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

export class ArchiveProcessor {
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
