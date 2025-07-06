export const STORAGE_LIMITS = {
  PREMIUM: Number.MAX_SAFE_INTEGER,
  FREE: 1024 * 1024 * 1024,
};

export const FILE_SIZE_LIMITS = {
  PREMIUM: 500 * 1024 * 1024,
  FREE: 100 * 1024 * 1024,
};

export const BLOCKED_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-msdos-program',
  'application/x-msi',
  'application/x-ms-installer',
  'application/x-msbatch',

  'application/x-dex',
  'application/x-elf',
  'application/x-sharedlib',
  'application/x-object',
];

interface StorageStats {
  used: string;
  total: string;
  percentage: string;
  remaining: string;
}

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  duration?: number | null;
  type: 'image' | 'video' | 'text' | 'document' | 'audio' | 'other';
}

export function formatFileSize(bytes: number): string {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes < KB) {
    return `${Math.round(bytes)} B`;
  } else if (bytes < MB) {
    return `${Math.round((bytes / KB) * 10) / 10} KB`;
  } else if (bytes < GB) {
    return `${Math.round((bytes / MB) * 10) / 10} MB`;
  } else {
    return `${Math.round((bytes / GB) * 10) / 10} GB`;
  }
}

export function getStorageStats(
  used: number,
  isPremium: boolean,
  isAdmin: boolean = false
): StorageStats {
  const limit = isAdmin
    ? Number.MAX_SAFE_INTEGER
    : isPremium
      ? STORAGE_LIMITS.PREMIUM
      : STORAGE_LIMITS.FREE;

  const percentage = isAdmin ? 0 : Math.round((used / limit) * 100);

  return {
    used: formatFileSize(used),
    total: isAdmin ? 'Unlimited' : formatFileSize(limit),
    percentage: isAdmin ? '0%' : `${Math.min(percentage, 100)}%`,
    remaining: isAdmin
      ? 'Unlimited'
      : formatFileSize(Math.max(0, limit - used)),
  };
}

export async function uploadFile(
  file: Blob,
  userId: string,
  filename: string,
  fileId: string,
  type?: 'avatar' | 'banner'
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);
    formData.append('filename', filename);
    formData.append('userId', userId);
    if (type) {
      formData.append('type', type);
    }

    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXTAUTH_URL;
    const url = `${baseUrl}/api/upload/storage`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Upload failed:', await response.text());
      throw new Error('Failed to upload file');
    }

    const result = await response.json();

    let fileType: UploadResult['type'];
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else if (
      file.type.startsWith('text/') ||
      file.type.includes('json') ||
      file.type.includes('xml')
    ) {
      fileType = 'text';
    } else {
      fileType = 'document';
    }

    if (BLOCKED_TYPES.includes(file.type)) {
      throw new Error('File type is not allowed');
    }

    return {
      url: result.url,
      filename: result.filename,
      size: result.size,
      width: fileType === 'image' ? 0 : null,
      height: fileType === 'image' ? 0 : null,
      ...(fileType === 'video' ? { duration: 0 } : {}),
      type: fileType,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}
