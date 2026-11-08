$projectRoot = $PSScriptRoot
$nodeLocal = Join-Path $projectRoot ".tools\node"
if (Test-Path $nodeLocal) { $env:PATH = "$nodeLocal;$env:PATH" }
$backendDir = Join-Path $projectRoot "backend"

Write-Host "============================================" -ForegroundColor Magenta
Write-Host " MAILDEV - Buzón local de correos" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""
Write-Host " SMTP -> localhost:1025" -ForegroundColor Green
Write-Host " UI   -> http://localhost:1080" -ForegroundColor Cyan
Write-Host ""

Set-Location $backendDir
& npm.cmd run mail:dev
