param([string]$Root=(Resolve-Path (Join-Path $PSScriptRoot "..")).Path)
$ErrorActionPreference="Stop"
& (Join-Path $Root "scripts/validate-security-claims.ps1") -Root $Root
$rootMaster=Get-Content (Join-Path $Root "frontend/src/app/rootmaster/page.tsx") -Raw
if($rootMaster -notmatch "RootMaster operations are unavailable"){throw "RootMaster unavailable state missing."}
if($rootMaster -match "(?i)onClick|fetch\(|axios|flash\(|unlock\(|bypass\(|register modification\s*[:=]"){throw "Executable unsupported operation remains in RootMaster route."}
$engine=Get-Content (Join-Path $Root "backend/Security/Services/AcingPolicyEngine.cs") -Raw
$controller=Get-Content (Join-Path $Root "backend/Security/Controllers/PolicyController.cs") -Raw
if($engine -match "FIRMWARE_FLASH|PARTITION_WIPE|SYSTEM_MODIFICATION|APPROVED_BYPASSED"){throw "Unsupported policy action vocabulary or automatic approval remains."}
if($engine -notmatch "DENIED_NOT_SUPPORTED"){throw "Policy simulator fail-closed outcome missing."}
if($controller -notmatch '\[Authorize\(Roles = "Admin,Operator"\)\]'){throw "Policy simulation authorization boundary missing."}
if($controller -notmatch "Status501NotImplemented"){throw "Policy simulation disabled response missing."}
$android=Get-Content (Join-Path $Root "app/src/main/java/com/example/ui/AcingViewModel.kt") -Raw
if($android -match "RootMaster Lab Dissect Suite|Device fully compliant|PersistentDataBlockManager|ADB pm trim-caches"){throw "Fabricated device-operation fixture remains."}
if($android -notmatch "TEST FIXTURE" -or $android -notmatch "No device connection"){throw "Simulator/test-fixture labeling missing."}
$requirements=Join-Path $Root "docs/security/AUTHORIZED_DEVICE_LAB_EXECUTOR_REQUIREMENTS.md"
if(!(Test-Path $requirements)){throw "Authorized Device Lab requirements document missing."}
$req=Get-Content $requirements -Raw
foreach($term in @("ownership","consent","supported-device","preflight","backup","dry run","audit","rollback","Simulator","enable")){if($req -notmatch [regex]::Escape($term)){throw "Requirements document missing: $term"}}
$inv=Get-Content (Join-Path $Root "docs/security/ISSUE_63_CLAIM_OCCURRENCE_INVENTORY.json") -Raw|ConvertFrom-Json
if(@($inv.occurrences|Where-Object {$_.classification -eq "verified"}).Count -ne 0){throw "Verified occurrence count must remain zero."}
$inventoryRaw=Get-Content (Join-Path $Root "docs/security/ISSUE_63_CLAIM_OCCURRENCE_INVENTORY.json") -Raw
if($inventoryRaw -match '(?i)(AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'']?[A-Za-z0-9_\-]{16,}|authorization\s*:\s*bearer\s+[A-Za-z0-9._\-]+)'){throw "Inventory contains an unredacted credential-shaped substring."}
$rootRecords=@($inv.occurrences|Where-Object {$_.normalizedTerm -match "^root"})
if($rootRecords.Count -eq 0){throw "Root semantic inventory records missing."}
if(@($rootRecords|Where-Object {$_.classification -eq "false positive"}).Count -eq 0){throw "Contextual non-device root classification missing."}
Write-Output "Issue #63 acceptance tests passed: non-operational controls, zero Verified claims, simulator labels, semantic root classification, and Authorized Device Lab requirements."
