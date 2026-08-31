$ErrorActionPreference = "Stop"
$plannerVersion = "1.2.4"
$plannerSha256 = "34ce115eee3f1313bbfcd8bad94aa58c268261fc6c26c4214de627c33f49202c"
$vaultVersion = "1.3.0"
$vaultSha256 = "a88852ce4c51ef121f4fedbe5114f55572f26d758396952dfedc767d9958a4f1"
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

function Initialize-SkillBaseline {
  param([string]$PackageRoot, [string]$RuntimeDirectory, [string[]]$Skills)
  if (-not (Test-Path -LiteralPath $PackageRoot)) { return }
  foreach ($skill in $Skills) {
    $source = Join-Path $PackageRoot ".agents\skills\$skill"
    $baseline = Join-Path $RuntimeDirectory ".skill-baseline\$skill"
    if ((Test-Path -LiteralPath $source) -and -not (Test-Path -LiteralPath $baseline)) {
      New-Item -ItemType Directory -Force (Split-Path -Parent $baseline) | Out-Null
      Copy-Item -LiteralPath $source -Destination $baseline -Recurse
    }
  }
}

function Sync-ManagedSkill {
  param([string]$Source, [string]$Target, [string]$Baseline, [string]$ConflictRoot)
  if (-not (Test-Path -LiteralPath $Source)) { return }
  foreach ($sourceFile in Get-ChildItem -LiteralPath $Source -Recurse -File) {
    $relative = [IO.Path]::GetRelativePath($Source, $sourceFile.FullName)
    $targetFile = Join-Path $Target $relative
    $baselineFile = Join-Path $Baseline $relative
    if (-not (Test-Path -LiteralPath $targetFile)) {
      New-Item -ItemType Directory -Force (Split-Path -Parent $targetFile) | Out-Null
      Copy-Item -LiteralPath $sourceFile.FullName -Destination $targetFile
    }
    elseif ((Test-Path -LiteralPath $baselineFile) -and ((Get-FileHash $targetFile -Algorithm SHA256).Hash -eq (Get-FileHash $baselineFile -Algorithm SHA256).Hash)) {
      Copy-Item -LiteralPath $sourceFile.FullName -Destination $targetFile -Force
    }
    elseif ((Get-FileHash $targetFile -Algorithm SHA256).Hash -ne (Get-FileHash $sourceFile.FullName -Algorithm SHA256).Hash) {
      $incoming = Join-Path $ConflictRoot $relative
      New-Item -ItemType Directory -Force (Split-Path -Parent $incoming) | Out-Null
      Copy-Item -LiteralPath $sourceFile.FullName -Destination $incoming -Force
      Write-Warning "Skill conflict preserved local file: $targetFile; review incoming file: $incoming"
      continue
    }
    New-Item -ItemType Directory -Force (Split-Path -Parent $baselineFile) | Out-Null
    Copy-Item -LiteralPath $sourceFile.FullName -Destination $baselineFile -Force
  }
}

Initialize-SkillBaseline -PackageRoot (Join-Path $plannerRuntime "node_modules\@etherlords\planner-mcp") -RuntimeDirectory $plannerRuntime -Skills @("planner-workflow", "planner-migrate", "planner-upgrade", "planner-ui")
Initialize-SkillBaseline -PackageRoot (Join-Path $vaultRuntime "node_modules\vault-mcp") -RuntimeDirectory $vaultRuntime -Skills @("vault-use", "vault-migrate", "vault-upgrade")

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
foreach ($skill in @("planner-workflow", "planner-migrate", "planner-upgrade", "planner-ui")) {
  Sync-ManagedSkill -Source (Join-Path $plannerPackage ".agents\skills\$skill") -Target (Join-Path $projectRoot ".agents\skills\$skill") -Baseline (Join-Path $plannerRuntime ".skill-baseline\$skill") -ConflictRoot (Join-Path $plannerRuntime ".skill-conflicts\$plannerVersion\$skill")
}
foreach ($skill in @("vault-use", "vault-migrate", "vault-upgrade")) {
  Sync-ManagedSkill -Source (Join-Path $vaultPackage ".agents\skills\$skill") -Target (Join-Path $projectRoot ".agents\skills\$skill") -Baseline (Join-Path $vaultRuntime ".skill-baseline\$skill") -ConflictRoot (Join-Path $vaultRuntime ".skill-conflicts\$vaultVersion\$skill")
}
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
