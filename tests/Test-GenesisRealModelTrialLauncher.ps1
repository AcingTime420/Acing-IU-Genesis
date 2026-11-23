# Pure fixture tests: no Docker, PostgreSQL, model or coordinator process is started.
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$launcher=Join-Path $root 'scripts/Invoke-GenesisRealModelTrial.ps1'
$tokens=$null;$parseErrors=$null
$ast=[Management.Automation.Language.Parser]::ParseFile($launcher,[ref]$tokens,[ref]$parseErrors)
if($parseErrors.Count -ne 0){throw 'Launcher has PowerShell parse errors.'}
$names=@('Resolve-GenesisTrialHarness','Test-GenesisFullContainerIds','Get-GenesisContainerSetDifference','Get-GenesisOwnedCluster')
$functions=@($ast.FindAll({param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst]},$true)|Where-Object{$names -contains $_.Name})
if($functions.Count -ne $names.Count){throw 'Pure launcher helpers are missing.'}
# Evaluate only function declarations from the trusted source, never launcher body.
foreach($definition in $functions){Invoke-Expression $definition.Extent.Text}
function Assert-True([bool]$Value,[string]$Message){if(!$Value){throw $Message}}
function Assert-Throws([scriptblock]$Action,[string]$Message){
    $failed=$false
    try{& $Action}catch{$failed=$true}
    Assert-True $failed $Message
}
$fixture=Join-Path ([IO.Path]::GetTempPath()) ('genesis-launcher-pure-'+[guid]::NewGuid().ToString('N'))
$null=[IO.Directory]::CreateDirectory($fixture)
try{
    $scripts=Join-Path $fixture 'evidence/scripts'
    $front=Join-Path $fixture 'evidence/frontend/tests'
    $null=[IO.Directory]::CreateDirectory($scripts);$null=[IO.Directory]::CreateDirectory($front)
    $browser=Join-Path $front 'genesis-real-inference-connected.mjs'
    $adjacent=Join-Path $scripts 'genesis-real-inference-connected.mjs'
    $adversarial=Join-Path $scripts 'genesis-real-adversarial.mjs'
    [IO.File]::WriteAllText($browser,'');[IO.File]::WriteAllText($adjacent,'');[IO.File]::WriteAllText($adversarial,'')
    Assert-True ((Resolve-GenesisTrialHarness $scripts 'browser') -eq [IO.Path]::GetFullPath($browser)) 'Browser must use evidence-checkout harness.'
    [IO.File]::Delete($browser)
    Assert-True ((Resolve-GenesisTrialHarness $scripts 'browser') -eq [IO.Path]::GetFullPath($adjacent)) 'Adjacent deployed browser fallback must remain available.'
    Assert-True ((Resolve-GenesisTrialHarness $scripts 'adversarial') -eq [IO.Path]::GetFullPath($adversarial)) 'Adversarial harness must be beside the evidence launcher.'
    Assert-Throws {Resolve-GenesisTrialHarness $scripts 'unknown'} 'Unknown scenarios must fail.'

    $a='a'*64;$b='b'*64;$c='c'*64
    Assert-True (Test-GenesisFullContainerIds @($a,$b)) 'Full IDs must be accepted.'
    Assert-True (!(Test-GenesisFullContainerIds @('a'*12))) 'Short IDs must be rejected.'
    Assert-True (!(Test-GenesisFullContainerIds @($a,$a))) 'Duplicate IDs must be rejected.'
    $same=Get-GenesisContainerSetDifference @($a,$b) @($b,$a)
    Assert-True ($same.Missing.Count -eq 0 -and $same.Unexpected.Count -eq 0) 'Order must not change exact set equality.'
    $difference=Get-GenesisContainerSetDifference @($a,$b) @($a,$c)
    Assert-True ($difference.Missing.Count -eq 1 -and $difference.Missing[0] -eq $b) 'Missing IDs must be reported.'
    Assert-True ($difference.Unexpected.Count -eq 1 -and $difference.Unexpected[0] -eq $c) 'Unexpected IDs must prevent restoration success without mutation.'
    $empty=Get-GenesisContainerSetDifference @() @()
    Assert-True ($empty.Missing.Count -eq 0 -and $empty.Unexpected.Count -eq 0) 'Empty exact sets must be supported.'

    $private=Join-Path $fixture 'private';$old=Join-Path $private 'postgres'
    $null=[IO.Directory]::CreateDirectory($old);[IO.File]::WriteAllText((Join-Path $old 'postmaster.pid'),'old-owner')
    $token='1'*32;$coordinator=12345
    Assert-True ($null -eq (Get-GenesisOwnedCluster $private $token $coordinator)) 'Existing legacy cluster must never authorize this invocation cleanup.'
    $cluster=[IO.Path]::GetFullPath((Join-Path $private ('postgres-'+$token)))
    $null=[IO.Directory]::CreateDirectory($cluster);[IO.File]::WriteAllText((Join-Path $cluster 'postmaster.pid'),'fixture-only-no-server')
    Assert-True ($null -eq (Get-GenesisOwnedCluster $private $token $coordinator)) 'An unclaimed new path must not authorize cleanup.'
    $marker=$cluster+'.start-requested.json'
    $claim=[ordered]@{invocationId=$token;clusterPath=$cluster;coordinatorPid=$coordinator}
    [IO.File]::WriteAllText($marker,($claim|ConvertTo-Json -Compress))
    Assert-True ((Get-GenesisOwnedCluster $private $token $coordinator) -eq $cluster) 'Matching invocation marker and PID file must select only the new task cluster.'
    Assert-Throws {Get-GenesisOwnedCluster $private $token ($coordinator+1)} 'A different coordinator PID must not authorize cleanup.'
    $claim.clusterPath=$old;[IO.File]::WriteAllText($marker,($claim|ConvertTo-Json -Compress))
    Assert-Throws {Get-GenesisOwnedCluster $private $token $coordinator} 'A marker naming an old cluster must be rejected.'
    Assert-True ([IO.File]::ReadAllText((Join-Path $old 'postmaster.pid')) -eq 'old-owner') 'Tests must leave the old fixture cluster untouched.'
    Write-Output 'Pure launcher fixture tests passed; no services were started or stopped.'
}finally{[IO.Directory]::Delete($fixture,$true)}
