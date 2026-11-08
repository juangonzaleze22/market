$projectRoot = $PSScriptRoot
$nodeLocal = Join-Path $projectRoot ".tools\node"
if (Test-Path $nodeLocal) { $env:PATH = "$nodeLocal;$env:PATH" }
$frontendDir = Join-Path $projectRoot "frontend"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " FRONTEND - Market Angular" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $frontendDir

Write-Host "Iniciando Angular dev server..." -ForegroundColor Gray
Write-Host ""
& npm.cmd start
