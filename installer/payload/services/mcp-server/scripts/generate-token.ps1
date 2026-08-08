# Acing IU: Genesis — local machine security token generator
# Writes a high-entropy token used by local MCP / tooling integrations.
# Does NOT replace JWT_SIGNING_KEY for the Docker platform stack.

$ErrorActionPreference = "Stop"

$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $Root) { $Root = Join-Path $PSScriptRoot "..\..\.." }

$TokenDir = Join-Path $Root "services\mcp-server"
$TokenFile = Join-Path $TokenDir ".local-token"
$EnvExample = Join-Path $Root "platform\.env.example"
$PlatformEnv = Join-Path $Root "platform\.env"

New-Item -ItemType Directory -Force -Path $TokenDir | Out-Null

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$token = [Convert]::ToBase64String($bytes) -replace '[/+=]', ''

Set-Content -Path $TokenFile -Value $token -Encoding ASCII -NoNewline

# Restrict ACL to current user on NTFS
try {
    $acl = Get-Acl $TokenFile
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
        "FullControl", "Allow")
    $acl.SetAccessRule($rule)
    Set-Acl -Path $TokenFile -AclObject $acl
} catch {
    Write-Warning "Could not tighten ACL on token file: $_"
}

Write-Host "Local security token written to: $TokenFile"

# If platform .env exists and JWT_SIGNING_KEY is still the placeholder, offer a strong key
if (Test-Path $PlatformEnv) {
    $content = Get-Content $PlatformEnv -Raw
    if ($content -match 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET') {
        $jwtKey = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
        $content = $content -replace 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS', $jwtKey
        Set-Content -Path $PlatformEnv -Value $content -Encoding UTF8
        Write-Host "Updated platform\.env JWT_SIGNING_KEY with a generated secret."
    }
} elseif (Test-Path $EnvExample) {
    Copy-Item $EnvExample $PlatformEnv -Force
    $jwtKey = -join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
    $content = (Get-Content $PlatformEnv -Raw) -replace 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS', $jwtKey
    Set-Content -Path $PlatformEnv -Value $content -Encoding UTF8
    Write-Host "Created platform\.env from example with generated JWT_SIGNING_KEY."
}

Write-Host "Done."
