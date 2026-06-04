$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ImageDir = "E:\程序\2k4k\网站图片"
$Manifest = "E:\程序\2k4k\image_manifest.jsonl"
$ArchiveRoot = "E:\程序\2k4k\已上传归档\aiwallpaperprompts"
$Count = 20
$SiteUrl = "https://www.aiwallpaperprompts.com"
$CanonicalDomain = "www.aiwallpaperprompts.com"

function Write-Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Load-PrivateEnv($Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line.Split("=", 2)
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')
    if ($name) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

function Require-Env($Name) {
  $value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing required environment variable: $Name. Put it in .env.r2.local or set it before running this script."
  }
}

function Assert-In-Directory($Path, $Root) {
  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  $resolvedRoot = [System.IO.Path]::GetFullPath($Root)
  if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to move path outside archive root: $resolvedPath"
  }
}

Set-Location -LiteralPath $ProjectRoot

Write-Step "Load private R2 environment"
Load-PrivateEnv (Join-Path $ProjectRoot ".env.r2.local")
Load-PrivateEnv (Join-Path $ProjectRoot ".env.local")

@(
  "R2_ACCOUNT_ID",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL"
) | ForEach-Object { Require-Env $_ }

if (-not (Test-Path -LiteralPath $ImageDir)) {
  throw "Image directory not found: $ImageDir"
}

if (-not (Test-Path -LiteralPath $Manifest)) {
  throw "Manifest not found: $Manifest"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BatchDir = Join-Path $ProjectRoot "data\private\upload-batches\batch-$stamp"
$ArchiveDir = Join-Path $ArchiveRoot (Join-Path (Get-Date -Format "yyyy-MM-dd") "batch-$stamp")

Write-Step "Select $Count images by current resolution ratio"
node "scripts\select-upload-batch.mjs" $ImageDir $BatchDir $Count
$SelectionPath = Join-Path $BatchDir "selected-upload-batch.json"
$Selection = Get-Content -LiteralPath $SelectionPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ([int]$Selection.selected -ne $Count) {
  throw "Selected $($Selection.selected) images, expected $Count."
}
$BatchManifest = Join-Path $BatchDir "selected-manifest.jsonl"
node "scripts\filter-manifest-for-batch.mjs" $Manifest $SelectionPath $BatchManifest

Write-Step "Upload selected batch to R2 and update gallery data"
$UploadRaw = npm run daily:gallery -- $BatchManifest $BatchDir
$UploadRaw | Write-Host
$JsonStart = ($UploadRaw | Select-String -Pattern "^\{" | Select-Object -First 1).LineNumber
if (-not $JsonStart) {
  throw "Could not find JSON output from daily:gallery."
}
$UploadJson = ($UploadRaw[($JsonStart - 1)..($UploadRaw.Count - 1)] -join "`n") | ConvertFrom-Json
if ([int]$UploadJson.added -ne $Count) {
  throw "Upload added $($UploadJson.added), expected $Count. Stop before archive."
}
if ([int]$UploadJson.missing -ne 0) {
  throw "Selected batch reported missing files. Stop before archive."
}

Write-Step "Build site"
npm run build

Write-Step "Deploy to Vercel production"
$DeployOutput = npm exec vercel -- deploy --prod --yes
$DeployOutput | Write-Host
$DeploymentUrl = ($DeployOutput | Select-String -Pattern "https://[^\s]+\.vercel\.app" | Select-Object -Last 1).Matches.Value
if (-not $DeploymentUrl) {
  throw "Could not detect Vercel deployment URL."
}

Write-Step "Alias latest deployment to canonical www domain"
npm exec vercel -- alias set $DeploymentUrl $CanonicalDomain

Write-Step "Smoke check production site"
$env:BASE_URL = $SiteUrl
npm run smoke

Write-Step "Archive only this selected batch"
Assert-In-Directory $ArchiveDir $ArchiveRoot
New-Item -ItemType Directory -Path $ArchiveDir -Force | Out-Null

foreach ($item in $Selection.files) {
  $source = Join-Path $ImageDir $item.file
  $target = Join-Path $ArchiveDir $item.file
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Selected file disappeared before archive: $source"
  }
  Move-Item -LiteralPath $source -Destination $target
}

Copy-Item -LiteralPath $SelectionPath -Destination (Join-Path $ArchiveDir "selected-upload-batch.json")

Write-Step "Done"
Write-Host "Uploaded and archived $Count images."
Write-Host "Archive: $ArchiveDir"
