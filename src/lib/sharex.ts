export function generateShareXConfig(apiKey: string, baseUrl: string) {
  return {
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
    Arguments: {
      settings: JSON.stringify({
        conversion: {
          enabled: false,
          format: null,
        },
      }),
    },
    URL: "{json:url}",
    ThumbnailURL: "{json:url}",
    DeletionURL: `${baseUrl}/api/media/{json:id}`,
    ErrorMessage: "$json:error$",
  };
}

export function generateShareXShortenerConfig(apiKey: string, baseUrl: string) {
  return {
    Version: "17.0.0",
    Name: "AnonHost Shortener",
    DestinationType: "URLShortener",
    RequestMethod: "POST",
    RequestURL: `${baseUrl}/api/shortener`,
    Headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    Body: "JSON",
    Data: '{"originalUrl":"{input}"}',
    URL: "{json:shortUrl}",
    DeletionURL: `${baseUrl}/api/shortener/{json:id}`,
    ErrorMessage: "$json:error$",
  };
}

export const downloadShareXConfig = (config: object, apiKeyName: string) => {
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
