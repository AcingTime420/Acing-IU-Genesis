[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('up','test','down','recover')][string]$Action,
  [Parameter(Mandatory)][ValidatePattern('^[a-z0-9][a-z0-9-]{2,30}$')][string]$RunId
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$compose = Join-Path $root 'infrastructure\docker-compose.validation.yml'
$project = "acing-validate-$RunId"
$stateDir = Join-Path $root 'infrastructure\.validation-runs'
$manifestPath = Join-Path $stateDir "$RunId.json"
$normal = @('acing-redis-data','acing-postgres-data','redis_data','postgres_data')
function Assert-Target {
  $ctx = (& docker context show).Trim()
  if ($ctx -notin @('default','genesis-staging','desktop-linux')) { throw "Refusing Docker operation: context '$ctx' is not approved." }
  if ($env:DOCKER_HOST) { throw 'Refusing Docker operation: DOCKER_HOST is set.' }
}
function Compose([string[]]$ComposeArgs) {
  & docker-compose -p $project -f $compose $ComposeArgs
  if ($LASTEXITCODE) { throw 'docker-compose failed' }
}
function Volumes { @(& docker volume ls --filter "label=com.docker.compose.project=$project" --format '{{.Name}}') | Where-Object { $_ } | Sort-Object }
function InspectVolume([string]$Name) {
  $raw = & docker volume inspect $Name --format '{{json .}}'
  if ($LASTEXITCODE -or -not $raw) { throw "Refusing teardown: volume '$Name' cannot be inspected." }
  $raw | ConvertFrom-Json
}
function Manifest {
  if (-not (Test-Path $manifestPath)) { throw 'Refusing teardown: manifest is absent.' }
  Get-Content -Raw $manifestPath | ConvertFrom-Json
}
function ExactVolumes($m) {
  if ($m.runId -ne $RunId -or $m.project -ne $project) { throw 'Refusing teardown: manifest identity mismatch.' }
  $expected = @($m.volumes | Sort-Object)
  if ($expected.Count -ne 2) { throw 'Refusing teardown: manifest must contain exactly two volumes.' }
  foreach ($n in $expected) {
    if ($normal -contains $n) { throw "Refusing teardown: normal/shared volume '$n' selected." }
    if (-not $n.StartsWith("${project}_", [StringComparison]::Ordinal)) { throw "Refusing teardown: volume '$n' is outside project." }
  }
  $actual = @(Volumes)
  if (@(Compare-Object $expected $actual).Count) { throw 'Refusing teardown: project volume set differs from manifest.' }
  $out = @()
  foreach ($n in $expected) {
    $v = InspectVolume $n
    if ($v.Labels.'acing.genesis.lifecycle' -ne 'validation' -or $v.Labels.'acing.genesis.run-id' -ne $RunId -or $v.Labels.'com.docker.compose.project' -ne $project) { throw "Refusing teardown: volume '$n' labels mismatch." }
    $out += [pscustomobject]@{ Name=$n; Id=$v.Name }
  }
  $out
}
function Containers($m) {
  $ids = @($m.containers)
  if ($ids.Count -lt 2) { throw 'Refusing teardown: manifest has fewer than two containers.' }
  foreach ($id in $ids) {
    $raw = & docker inspect $id --format '{{json .}}'
    if ($LASTEXITCODE -or -not $raw) { throw "Refusing teardown: container '$id' cannot be inspected." }
    $c = $raw | ConvertFrom-Json
    if ($c.Config.Labels.'acing.genesis.lifecycle' -ne 'validation' -or $c.Config.Labels.'acing.genesis.run-id' -ne $RunId -or $c.Config.Labels.'com.docker.compose.project' -ne $project) { throw "Refusing teardown: container '$id' labels mismatch." }
  }
  $ids
}
function Atomic($value) {
  New-Item -ItemType Directory -Force $stateDir | Out-Null
  $tmp = "$manifestPath.$([Guid]::NewGuid().ToString('N')).tmp"
  $value | ConvertTo-Json -Depth 6 | Set-Content $tmp -Encoding UTF8
  Move-Item $tmp $manifestPath -Force
}
function ExactDown {
  Assert-Target
  $m = Manifest
  $vs = @(ExactVolumes $m)
  $cs = @(Containers $m)
  & docker stop --time 30 $cs
  if ($LASTEXITCODE) { throw 'Refusing teardown: exact container stop failed.' }
  & docker rm $cs
  if ($LASTEXITCODE) { throw 'Refusing teardown: exact container removal failed.' }
  foreach ($item in $vs) {
    $fresh = InspectVolume $item.Name
    if ($fresh.Name -ne $item.Id -or $fresh.Labels.'acing.genesis.lifecycle' -ne 'validation' -or $fresh.Labels.'acing.genesis.run-id' -ne $RunId -or $fresh.Labels.'com.docker.compose.project' -ne $project) { throw "Refusing teardown: volume '$($item.Name)' changed before deletion." }
    & docker volume rm $fresh.Name
    if ($LASTEXITCODE) { throw "Refusing teardown: volume delete failed for '$($item.Name)'." }
  }
  Remove-Item $manifestPath -Force
}
switch ($Action) {
  'up' {
    Assert-Target
    if (Test-Path $manifestPath) { throw "Refusing startup: manifest exists for '$RunId'." }
    $env:VALIDATION_RUN_ID = $RunId
    Atomic ([pscustomobject]@{state='pending';runId=$RunId;project=$project;volumes=@("${project}_postgres_data","${project}_redis_data");containers=@()})
    Compose @('up','-d','--wait')
    $actual = @(Volumes)
    if ($actual.Count -ne 2) { throw 'Refusing startup: exact two validation volumes were not created.' }
    $containers = @(& docker ps --filter "label=com.docker.compose.project=$project" --filter "label=acing.genesis.run-id=$RunId" --format '{{.ID}}')
    if ($containers.Count -lt 2) { throw 'Refusing startup: expected labelled containers were not created.' }
    $null = ExactVolumes ([pscustomobject]@{runId=$RunId;project=$project;volumes=$actual})
    Atomic ([pscustomobject]@{state='active';runId=$RunId;project=$project;volumes=$actual;containers=$containers})
  }
  'test' { Assert-Target; $m=Manifest; $null=ExactVolumes $m; $null=Containers $m; Compose @('config','--quiet'); Compose @('ps') }
  'down' { ExactDown }
  'recover' { ExactDown }
}
