# Garantiza que el backend esté disponible para los tests E2E.
# - Reutiliza el backend si ya responde en el puerto (no arranca otro).
# - Si no está, arranca el backend NORMAL (nest start -> backend/dist).
#   No crea builds aparte (nada de dist_app).
# - Espera por readiness con polling, en vez de un Start-Sleep fijo.
#
# Uso:
#   powershell -File start-test-backend.ps1
#   powershell -File start-test-backend.ps1 -Port 3010
#   powershell -File start-test-backend.ps1 -Seed    # solo si la DB está vacía

param(
  [int]$Port = 3000,
  [int]$TimeoutSeconds = 120,
  [switch]$Seed
)

$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$nodeLocal = Join-Path $projectRoot ".tools\node"
if (Test-Path $nodeLocal) { $env:PATH = "$nodeLocal;$env:PATH" }
$nodeExe = if (Test-Path (Join-Path $nodeLocal "node.exe")) { Join-Path $nodeLocal "node.exe" } else { "node.exe" }

$backendDir = Join-Path $projectRoot "backend"
$healthUrl = "http://localhost:$Port/api/products?inStock=true"
$outLog = Join-Path $env:TEMP "market-backend.out.log"
$errLog = Join-Path $env:TEMP "market-backend.err.log"

function Test-Backend {
  try {
    Invoke-WebRequest $healthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (Test-Backend) {
  Write-Output "BACKEND_OK (reutilizando el backend en :$Port)"
  exit 0
}

# PostgreSQL debe estar arriba antes de arrancar Nest
try {
  $tcp = New-Object System.Net.Sockets.TcpClient
  $tcp.Connect("localhost", 5432)
  $tcp.Close()
} catch {
  Write-Output "BACKEND_DOWN (PostgreSQL no responde en 5432)"
  exit 1
}

# El seeder es idempotente; por defecto no se fuerza (más rápido).
$env:RUN_SEED = if ($Seed) { 'true' } else { 'false' }
$env:PORT = "$Port"
# Los tests E2E crean cuentas con correos ficticios: no enviar emails reales.
$env:MAIL_LOG_ONLY = 'true'
$env:SMTP_HOST = ''

Write-Output "Arrancando backend normal (nest start, una sola build en dist)..."

$nestBin = Join-Path $backendDir "node_modules\@nestjs\cli\bin\nest.js"
Start-Process -FilePath $nodeExe `
  -ArgumentList $nestBin, 'start' `
  -WorkingDirectory $backendDir `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -NoNewWindow

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $deadline) {
  if (Test-Backend) {
    Write-Output "BACKEND_OK"
    exit 0
  }
  Start-Sleep -Milliseconds 500
}

Write-Output "BACKEND_DOWN (timeout tras $TimeoutSeconds s; ver $errLog)"
exit 1
