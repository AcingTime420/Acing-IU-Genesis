# Run only after explicit permission to pause Docker and after saving its container state.
# This launcher never stops Docker; it guarantees a bounded restoration attempt.
param(
    [Parameter(Mandatory=$true)][string]$Repository,
    [Parameter(Mandatory=$true)][string]$RunDirectory,
    [Parameter(Mandatory=$true)][string]$PlaywrightRoot,
    [Parameter(Mandatory=$true)][string]$OllamaExecutable,
    [Parameter(Mandatory=$true)][string]$ModelsDirectory,
    [Parameter(Mandatory=$true)][string]$Model,
    [Parameter(Mandatory=$true)][string]$DockerSnapshot,
    [ValidateSet('browser','adversarial')][string]$Scenario = 'browser',
    [string]$PythonExecutable = 'C:\Python315\python.exe',
    [string]$ExpectedCommit = '5821dabd4164040a50c2b9cd0a814a6421bf3da6'
)
$ErrorActionPreference='Stop'
$docker='C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$private=Join-Path $RunDirectory 'private'
$trialCode=1
$restored=$false
function Read-Shared([string]$Path){
    $stream=[IO.FileStream]::new($Path,[IO.FileMode]::Open,[IO.FileAccess]::Read,([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
    $reader=[IO.StreamReader]::new($stream,[Text.Encoding]::UTF8)
    try{return [string]$reader.ReadToEnd()}finally{$reader.Dispose()}
}
function Docker-Command([string[]]$Arguments,[int]$Seconds=30){
    # Restoration must not depend on readable/writable private log files. Quote
    # every fixed CLI argument so format strings containing spaces stay intact.
    $process=$null
    try{
        $quoted=@($Arguments|ForEach-Object{
            if($_ -match '["\r\n]'){throw 'Invalid Docker argument.'}
            '"'+$_+'"'
        })
        $info=[Diagnostics.ProcessStartInfo]::new()
        $info.FileName=$docker;$info.Arguments=($quoted -join ' ')
        $info.UseShellExecute=$false;$info.CreateNoWindow=$true
        $info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true
        $process=[Diagnostics.Process]::Start($info)
        $out=$process.StandardOutput.ReadToEndAsync()
        $err=$process.StandardError.ReadToEndAsync()
        if(!$process.WaitForExit($Seconds*1000)){
            try{$process.Kill()}catch{}
            return [pscustomobject]@{Code=-1;Output=''}
        }
        if(!$out.Wait(2000) -or !$err.Wait(2000)){return [pscustomobject]@{Code=-1;Output=''}}
        $process.Refresh()
        $code=$process.ExitCode
        try{
            $id=[guid]::NewGuid().ToString('N')
            [IO.File]::WriteAllText((Join-Path $private ('docker-'+$id+'.out.log')),$out.Result)
            [IO.File]::WriteAllText((Join-Path $private ('docker-'+$id+'.err.log')),$err.Result)
        }catch{} # Missing logs must never prevent a restoration attempt.
        return [pscustomobject]@{Code=$code;Output=[string]$out.Result}
    }catch{return [pscustomobject]@{Code=-1;Output=''}}
    finally{if($null -ne $process){$process.Dispose()}}
}
$snapshot=$null
$ids=@()
$snapshotValid=$false
$pgCleanupFailed=$false
$restorationAttempted=$false
try{
    # Validate before the trial; an invalid snapshot must not run inference or
    # authorize mutations, but the finally block still attempts Desktop startup.
    $snapshot=[IO.File]::ReadAllText($DockerSnapshot)|ConvertFrom-Json
    if($null -eq $snapshot -or $null -eq $snapshot.PSObject.Properties['Containers']){throw 'Invalid saved container snapshot.'}
    $ids=@($snapshot.Containers|ForEach-Object{
        if($_.Id -notmatch '^[a-f0-9]{12,64}$'){throw 'Invalid saved container ID.'}
        if($null -ne $_.PSObject.Properties['Running'] -and ![bool]$_.Running){throw 'Snapshot contains a previously stopped container.'}
        [string]$_.Id
    })
    if(@($ids|Select-Object -Unique).Count -ne $ids.Count){throw 'Duplicate saved container IDs.'}
    $snapshotValid=$true

    $coordinator=Join-Path $PSScriptRoot 'validate-real-local-inference-windows.py'
    $harnessName=if($Scenario -eq 'adversarial'){'genesis-real-adversarial.mjs'}else{'genesis-real-inference-connected.mjs'}
    $harness=if($Scenario -eq 'adversarial'){Join-Path $Repository ('scripts/'+$harnessName)}else{Join-Path $Repository ('frontend/tests/'+$harnessName)}
    if(!(Test-Path -LiteralPath $harness)){$harness=Join-Path $PSScriptRoot $harnessName}
    foreach($path in @($Repository,$private,$PlaywrightRoot,$OllamaExecutable,$ModelsDirectory,$DockerSnapshot,$coordinator,$harness)){
        if(!(Test-Path -LiteralPath $path)){throw 'Required exact trial resource is missing.'}
    }
    $env:TEMP=Join-Path $RunDirectory 'temp';$env:TMP=$env:TEMP
    $arguments=@(('"'+$coordinator+'"'),'--repo',('"'+$Repository+'"'),'--run-dir',('"'+$RunDirectory+'"'),
        '--playwright-root',('"'+$PlaywrightRoot+'"'),'--harness',('"'+$harness+'"'),
        '--expected-commit',$ExpectedCommit,'--model',$Model,'--ollama',('"'+$OllamaExecutable+'"'),'--models-dir',('"'+$ModelsDirectory+'"'),'--scenario',$Scenario)
    $process=Start-Process -FilePath $PythonExecutable -ArgumentList $arguments -NoNewWindow -PassThru -RedirectStandardOutput (Join-Path $private 'coordinator.stdout.log') -RedirectStandardError (Join-Path $private 'coordinator.stderr.log')
    $null=$process.Handle
    if(!$process.WaitForExit(600000)){
        $null=& taskkill.exe /PID $process.Id /T /F
        throw 'Task-owned trial exceeded its outer deadline.'
    }
    $process.Refresh();$trialCode=$process.ExitCode
}catch{
    # Keep arbitrary exception text out of public diagnostics; restoration still runs.
    $trialCode=1
}finally{
    # PG cleanup cannot abort the separate Docker restoration attempt.
    try{
        $cluster=Join-Path $private 'postgres'
        if(Test-Path (Join-Path $cluster 'postmaster.pid')){
            $pg=Start-Process -FilePath 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe' -ArgumentList @('-D',('"'+$cluster+'"'),'-m','fast','-w','stop') -NoNewWindow -PassThru -RedirectStandardOutput (Join-Path $private 'outer-pg-stop.log') -RedirectStandardError (Join-Path $private 'outer-pg-stop.stderr.log')
            $null=$pg.Handle
            if(!$pg.WaitForExit(45000)){$pg.Kill();$pgCleanupFailed=$true}
            else{$pg.Refresh();if($pg.ExitCode -ne 0){$pgCleanupFailed=$true}}
            $pg.Dispose()
        }
    }catch{$pgCleanupFailed=$true}
    finally{
        try{
            $restorationAttempted=$true
            $null=Docker-Command @('desktop','start','--timeout','90') 100
            $deadline=[DateTime]::UtcNow.AddSeconds(180)
            $ready=$false
            while([DateTime]::UtcNow -lt $deadline){
                $probe=Docker-Command @('--context','desktop-linux','info','--format','{{.ServerVersion}}') 8
                if($probe.Code -eq 0){$ready=$true;break}
                Start-Sleep -Seconds 2
            }
            # With invalid state we may restore Desktop, but must neither guess
            # which containers to start nor claim their state was restored.
            if($ready -and $snapshotValid){
                $context=Docker-Command @('context','inspect','desktop-linux','--format','{{.Endpoints.docker.Host}}') 10
                if($context.Code -ne 0 -or $context.Output.Trim() -notlike 'npipe:*'){throw 'Unexpected Docker endpoint; no container mutation performed.'}
                foreach($id in $ids){$null=Docker-Command @('--context','desktop-linux','start',$id) 20}
                foreach($item in $snapshot.Containers){
                    if($item.Paused){$null=Docker-Command @('--context','desktop-linux','pause',[string]$item.Id) 10}
                }
                $running=Docker-Command @('--context','desktop-linux','ps','-q','--no-trunc') 10
                $actual=@($running.Output -split '\s+'|Where-Object{$_})
                $missing=@($ids|Where-Object{$savedId=$_;!(@($actual|Where-Object{$_.StartsWith($savedId)}).Count -eq 1)})
                $stateMismatches=@()
                foreach($item in $snapshot.Containers){
                    $state=Docker-Command @('--context','desktop-linux','inspect','--format','{{json .State}}',[string]$item.Id) 10
                    if($state.Code -ne 0){$stateMismatches+=[string]$item.Id;continue}
                    try{$value=$state.Output|ConvertFrom-Json}catch{$stateMismatches+=[string]$item.Id;continue}
                    if(!$value.Running -or [bool]$value.Paused -ne [bool]$item.Paused){$stateMismatches+=[string]$item.Id}
                }
                $restored=($running.Code -eq 0 -and $missing.Count -eq 0 -and $stateMismatches.Count -eq 0)
                try{
                    [ordered]@{ExpectedContainers=$ids.Count;RestoredContainers=($ids.Count-$missing.Count);AllRestored=$restored;Missing=$missing;StateMismatches=$stateMismatches}|ConvertTo-Json -Depth 3|Set-Content -LiteralPath (Join-Path $private 'docker-restoration.json') -Encoding UTF8
                }catch{} # The verified result does not depend on log availability.
            }
        }catch{$restored=$false}
        finally{
            [ordered]@{TrialExitCode=$trialCode;DockerRestorationAttempted=$restorationAttempted;SnapshotValid=$snapshotValid;DockerRestored=$restored;PostgresCleanupFailed=$pgCleanupFailed;ResultFile=(Join-Path $RunDirectory 'real-model-result.json')}|ConvertTo-Json -Depth 3
        }
    }
}
if($trialCode -ne 0 -or !$restored -or $pgCleanupFailed){exit 1}
