# Iniciando el servidor backend del compilador
Write-Host "🚀 Iniciando el servidor backend del compilador..."

# Navegar al directorio del backend
Set-Location -Path "compiler-backend"

# Descargar dependencias si no existen
if (!(Test-Path "go.sum")) {
    Write-Host "📦 Descargando dependencias de Go..."
    go mod tidy
}

# Verificar que los compiladores estén instalados
Write-Host "🔍 Verificando dependencias del sistema..."

# Verificar g++
if (!(Get-Command g++ -ErrorAction SilentlyContinue)) {
    Write-Host "❌ g++ no está instalado. Es necesario para compilar C++."
    Write-Host "   Instalar desde: https://sourceforge.net/projects/mingw-w64/"
    exit 1
}

# Verificar node
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado. Es necesario para ejecutar JavaScript."
    Write-Host "   Instalar desde: https://nodejs.org/"
    exit 1
}

# Verificar python3
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python 3 no está instalado. Es necesario para ejecutar Python."
    Write-Host "   Instalar desde: https://www.python.org/downloads/"
    exit 1
}

Write-Host "✅ Todas las dependencias están instaladas"

# Configurar variables de entorno
$env:PORT=8080

# Ejecutar el servidor
Write-Host "🌟 Iniciando servidor en puerto $env:PORT..."
go run main.go compiler.go