# Prepares installer\payload from the repo artifacts before compiling the .iss
# Run from repo root or installer\:
#   powershell -File installer\scripts\prepare-payload.ps1

param(
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

$InstallerRoot = Split-Path $PSScriptRoot -Parent
$RepoRoot = Split-Path $InstallerRoot -Parent

# Allow running from artifacts layout: artifacts/installer + artifacts/infrastructure
if (-not (Test-Path (Join-Path $RepoRoot "infrastructure"))) {
    if (Test-Path (Join-Path $RepoRoot "artifacts\infrastructure")) {
        $RepoRoot = Join-Path $RepoRoot "artifacts"
    }
}

$InfraSrc = Join-Path $RepoRoot "infrastructure"
$Payload = if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    Join-Path $InstallerRoot "payload"
} else {
    [System.IO.Path]::GetFullPath($OutputRoot)
}
if (-not [string]::IsNullOrWhiteSpace($OutputRoot)) {
    $repoPrefix = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    if ($Payload.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
        $Payload -eq [System.IO.Path]::GetFullPath($RepoRoot)) {
        throw "OutputRoot must be outside the repository so staging cannot overwrite tracked payload files."
    }
}
$PlatformDest = Join-Path $Payload "platform"
$DocsDest = Join-Path $Payload "documentation"
$BrandingDest = Join-Path $Payload "branding"

Write-Host "Installer root: $InstallerRoot"
Write-Host "Infrastructure: $InfraSrc"

if (-not (Test-Path $InfraSrc)) {
    Write-Error "infrastructure folder not found at $InfraSrc"
}

New-Item -ItemType Directory -Force -Path $PlatformDest, $DocsDest, $BrandingDest | Out-Null

# Copy compose stack (exclude heavy/runtime-only paths if any)
$copyItems = @(
    "docker-compose.yml",
    ".env.example",
    "README.md",
    "nginx",
    "redis",
    "postgres",
    "scripts"
)

foreach ($item in $copyItems) {
    $src = Join-Path $InfraSrc $item
    $dst = Join-Path $PlatformDest $item
    if (Test-Path $src) {
        if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
        Copy-Item $src $dst -Recurse -Force
        Write-Host "  + platform\$item"
    } else {
        Write-Warning "Missing: $src"
    }
}

# Backend README into documentation
$BackendReadme = Join-Path $RepoRoot "backend\README.md"
if (Test-Path $BackendReadme) {
    Copy-Item $BackendReadme (Join-Path $DocsDest "BACKEND.md") -Force
    Write-Host "  + documentation\BACKEND.md"
}

# Placeholder branding if empty
$IconPlaceholder = Join-Path $BrandingDest "README.txt"
if (-not (Test-Path (Join-Path $BrandingDest "acing-iu-icon.ico"))) {
    @"
Place acing-iu-icon.ico and optional acing-iu-branding.png here before release builds.
The Inno script references branding\acing-iu-icon.ico for the uninstaller icon.
"@ | Set-Content $IconPlaceholder -Encoding UTF8
}

Write-Host ""
Write-Host "Payload ready. Compile with:"
Write-Host "  ISCC.exe `"$InstallerRoot\Acing-IU-Genesis.iss`""
Write-Host "Output: $InstallerRoot\output\"

# Also copy backend sources so Docker build works from installed platform\
$BackendSrc = Join-Path $RepoRoot "backend"
$BackendDest = Join-Path $PlatformDest "backend"
if (Test-Path $BackendSrc) {
    if (Test-Path $BackendDest) { Remove-Item $BackendDest -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $BackendDest | Out-Null
    Copy-Item (Join-Path $BackendSrc "Identity") $BackendDest -Recurse -Force
    Copy-Item (Join-Path $BackendSrc "DeviceTrust") $BackendDest -Recurse -Force
    Copy-Item (Join-Path $BackendSrc "SharedKernel") $BackendDest -Recurse -Force
    Write-Host "  + platform\backend\Identity, DeviceTrust, SharedKernel"
}

# Keep host build artifacts and local configuration out of the installer build context.
$DockerIgnoreSrc = Join-Path $RepoRoot ".dockerignore"
if (Test-Path $DockerIgnoreSrc) {
    Copy-Item $DockerIgnoreSrc (Join-Path $PlatformDest ".dockerignore") -Force
    Write-Host "  + platform\.dockerignore"
}

# Point staged builds at the prepared platform root so both project references
# remain inside the payload and the repository Dockerfiles' COPY paths work.
$ComposeFile = Join-Path $PlatformDest "docker-compose.yml"
if (Test-Path $ComposeFile) {
    $c = Get-Content $ComposeFile -Raw
    $c = $c -replace '(?m)(context:\s*)\.\.(\s*)$', '$1.$2'
    $c = $c.TrimEnd([char[]]"`r`n") + [Environment]::NewLine
    Set-Content $ComposeFile -Value $c -NoNewline -Encoding UTF8
    Write-Host "  ~ docker-compose.yml build contexts adjusted for staged payload"
}
