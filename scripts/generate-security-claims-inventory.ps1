param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$Output = (Join-Path $Root "docs/security/ISSUE_63_CLAIM_OCCURRENCE_INVENTORY.json")
)
$ErrorActionPreference = "Stop"
$patterns = @(
  @{Term="knox";Id="CAP-001"}, @{Term="certification";Id="CAP-002"}, @{Term="certified";Id="CAP-002"},
  @{Term="attestation";Id="CAP-003"}, @{Term="carrier";Id="CAP-005"}, @{Term="register";Id="CAP-005"},
  @{Term="hardware backed";Id="CAP-006"}, @{Term="trustzone";Id="CAP-006"}, @{Term="secure enclave";Id="CAP-006"},
  @{Term="production ready";Id="CAP-004"}, @{Term="fips";Id="CAP-008"}, @{Term="ctia";Id="CAP-007"},
  @{Term="compliance";Id="CAP-008"}, @{Term="compliant";Id="CAP-008"}, @{Term="quantum";Id="CAP-009"},
  @{Term="kyber";Id="CAP-009"}, @{Term="dilithium";Id="CAP-009"}, @{Term="tridar";Id="CAP-010"}, @{Term="sentinel mesh";Id="CAP-011"},
  @{Term="firmware";Id="CAP-013"}, @{Term="flashing";Id="CAP-012"}, @{Term="flash";Id="CAP-012"},
  @{Term="bootloader";Id="CAP-012"}, @{Term="unlock";Id="CAP-012"}, @{Term="root";Id="CAP-016"},
  @{Term="rooting";Id="CAP-016"}, @{Term="root access";Id="CAP-016"}, @{Term="bypass";Id="CAP-012"},
  @{Term="fuse";Id="CAP-012"}, @{Term="warranty";Id="CAP-012"}, @{Term="recovery";Id="CAP-012"},
  @{Term="frp";Id="CAP-012"}, @{Term="exploit";Id="CAP-012"}
)
$excludedPrefixes = @(".git/","node_modules/","bin/","obj/","dist/","build/","out/","coverage/",".next/")
$binaryExt = @(".png",".jpg",".jpeg",".gif",".ico",".zip",".7z",".dll",".exe",".pdb",".jar",".aar",".so",".woff",".woff2",".pdf")
function Get-SemanticDisposition([string]$File, [string]$Term, [string]$Context) {
  $lc = $Context.ToLowerInvariant(); $f = $File.ToLowerInvariant()
  if($f -match "(^|/)(tests?|fixtures?|assets?)/" -or $lc -match "test fixture|fixture|mock|sample|fake|seed") { return @("test fixture","Explicit fixture/test context; not production evidence.","owner-classified") }
  if($f -match "(^|/)docs/evidence/|archive-2026-08-17|reconciliation") { return @("historical evidence","Archive/reconciliation evidence is not a runtime claim.","owner-classified") }
  if($f -match "scripts/(validate-security-claims|test-security-claims)\.ps1") { return @("lint-rule definition","Claim-lint implementation or test definition.","owner-classified") }
  if($lc -match "test fixture|simulator|simulat|no device connection|no adb|no fastboot") { return @("simulator","Explicitly non-operational simulator/test-fixture context.","owner-classified") }
  if($Term -match "^(root|rooting|root access)$") {
    if($lc -match "psscriptroot|project root|repository root|source root|content root|rootdir|root path|root directory|root/|root\\|installroot|targetroot|basedir|resolve-path|join-path|path\.join") { return @("false positive","Filesystem/project/application root; not device rooting.","owner-classified") }
    if($lc -match "runas|administrator|elevated|uac|sudo|start-process") { return @("host permission","Host installer elevation; not Android/device root.","owner-classified") }
    if($lc -match "planned|future|authorized device lab|roadmap|education|educational") { return @("planned","Planned/non-operational Authorized Device Lab or educational context.","owner-classified") }
    if($lc -match "disabled|unavailable|not supported|no verified executor") { return @("disabled pending validation","Current device-changing action is disabled pending validation.","owner-classified") }
  }
  if($Term -eq "register" -and $lc -match "registerdevice|registered_devices|dependency|service registration|api registration|event registration") { return @("false positive","Ordinary device enrollment, dependency, service, API, event, or data registry semantics; not register modification.","owner-classified") }
  if($Term -eq "recovery" -and $lc -match "error recovery|retry|backup recovery|account recovery") { return @("false positive","Ordinary recovery semantics; not a device recovery operation.","owner-classified") }
  if($Term -match "^(flash|flashing)$" -and $lc -match "toast|message|ui|cache|temporary") { return @("false positive","UI or temporary-message semantics; not device flashing.","owner-classified") }
  if($Term -eq "carrier" -and $lc -match "data carrier|transport|provider") { return @("false positive","Generic carrier semantics; not carrier modification.","owner-classified") }
  if($lc -match "planned|target|future|roadmap|not implemented|not available") { return @("planned","Explicit future/non-operational context.","owner-classified") }
  if($lc -match "disabled|unavailable|unsupported|prohibited|removed|not evidence|must not") { return @("disabled pending validation","Explicit disabled/non-operational context.","owner-classified") }
  return @("implemented but unverified","Requires remaining human/owner evidence review; no Verified classification is inferred.","pending-human-review")
}
$files = @((& git -C $Root ls-files -z) -split "`0" | Where-Object { $_ })
$occ = [System.Collections.Generic.List[object]]::new(); $ex = [System.Collections.Generic.List[object]]::new(); $n=0
foreach($file in $files) {
  $norm=$file.Replace("\\","/"); $ext=[IO.Path]::GetExtension($norm).ToLowerInvariant()
  if($norm -eq "docs/security/ISSUE_63_CLAIM_OCCURRENCE_INVENTORY.json") { $ex.Add([pscustomobject]@{file=$norm;reason="inventory-output"}); continue }
  if(($excludedPrefixes | Where-Object {$norm.StartsWith($_)}) -or ($binaryExt -contains $ext)) { $ex.Add([pscustomobject]@{file=$norm;reason=$(if($binaryExt -contains $ext){"binary-extension"}else{"excluded-directory"})}); continue }
  $full=Join-Path $Root $file; try { $text=[IO.File]::ReadAllText($full) } catch { $ex.Add([pscustomobject]@{file=$norm;reason="unreadable"}); continue }
  if($text.IndexOf([char]0) -ge 0) { $ex.Add([pscustomobject]@{file=$norm;reason="binary-content"}); continue }
  $lines=$text -split "`r?`n"
  for($i=0;$i -lt $lines.Count;$i++) {
    $window=(($lines[[Math]::Max(0,$i-1)..[Math]::Min($lines.Count-1,$i+1)]) -join " ")
    $clean=[regex]::Replace($window.ToLowerInvariant(),"[^a-z0-9]+"," ").Trim()
    foreach($pat in $patterns) {
      $needle=[regex]::Escape($pat.Term); if($clean -notmatch "(^| )$needle[a-z0-9]*( |$)") { continue }
      $n++; $ctx=$lines[$i].Trim(); if([string]::IsNullOrWhiteSpace($ctx)){$ctx=$window.Trim()}
      # Context is required for evidence review, but credential-shaped substrings must never be copied into the inventory.
      $ctx=[regex]::Replace($ctx,'(?i)(AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'']?[A-Za-z0-9_\-]{16,}|authorization\s*:\s*bearer\s+[A-Za-z0-9._\-]+)','<redacted-sensitive-pattern>')
      $d=Get-SemanticDisposition $norm $pat.Term $ctx
      $occ.Add([pscustomobject]@{occurrenceId=("OCC-{0:D6}" -f $n);file=$norm;line=($i+1);normalizedTerm=$pat.Term;context=$ctx;classification=$d[0];capabilityId=$pat.Id;evidenceRef=("docs/security/ISSUE_63_CAPABILITY_EVIDENCE_REGISTER.json#"+$pat.Id);rationale=$d[1];reviewStatus=$d[2]})
    }
  }
}
$doc=[pscustomobject]@{schemaVersion="1.1";issue=63;generatedAt=(Get-Date).ToUniversalTime().ToString("o");source="git ls-files tracked text files with semantic contextual classification";includedFileCount=($files.Count-$ex.Count);occurrenceCount=$occ.Count;excludedFileCount=$ex.Count;exclusions=$ex;occurrences=$occ}
$doc | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Output -Encoding utf8
Write-Output ("generated occurrences="+$occ.Count+" exclusions="+$ex.Count+" files="+$files.Count)
