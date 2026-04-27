function normalizeDomain(domain: string) {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

export function generateShareXConfig(apiKey: string, apiBaseUrl: string, customDomain?: string) {
  const normalizedCustomDomain = customDomain ? normalizeDomain(customDomain) : null;

  return {
    Version: "17.0.0",
    Name: "AnonHost",
    DestinationType: "ImageUploader",
    RequestMethod: "POST",
    RequestURL: `${apiBaseUrl}/api/media`,
    Headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    Body: "MultipartFormData",
    FileFormName: "file",
    Arguments: {
      conversionEnabled: "false",
      conversionFormat: "",
      ...(normalizedCustomDomain ? { domain: normalizedCustomDomain } : {}),
    },
    URL: normalizedCustomDomain ? `https://${normalizedCustomDomain}/{json:id}` : "{json:url}",
    ThumbnailURL: normalizedCustomDomain
      ? `https://${normalizedCustomDomain}/{json:id}`
      : "{json:url}",
    DeletionURL: `${apiBaseUrl}/api/media/{json:id}`,
    ErrorMessage: "{json:error}",
  };
}

export function generateDirectUploadPowerShellScript(apiKey: string, apiBaseUrl: string) {
  const escapedApiKey = apiKey.replace(/'/g, "''");
  const escapedApiBaseUrl = apiBaseUrl.replace(/'/g, "''");

  return `param(
  [Parameter(Mandatory = $true)]
  [string]$FilePath,
  [switch]$Public,
  [switch]$DisableEmbed,
  [string]$Domain = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $FilePath)) {
  throw "File not found: $FilePath"
}

$file = Get-Item -LiteralPath $FilePath
$apiBase = '${escapedApiBaseUrl}'
$apiKey = '${escapedApiKey}'
$headers = @{ Authorization = "Bearer $apiKey"; "Content-Type" = "application/json" }

$initBody = @{
  action = "direct-init"
  fileName = $file.Name
  fileSize = [int64]$file.Length
  contentType = "application/octet-stream"
} | ConvertTo-Json

$init = Invoke-RestMethod -Uri "$apiBase/api/media" -Method Post -Headers $headers -Body $initBody

$putHeaders = @{ "Content-Type" = "application/octet-stream" }
Invoke-WebRequest -Uri $init.data.uploadUrl -Method Put -Headers $putHeaders -InFile $FilePath | Out-Null

$finalizeBody = @{
  action = "direct-finalize"
  imageId = $init.data.imageId
  objectKey = $init.data.objectKey
  public = [bool]$Public
  disableEmbed = [bool]$DisableEmbed
  domain = if ([string]::IsNullOrWhiteSpace($Domain)) { $null } else { $Domain }
} | ConvertTo-Json

$final = Invoke-RestMethod -Uri "$apiBase/api/media" -Method Post -Headers $headers -Body $finalizeBody
$final.data.url
`;
}

export function generateShareXShortenerConfig(
  apiKey: string,
  baseUrl: string,
  customDomain?: string,
) {
  const normalizedCustomDomain = customDomain ? normalizeDomain(customDomain) : null;

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
    URL: normalizedCustomDomain
      ? `https://${normalizedCustomDomain}/s/{json:id}`
      : "{json:shortUrl}",
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
