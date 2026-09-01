param(
  [string]$HostAddress = "0.0.0.0",
  [int]$Port = 4177
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$entrypoint = if ($env:PLANNER_UI_ENTRYPOINT) {
  $env:PLANNER_UI_ENTRYPOINT
} else {
  $packageLink = Get-Item -LiteralPath (Join-Path $projectRoot ".tools\planner-runtime\node_modules\@etherlords\planner-mcp")
  $packageRoot = if ($packageLink.Target) { $packageLink.Target } else { $packageLink.FullName }
  Join-Path $packageRoot "dist\ui.js"
}
if (-not (Test-Path -LiteralPath $entrypoint)) {
  throw "Planner UI runtime is missing. Run scripts/setup-agent-tooling.ps1 first."
}

$env:PLANNER_PROJECT_ROOT = $projectRoot
$env:PLANNER_UI_HOST = $HostAddress
$env:PLANNER_UI_PORT = "$Port"
node $entrypoint
