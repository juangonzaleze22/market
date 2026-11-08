$projectRoot = $PSScriptRoot
$nodeLocal = Join-Path $projectRoot ".tools\node"
if (Test-Path $nodeLocal) { $env:PATH = "$nodeLocal;$env:PATH" }

$backendScript = Join-Path $projectRoot "start-backend.ps1"
$frontendScript = Join-Path $projectRoot "start-frontend.ps1"
$mailScript = Join-Path $projectRoot "start-maildev.ps1"

Write-Host "Abriendo MailDev (buzón local) en nueva ventana..." -ForegroundColor Magenta
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$mailScript`"" -WorkingDirectory $projectRoot

Write-Host "Abriendo Backend en nueva ventana..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$backendScript`"" -WorkingDirectory $projectRoot

Start-Sleep -Seconds 2

Write-Host "Abriendo Frontend en nueva ventana..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$frontendScript`"" -WorkingDirectory $projectRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host " Backend  -> Puerto 3000 (API: /api)" -ForegroundColor Green
Write-Host " Frontend -> Puerto 4200" -ForegroundColor Cyan
Write-Host " MailDev  -> http://localhost:1080 (SMTP :1025)" -ForegroundColor Magenta
Write-Host " Swagger  -> http://localhost:3000/api/docs" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Cierra las ventanas de PowerShell para detener." -ForegroundColor Gray
