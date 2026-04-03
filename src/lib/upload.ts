export const STORAGE_LIMITS = {
  PREMIUM: Number.MAX_SAFE_INTEGER,
  FREE: 1024 * 1024 * 1024,
};

export const FILE_SIZE_LIMITS = {
  PREMIUM: 100 * 1024 * 1024,
  FREE: 100 * 1024 * 1024,
};

export const BLOCKED_TYPES = [
  "application/x-msdownload",
  "application/x-executable",
  "application/x-msdos-program",
  "application/x-msi",
  "application/x-ms-installer",
  "application/x-msbatch",

  "application/x-dex",
  "application/x-elf",
  "application/x-sharedlib",
  "application/x-object",
];

interface StorageStats {
  used: string;
  total: string;
  percentage: string;
  remaining: string;
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
  isAdmin: boolean = false,
): StorageStats {
  const limit = isAdmin
    ? Number.MAX_SAFE_INTEGER
    : isPremium
      ? STORAGE_LIMITS.PREMIUM
      : STORAGE_LIMITS.FREE;

  const percentage = isAdmin ? 0 : Math.round((used / limit) * 100);

  return {
    used: formatFileSize(used),
    total: isAdmin ? "Unlimited" : formatFileSize(limit),
    percentage: isAdmin ? "0%" : `${Math.min(percentage, 100)}%`,
    remaining: isAdmin ? "Unlimited" : formatFileSize(Math.max(0, limit - used)),
  };
}
