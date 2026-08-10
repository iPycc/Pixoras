param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [Parameter(Mandatory = $true)][string]$MetadataPath
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

try {
  if (-not $env:ARK_API_KEY) {
    throw "ARK_API_KEY is not configured"
  }
  $baseUrl = if ($env:ARK_BASE_URL) {
    $env:ARK_BASE_URL.TrimEnd('/')
  } else {
    "https://ark.cn-beijing.volces.com/api/v3"
  }
  $payload = [IO.File]::ReadAllText($InputPath, [Text.Encoding]::UTF8)
  $headers = @{ Authorization = "Bearer $($env:ARK_API_KEY)" }
  $response = Invoke-RestMethod `
    -Uri "$baseUrl/images/generations" `
    -Method Post `
    -Headers $headers `
    -ContentType "application/json; charset=utf-8" `
    -Body $payload `
    -TimeoutSec 180

  $encodedImage = $response.data[0].b64_json
  if ($encodedImage) {
    [IO.File]::WriteAllBytes($OutputPath, [Convert]::FromBase64String($encodedImage))
    $contentType = "image/png"
  } else {
    $imageUrl = $response.data[0].url
    if (-not $imageUrl) {
      throw "Ark did not return an image"
    }
    $curlOutput = & curl.exe `
      --silent `
      --show-error `
      --fail `
      --location `
      --max-time 90 `
      --output $OutputPath `
      $imageUrl 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to download Ark image: $curlOutput"
    }
    $contentType = "image/png"
  }

  @{
    content_type = $contentType
    model = if ($response.model) { $response.model } else { $env:ARK_IMAGE_MODEL }
  } | ConvertTo-Json -Compress | Set-Content `
    -LiteralPath $MetadataPath `
    -Encoding UTF8
} catch {
  $details = if ($_.ErrorDetails.Message) {
    $_.ErrorDetails.Message
  } else {
    $_.Exception.Message
  }
  [Console]::Error.WriteLine($details)
  exit 1
}
