export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface Settings {
  enableNotifications: boolean;
  enableDirectLinks: boolean;
  customDomain: string;
  makeImagesPublic?: boolean;
}

export interface ShareXConfig {
  Version: string;
  Name: string;
  DestinationType: string;
  RequestMethod: string;
  RequestURL: string;
  Headers: {
    Authorization: string;
    "Content-Type"?: string;
  };
  Body: string;
  FileFormName?: string;
  Data: string | { [key: string]: unknown };
  URL: string;
  ThumbnailURL?: string;
  RegexList?: string[];
  ErrorMessage: string;
}
