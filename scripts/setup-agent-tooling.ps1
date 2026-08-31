$ErrorActionPreference = "Stop"
$plannerVersion = "1.2.2"
$plannerSha256 = "1b454c2dbf1a7287bb33b2c146d5603f28f8896e62d07329820fe14d333a7115"
$vaultVersion = "1.2.0"
$vaultSha256 = "c366df50bb04fc3659cc6361fdc91fba0b521956e2521c1a7f1ce1b1b2c4115d"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$releaseRoot = Join-Path $projectRoot ".release"
$plannerRelease = Join-Path $releaseRoot "planner"
$vaultRelease = Join-Path $releaseRoot "vault"
$plannerRuntime = Join-Path $projectRoot ".tools\planner-runtime"
$vaultRuntime = Join-Path $projectRoot ".tools\vault-runtime"

function Write-Utf8NoBom {
  param([string]$Path, [string]$Value)
  [System.IO.File]::WriteAllText($Path, $Value, [System.Text.UTF8Encoding]::new($false))
}

function Install-ReleaseRuntime {
  param(
    [string]$Repository,
    [string]$Version,
    [string]$ArchiveName,
    [string]$ExpectedSha256,
    [string]$ReleaseDirectory,
    [string]$RuntimeDirectory
  )

  New-Item -ItemType Directory -Force $ReleaseDirectory, $RuntimeDirectory | Out-Null
  $archive = Join-Path $ReleaseDirectory $ArchiveName
  $sidecar = "$archive.sha256"
  if (-not (Test-Path -LiteralPath $archive)) {
    gh release download "v$Version" -R $Repository --pattern $ArchiveName --dir $ReleaseDirectory
    if ($LASTEXITCODE -ne 0) { throw "Failed to download $Repository v$Version" }
  }
  if (-not (Test-Path -LiteralPath $sidecar)) {
    gh release download "v$Version" -R $Repository --pattern "$ArchiveName.sha256" --dir $ReleaseDirectory
    if ($LASTEXITCODE -ne 0) { throw "Failed to download $Repository v$Version checksum" }
  }
  $actual = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  $declared = ((Get-Content -Raw -LiteralPath $sidecar).Trim() -split '\s+')[0].ToLowerInvariant()
  if ($actual -ne $ExpectedSha256) { throw "Pinned checksum mismatch for $archive" }
  if ($actual -ne $declared) { throw "Release sidecar checksum mismatch for $archive" }

  Write-Utf8NoBom -Path (Join-Path $RuntimeDirectory "package.json") -Value '{"private":true,"packageManager":"pnpm@11.21.0"}'
  Write-Utf8NoBom -Path (Join-Path $RuntimeDirectory ".npmrc") -Value '@etherlords:registry=https://npm.pkg.github.com'
  pnpm --dir $RuntimeDirectory add --save-dev $archive --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw "Failed to install $archive" }
}

$packageToken = gh auth token
$temporaryUserConfig = New-TemporaryFile
$previousUserConfig = $env:NPM_CONFIG_USERCONFIG
try {
  Write-Utf8NoBom -Path $temporaryUserConfig -Value "@etherlords:registry=https://npm.pkg.github.com`n//npm.pkg.github.com/:_authToken=$packageToken"
  $env:NPM_CONFIG_USERCONFIG = $temporaryUserConfig
  Install-ReleaseRuntime -Repository "etherlords/planner" -Version $plannerVersion -ArchiveName "etherlords-planner-mcp-$plannerVersion.tgz" -ExpectedSha256 $plannerSha256 -ReleaseDirectory $plannerRelease -RuntimeDirectory $plannerRuntime
  Install-ReleaseRuntime -Repository "etherlords/vault" -Version $vaultVersion -ArchiveName "vault-mcp-$vaultVersion.tgz" -ExpectedSha256 $vaultSha256 -ReleaseDirectory $vaultRelease -RuntimeDirectory $vaultRuntime
}
finally {
  $env:NPM_CONFIG_USERCONFIG = $previousUserConfig
  Remove-Item -LiteralPath $temporaryUserConfig -Force -ErrorAction SilentlyContinue
  $packageToken = $null
}

$tomlRoot = $projectRoot.Replace("\", "\\")
$plannerPackage = (Get-Item -LiteralPath (Join-Path $plannerRuntime "node_modules\@etherlords\planner-mcp")).Target
$vaultPackage = (Get-Item -LiteralPath (Join-Path $vaultRuntime "node_modules\vault-mcp")).Target
$plannerEntrypoint = (Join-Path $plannerPackage "dist\server.js").Replace("\", "/")
$vaultEntrypoint = (Join-Path $vaultPackage "dist\mcp\launcher.js").Replace("\", "/")
$vaultConfig = (Join-Path $projectRoot "vault.config.json").Replace("\", "\\")
$template = Get-Content -LiteralPath (Join-Path $projectRoot ".codex\config.template.toml") -Raw
$config = $template.Replace("__PROJECT_ROOT__", $tomlRoot).Replace("__PLANNER_ENTRYPOINT__", $plannerEntrypoint).Replace("__VAULT_ENTRYPOINT__", $vaultEntrypoint).Replace("__VAULT_CONFIG__", $vaultConfig)
Write-Utf8NoBom -Path (Join-Path $projectRoot ".codex\config.toml") -Value $config

$install = [ordered]@{
  schemaVersion = 1
  kind = "planner-project-install"
  consumerProjectRoot = $projectRoot
  canonicalPlannerRoot = $projectRoot
  storageMode = "in-repo"
  trackerMode = "local-only"
  youtrackProfile = $null
  gitGuidance = "Commit Planner Markdown with the product repository. This mode is for one writable checkout only."
}
Write-Utf8NoBom -Path (Join-Path $projectRoot ".planner\planner-install.json") -Value ($install | ConvertTo-Json)

Write-Host "Planner and Vault runtimes installed. Restart Codex from $projectRoot."
