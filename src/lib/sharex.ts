function normalizeDomain(domain: string) {
  return domain
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

export function generateShareXConfig(
  apiKey: string,
  apiBaseUrl: string,
  customDomain?: string
) {
  const normalizedCustomDomain = customDomain
    ? normalizeDomain(customDomain)
    : null;

  return {
    Version: '17.0.0',
    Name: 'AnonHost',
    DestinationType: 'ImageUploader',
    RequestMethod: 'POST',
    RequestURL: `${apiBaseUrl}/api/media`,
    Headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    Body: 'MultipartFormData',
    FileFormName: 'file',
    Arguments: {
      conversionEnabled: 'false',
      conversionFormat: '',
      ...(normalizedCustomDomain ? { domain: normalizedCustomDomain } : {}),
    },
    URL: normalizedCustomDomain
      ? `https://${normalizedCustomDomain}/{json:id}`
      : '{json:url}',
    ThumbnailURL: normalizedCustomDomain
      ? `https://${normalizedCustomDomain}/{json:id}`
      : '{json:url}',
    DeletionURL: `${apiBaseUrl}/api/media/{json:id}`,
    ErrorMessage: '{json:error}',
  };
}

export function generateShareXShortenerConfig(apiKey: string, baseUrl: string) {
  return {
    Version: '17.0.0',
    Name: 'AnonHost Shortener',
    DestinationType: 'URLShortener',
    RequestMethod: 'POST',
    RequestURL: `${baseUrl}/api/shortener`,
    Headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    Body: 'JSON',
    Data: '{"originalUrl":"{input}"}',
    URL: '{json:shortUrl}',
    DeletionURL: `${baseUrl}/api/shortener/{json:id}`,
    ErrorMessage: '$json:error$',
  };
}

export const downloadShareXConfig = (config: object, apiKeyName: string) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anonhost-${apiKeyName.toLowerCase().replace(/\s+/g, '-')}.sxcu`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
