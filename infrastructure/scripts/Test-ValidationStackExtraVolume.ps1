[CmdletBinding()]param()
$ErrorActionPreference = 'Stop'
$runId = "extra-$([Guid]::NewGuid().ToString('N').Substring(0,10))"
$project = "acing-validate-$runId"
$wrapper = Join-Path $PSScriptRoot 'validation-stack.ps1'
$extra = "${project}_unexpected_data"
$env:VALIDATION_RUN_ID = $runId
if (-not $env:VALIDATION_POSTGRES_PASSWORD) { $env:VALIDATION_POSTGRES_PASSWORD = 'validation-only-not-production' }
& powershell -NoProfile -ExecutionPolicy Bypass -File $wrapper -Action up -RunId $runId
if ($LASTEXITCODE) { throw 'Validation startup failed.' }
try {
  & docker volume create --label "com.docker.compose.project=$project" --label 'acing.genesis.lifecycle=validation' --label "acing.genesis.run-id=$runId" $extra | Out-Null
  $out = @()
  try {
    $out = @( & powershell -NoProfile -ExecutionPolicy Bypass -File $wrapper -Action down -RunId $runId 2>&1 )
    $downExit = $LASTEXITCODE
  } catch {
    $out = @($_)
    $downExit = 1
  }
  if ($downExit -eq 0) { throw 'Teardown unexpectedly succeeded with an extra volume.' }
  if (($out -join "`n") -notmatch 'project volume set differs') { throw 'Refusal did not identify extra volume.' }
  & docker volume inspect $extra *> $null
  if ($LASTEXITCODE) { throw 'Extra volume was deleted.' }
  Write-Output 'PASS: extra volume caused refusal and survived.'
} finally {
  & docker volume rm $extra *> $null
  & powershell -NoProfile -ExecutionPolicy Bypass -File $wrapper -Action recover -RunId $runId
}
