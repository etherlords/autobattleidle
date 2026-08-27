$ErrorActionPreference = "Stop"
$plannerVersion = "1.1.0"
$plannerSha256 = "fe3c8d19ed40c3a4c40973ac62cf4e0d2c541e40c2870c6c222b3d50a09835a2"
$vaultVersion = "1.1.0"
$vaultSha256 = "1f25d8a2930b661bf577d9ae7eed0e137664f348b068ad3b3ac41e523e601034"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$releaseRoot = Join-Path $projectRoot ".release"
$plannerRelease = Join-Path $releaseRoot "planner"
$vaultRelease = Join-Path $releaseRoot "vault"
$plannerRuntime = Join-Path $projectRoot ".tools\planner-runtime"
$vaultRuntime = Join-Path $projectRoot ".tools\vault-runtime"

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
  if (-not (Test-Path -LiteralPath $archive)) {
    gh release download "v$Version" -R $Repository --pattern $ArchiveName --dir $ReleaseDirectory
    if ($LASTEXITCODE -ne 0) { throw "Failed to download $Repository v$Version" }
  }
  $actual = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $ExpectedSha256) { throw "Pinned checksum mismatch for $archive" }

  Set-Content -LiteralPath (Join-Path $RuntimeDirectory "package.json") -Encoding utf8 -Value '{"private":true,"packageManager":"pnpm@11.21.0"}'
  Set-Content -LiteralPath (Join-Path $RuntimeDirectory ".npmrc") -Encoding utf8 -Value '@etherlords:registry=https://npm.pkg.github.com'
  pnpm --dir $RuntimeDirectory add --save-dev $archive --ignore-scripts
  if ($LASTEXITCODE -ne 0) { throw "Failed to install $archive" }
}

$packageToken = gh auth token
$temporaryUserConfig = New-TemporaryFile
$previousUserConfig = $env:NPM_CONFIG_USERCONFIG
try {
  Set-Content -LiteralPath $temporaryUserConfig -Encoding utf8 -Value "@etherlords:registry=https://npm.pkg.github.com`n//npm.pkg.github.com/:_authToken=$packageToken"
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
Set-Content -LiteralPath (Join-Path $projectRoot ".codex\config.toml") -Encoding utf8 -Value $config

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
$install | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $projectRoot ".planner\planner-install.json") -Encoding utf8

Write-Host "Planner and Vault runtimes installed. Restart Codex from $projectRoot."
