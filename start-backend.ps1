$projectRoot = $PSScriptRoot
$nodeLocal = Join-Path $projectRoot ".tools\node"
if (Test-Path $nodeLocal) { $env:PATH = "$nodeLocal;$env:PATH" }
$backendDir = Join-Path $projectRoot "backend"

Write-Host "============================================" -ForegroundColor Green
Write-Host " BACKEND - Market API" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Set-Location $backendDir

Write-Host "[1/2] Verificando PostgreSQL..." -ForegroundColor Gray
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("localhost", 5432)
    $tcp.Close()
    Write-Host "  PostgreSQL OK (puerto 5432)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: PostgreSQL no esta corriendo en puerto 5432" -ForegroundColor Red
    Write-Host "  Inicia PostgreSQL antes de continuar." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "[2/2] Iniciando NestJS..." -ForegroundColor Gray
Write-Host ""
& npm.cmd run start:dev
