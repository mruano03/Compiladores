# Iniciando el entorno de desarrollo del Compilador
Write-Host "🚀 Iniciando entorno de desarrollo del Compilador..."

# Función para limpiar procesos al salir
function Cleanup {
    Write-Host "🛑 Deteniendo servidores..."
    Stop-Process -Id $BACKEND_PID -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $FRONTEND_PID -Force -ErrorAction SilentlyContinue
}

# Verificar que Go esté instalado
if (!(Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Go no está instalado. Por favor instala Go 1.21 o superior."
    exit 1
}

# Verificar que Node.js esté instalado
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
}

# Verificar que npm esté instalado
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm no está instalado. Por favor instala npm."
    exit 1
}

Write-Host "✅ Verificando dependencias..."

# Iniciar el backend con Go
Write-Host "🟢 Iniciando backend en puerto 8080..."
Set-Location -Path "compiler-backend"
$backendProcess = Start-Process -FilePath "go" -ArgumentList "run main.go compiler.go" -PassThru
$BACKEND_PID = $backendProcess.Id

# Esperar un momento para que el backend inicie
Start-Sleep -Seconds 2

# Verificar que el backend esté funcionando
try {
    Invoke-WebRequest -Uri "http://localhost:8080/api/v1/health" -UseBasicParsing
    Write-Host "✅ Backend iniciado correctamente"
} catch {
    Write-Host "❌ Error: El backend no responde"
    Cleanup
    exit 1
}

# Volver al directorio raíz
Set-Location -Path ".."

# Verificar que las dependencias del frontend estén instaladas
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias del frontend..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias del frontend"
        Cleanup
        exit 1
    }
}

# Iniciar el frontend
Write-Host "🟦 Iniciando frontend en puerto 3000..."
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -PassThru
$FRONTEND_PID = $frontendProcess.Id

Write-Host ""
Write-Host "🎉 ¡Entorno de desarrollo iniciado!"
Write-Host ""
Write-Host "📍 URLs disponibles:"
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Backend: http://localhost:8080"
Write-Host "   API Health: http://localhost:8080/api/v1/health"
Write-Host ""
Write-Host "💡 Para detener ambos servidores, cierra esta ventana de PowerShell manualmente."
Write-Host ""

# Mantener el script abierto hasta que el usuario lo cierre
try {
    while ($true) {
        Start-Sleep -Seconds 5
    }
} finally {
    Cleanup
}