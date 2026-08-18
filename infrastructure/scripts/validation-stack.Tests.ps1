Describe 'validation stack exact-resource safety' {
  It 'contains no project-wide volume teardown' {
    $text = Get-Content -Raw (Join-Path $PSScriptRoot 'validation-stack.ps1')
    $text | Should -Not -Match 'down.*--volumes'
    $text | Should -Not -Match 'volume\s+prune'
    $text | Should -Match 'docker\s+volume\s+rm'
  }
  It 'refuses an unexpected volume' {
    & (Join-Path $PSScriptRoot 'Test-ValidationStackExtraVolume.ps1')
    $LASTEXITCODE | Should -Be 0
  }
}
