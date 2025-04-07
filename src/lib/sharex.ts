import { ShareXConfig } from "@/types/settings";

export const generateShareXConfig = (
  apiKey: string,
  baseUrl: string,
): ShareXConfig => ({
  Version: "17.0.0",
  Name: "AnonHost",
  DestinationType: "ImageUploader",
  RequestMethod: "POST",
  RequestURL: `${baseUrl}/api/upload`,
  Headers: {
    Authorization: `Bearer ${apiKey}`,
  },
  Body: "MultipartFormData",
  FileFormName: "file",
  URL: "{json:url}",
  ThumbnailURL: "{json:url}",
  ErrorMessage: "$json:error$",
  Data: {},
});

export const generateShareXShortenerConfig = (
  apiKey: string,
  baseUrl: string,
): ShareXConfig => ({
  Version: "17.0.0",
  Name: "AnonHost Shortener",
  DestinationType: "URLShortener",
  RequestMethod: "POST",
  RequestURL: `${baseUrl}/api/shortener`,
  Headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  Body: "JSON",
  Data: {
    "originalUrl": "{input}"
  },
  URL: "{json:shortUrl}",
  ErrorMessage: "{json:error}"
});

export const downloadShareXConfig = (
  config: ShareXConfig,
  apiKeyName: string,
) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `anonhost-${apiKeyName.toLowerCase().replace(/\s+/g, "-")}.sxcu`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
