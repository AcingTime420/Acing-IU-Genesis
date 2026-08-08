#Requires -Version 5.1
<#
.SYNOPSIS
    Clean-clone reproducibility baseline for Acing IU: Genesis (PowerShell wrapper).

.DESCRIPTION
    Cross-platform PowerShell companion to scripts/validate-premerge.sh.
    On Linux/macOS the shell script is preferred; this wrapper is provided for
    Windows contributors and environments where PowerShell 7+ is the primary
    shell.

    Exit codes:
        0 – all enabled checks passed
        1 – one or more checks failed

.PARAMETER SkipBuild
    Skip the Kotlin/Make build step.

.PARAMETER SkipCompose
    Skip the Docker Compose step.

.EXAMPLE
    pwsh scripts/validate-premerge.ps1
    pwsh scripts/validate-premerge.ps1 -SkipBuild
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipCompose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Helpers ───────────────────────────────────────────────────────────────
$Failures = 0

function Write-Step  { param([string]$Msg) Write-Host "`n==> $Msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$Msg) Write-Host "    v $Msg" -ForegroundColor Green }
function Write-Skip  { param([string]$Msg) Write-Host "    ~ SKIP: $Msg" -ForegroundColor Yellow }
function Write-Fail  {
    param([string]$Msg)
    Write-Host "    X FAIL: $Msg" -ForegroundColor Red
    $script:Failures++
}

# ── Repository root ───────────────────────────────────────────────────────
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot
Write-Step "Repository root: $RepoRoot"

# ── 1. No tracked generated artifacts ─────────────────────────────────────
Write-Step "1/5  Checking for tracked generated artifacts"

$ArtifactPrefixes = @('bin', 'obj', 'out', 'dist', 'TestResults', 'coverage', 'node_modules', '.next')
$ArtifactFound = $false

foreach ($prefix in $ArtifactPrefixes) {
    $tracked = & git ls-files -- $prefix 2>$null
    if ($tracked) {
        Write-Host "    Tracked generated files under '${prefix}/':" -ForegroundColor Red
        $tracked | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
        $ArtifactFound = $true
    }
}

if ($ArtifactFound) {
    Write-Fail "Generated artifacts found in version control. Remove them and update .gitignore."
} else {
    Write-Ok "No tracked generated artifacts detected."
}

# ── 2. .env baseline ───────────────────────────────────────────────────────
Write-Step "2/5  Environment file baseline"

if (Test-Path '.env.example') {
    if (-not (Test-Path '.env')) {
        Copy-Item '.env.example' '.env'
        Write-Ok "Created .env from .env.example"
    } else {
        Write-Ok ".env already present"
    }
} else {
    Write-Skip ".env.example not found — skipping env setup"
}

# ── 3. Build (Kotlin / Make) ───────────────────────────────────────────────
Write-Step "3/5  Build"

if ($SkipBuild) {
    Write-Skip "Build skipped via -SkipBuild"
} elseif ($IsLinux -or $IsMacOS) {
    if (Get-Command 'bash' -ErrorAction SilentlyContinue) {
        & bash scripts/validate-premerge.sh --skip-compose
        if ($LASTEXITCODE -ne 0) { Write-Fail "Shell validate-premerge.sh build step failed" }
        else { Write-Ok "Build via shell script succeeded" }
    } else {
        Write-Skip "bash not found — cannot run shell build wrapper"
    }
} else {
    if (Get-Command 'kotlinc' -ErrorAction SilentlyContinue) {
        Push-Location 'system\security\guardian\build'
        try {
            & make
            if ($LASTEXITCODE -ne 0) { Write-Fail "Guardian platform build failed" }
            else { Write-Ok "Guardian platform built successfully" }
        } finally { Pop-Location }
    } else {
        Write-Skip "kotlinc not found — skipping Kotlin compilation (install Kotlin to enable)"
    }
}

# ── 4. Docker Compose (conditional) ───────────────────────────────────────
Write-Step "4/5  Docker Compose"

if ($SkipCompose) {
    Write-Skip "Compose skipped via -SkipCompose"
} elseif ((Test-Path 'docker-compose.yml') -or (Test-Path 'compose.yaml')) {
    if (Get-Command 'docker' -ErrorAction SilentlyContinue) {
        & docker compose build
        if ($LASTEXITCODE -ne 0) { Write-Fail "Compose build failed" }
        else { Write-Ok "Compose build succeeded" }

        & docker compose up -d
        if ($LASTEXITCODE -ne 0) { Write-Fail "Compose up failed" }
        else { Write-Ok "Compose services started" }

        Start-Sleep 5

        & docker compose down
        if ($LASTEXITCODE -ne 0) { Write-Fail "Compose down failed" }
        else { Write-Ok "Compose services stopped cleanly" }
    } else {
        Write-Skip "docker not available — skipping Compose checks"
    }
} else {
    Write-Skip "No docker-compose.yml / compose.yaml found — container baseline is planned (see ARCHITECTURE.md)"
}

# ── 5. Readiness / health checks ──────────────────────────────────────────
Write-Step "5/5  Readiness / health checks"
Write-Skip "No HTTP endpoints configured yet — health checks are planned (see docs/adr/ADR-001)"

# ── Summary ───────────────────────────────────────────────────────────────
Write-Host ""
if ($Failures -eq 0) {
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "  All enabled checks PASSED."                  -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host "  $Failures check(s) FAILED. Review output above." -ForegroundColor Red
    Write-Host "==============================================" -ForegroundColor Red
    exit 1
}
