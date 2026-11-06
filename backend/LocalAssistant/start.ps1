<#
.SYNOPSIS
Starts the Genesis local assistant with an already installed local Ollama model.
.DESCRIPTION
No downloads, cloud calls, secret creation, execution-policy changes, or administrator rights.
The script restores process environment variables when the server exits.
#>
[CmdletBinding()]
param([string]$Model = $env:GENESIS_MODEL, [ValidateRange(1024,65535)][int]$Port = 4318)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$previousModel = $env:GENESIS_MODEL
$previousPort = $env:GENESIS_PORT
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 24 or newer is required.' }
    $nodeVersion = & node --version
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v[0-9]+\.') { throw 'Unable to read the Node.js version.' }
    $nodeMajor = [int]($nodeVersion.TrimStart('v').Split('.')[0])
    if ($nodeMajor -lt 24) { throw 'Node.js 24 or newer is required.' }
    $catalog = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
    $localModels = @($catalog.models | Where-Object {
        $_.name -notmatch 'cloud' -and [long]$_.size -gt 0
    } | Select-Object -ExpandProperty name)
    if ($localModels.Count -eq 0) { throw 'No local models found. Install a model suitable for your hardware first; this script never downloads one.' }
    if ([string]::IsNullOrWhiteSpace($Model)) {
        Write-Host 'Installed models:'
        $localModels | ForEach-Object { Write-Host "  $_" }
        $Model = Read-Host 'Enter the exact installed model name to use'
    }
    if ($Model -notmatch '^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$' -or $Model -match 'cloud|https?:|\.\.') { throw 'Only installed local model names are allowed.' }
    if ($localModels -cnotcontains $Model) { throw 'The model must exactly match a name in the installed local catalog.' }
    $env:GENESIS_MODEL = $Model
    $env:GENESIS_PORT = [string]$Port
    Write-Host 'Genesis uses the loopback Ollama service only. No paid AI API is configured.'
    Write-Host 'Keep Ollama cloud features disabled. State is temporary and the prototype has no production identity.'
    & node (Join-Path $PSScriptRoot 'server.mjs')
    if ($LASTEXITCODE -ne 0) { throw "Genesis exited with code $LASTEXITCODE." }
} catch {
    Write-Error "Unable to start Genesis local assistant: $($_.Exception.Message)"
    exit 1
} finally {
    $env:GENESIS_MODEL = $previousModel
    $env:GENESIS_PORT = $previousPort
}
