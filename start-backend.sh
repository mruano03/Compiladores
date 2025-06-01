#!/bin/bash

echo "🚀 Iniciando el servidor backend del compilador..."

# Navegar al directorio del backend
cd compiler-backend

# Descargar dependencias si no existen
if [ ! -f "go.sum" ]; then
    echo "📦 Descargando dependencias de Go..."
    go mod tidy
fi

# Verificar que los compiladores estén instalados
echo "🔍 Verificando dependencias del sistema..."

# Verificar g++
if ! command -v g++ &> /dev/null; then
    echo "❌ g++ no está instalado. Es necesario para compilar C++."
    echo "   macOS: brew install gcc"
    echo "   Ubuntu: sudo apt install g++"
    exit 1
fi

# Verificar node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Es necesario para ejecutar JavaScript."
    echo "   Instalar desde: https://nodejs.org/"
    exit 1
fi

# Verificar python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Es necesario para ejecutar Python."
    echo "   macOS: brew install python"
    echo "   Ubuntu: sudo apt install python3"
    exit 1
fi

echo "✅ Todas las dependencias están instaladas"

# Configurar variables de entorno
export PORT=8080

# Ejecutar el servidor
echo "🌟 Iniciando servidor en puerto $PORT..."
go run main.go compiler.go 