export interface FileSettings {
  public: boolean;
  domain?: string | null;
  stripMetadata: boolean;
  optimizeForWeb: boolean;
  compression: {
    enabled: boolean;
    quality: number;
  };
  conversion: {
    enabled: boolean;
    format?: 'gif' | 'mp4' | 'webp' | 'webm' | 'png' | 'jpeg';
  };
  resize: {
    enabled: boolean;
    width?: number;
    height?: number;
    maintainAspectRatio: boolean;
    fit: 'inside' | 'cover' | 'contain';
  };
}
