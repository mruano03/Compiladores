#!/bin/bash

# Script para iniciar el entorno de desarrollo completo
# Inicia tanto el backend en Go como el frontend en Next.js

echo "🚀 Iniciando entorno de desarrollo del Compilador..."

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar señales para limpiar al salir
trap cleanup SIGINT SIGTERM

# Verificar que Go esté instalado
if ! command -v go &> /dev/null; then
    echo "❌ Go no está instalado. Por favor instala Go 1.21 o superior."
    exit 1
fi

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 18 o superior."
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm."
    exit 1
fi

echo "✅ Verificando dependencias..."

# Compilar el backend si es necesario
echo "🔧 Compilando backend..."
cd compiler-backend
if [ ! -f "./compiler-backend" ]; then
    go build
    if [ $? -ne 0 ]; then
        echo "❌ Error compilando el backend"
        exit 1
    fi
fi

# Iniciar el backend
echo "🟢 Iniciando backend en puerto 8080..."
./compiler-backend &
BACKEND_PID=$!

# Esperar un momento para que el backend inicie
sleep 2

# Verificar que el backend esté funcionando
if curl -s http://localhost:8080/api/v1/health > /dev/null; then
    echo "✅ Backend iniciado correctamente"
else
    echo "❌ Error: El backend no responde"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Volver al directorio raíz
cd ..

# Verificar que las dependencias del frontend estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias del frontend"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
fi

# Iniciar el frontend
echo "🟦 Iniciando frontend en puerto 3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 ¡Entorno de desarrollo iniciado!"
echo ""
echo "📍 URLs disponibles:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   API Health: http://localhost:8080/api/v1/health"
echo ""
echo "💡 Presiona Ctrl+C para detener ambos servidores"
echo ""

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID 