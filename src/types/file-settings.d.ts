export interface FileSettings {
  public: boolean;
  domain?: string | null;
  compression: {
    enabled: boolean;
    quality: number;
  };
  conversion: {
    enabled: boolean;
    format?: 'gif' | 'mp4' | 'webp' | 'webm';
  };
  resize: {
    enabled: boolean;
    width?: number;
    height?: number;
    maintainAspectRatio: boolean;
  };
}
