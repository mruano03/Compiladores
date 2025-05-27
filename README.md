# Compilador Universitario - Proyecto de Compiladores 2025

**Universidad Mariano Gálvez de Guatemala**  
**Campus Jutiapa - Ingeniería en Sistemas**  
**Curso: Compiladores**

## 🎯 Descripción del Proyecto

Simulador de compilador completo que analiza código en múltiples lenguajes de programación, desarrollado como proyecto universitario. El sistema realiza análisis léxico, sintáctico y semántico, y **ahora incluye compilación y ejecución real** del código.

## 🏗️ Arquitectura del Sistema

### Backend (Go) - Compilación Real
- **Ubicación**: `./compiler-backend/`
- **Tecnología**: Go 1.21+ con Gorilla Mux y CORS
- **Puerto**: 8080
- **Características**:
  - ✅ **Compilación real de C++** usando `g++`
  - ✅ **Ejecución real de Python** usando intérprete Python
  - ✅ **Ejecución real de JavaScript** usando Node.js
  - ✅ **Procesamiento de HTML** con validación
  - ✅ **Análisis avanzado de SQL** (T-SQL/PL-SQL)
  - ✅ **Soporte para Pascal** (con Free Pascal si está disponible)

### Frontend (Next.js) - Interfaz Moderna
- **Ubicación**: Raíz del proyecto
- **Tecnología**: Next.js 14 + TypeScript + Tailwind CSS
- **Puerto**: 3000
- **Características**:
  - 🎨 Interfaz moderna y responsiva
  - 📊 Visualización en tiempo real del análisis
  - 🔄 Conexión API con el backend
  - 📈 Métricas de rendimiento

## 🚀 Lenguajes Soportados

| Lenguaje | Análisis | Compilación Real | Estado |
|----------|----------|------------------|--------|
| **C++** | ✅ Completo | ✅ g++ | 🟢 Funcional |
| **Python** | ✅ Completo | ✅ Intérprete | 🟢 Funcional |
| **JavaScript** | ✅ Completo | ✅ Node.js | 🟢 Funcional |
| **HTML** | ✅ Completo | ✅ Validación | 🟢 Funcional |
| **T-SQL** | ✅ Completo | ✅ Simulación | 🟢 Funcional |
| **PL-SQL** | ✅ Completo | ✅ Simulación | 🟢 Funcional |
| **Pascal** | ✅ Completo | ⚠️ Free Pascal | 🟡 Opcional |

## 🔧 Características del Compilador

### Análisis Completo
- **Análisis Léxico**: Tokenización con expresiones regulares
- **Análisis Sintáctico**: Generación de árbol sintáctico
- **Análisis Semántico**: Tabla de símbolos y verificación de tipos
- **Detección de Errores**: Clasificación por tipo y severidad
- **Ejecución Real**: Compilación y ejecución de código real

### Funcionalidades Avanzadas
- 🔍 **Detección automática de lenguaje**
- ⚡ **Compilación en tiempo real**
- 🛡️ **Sandboxing de seguridad** (timeout de 5 segundos)
- 📊 **Métricas de rendimiento**
- 🗂️ **Gestión de archivos temporales**
- 🌐 **API REST completa**

## 📋 Requisitos del Sistema

### Para Compilación Real
```bash
# C++
sudo apt install g++          # Linux
brew install gcc              # macOS
# Windows: Visual Studio o MinGW

# Python
python3 --version            # Verificar instalación

# JavaScript
node --version               # Verificar Node.js

# Pascal (Opcional)
sudo apt install fpc         # Free Pascal Compiler
```

### Para el Proyecto
- **Go**: 1.21 o superior
- **Node.js**: 18 o superior
- **npm**: Para dependencias del frontend

## 🚀 Instalación y Ejecución

### Opción 1: Script Automático
```bash
# Ejecutar todo el entorno de desarrollo
./start-dev.sh
```

### Opción 2: Manual

#### Backend (Terminal 1)
```bash
cd compiler-backend
go build
./compiler-backend
```

#### Frontend (Terminal 2)
```bash
npm install
npm run dev
```

## 🌐 Endpoints de la API

### Análisis de Código
```http
POST /api/v1/analyze
Content-Type: application/json

{
  "code": "print('Hello World')",
  "language": "python"
}
```

### Estado del Servidor
```http
GET /api/v1/health
```

### Configuración
```http
GET /api/v1/config
```

## 📊 Ejemplos de Uso

### Python - Ejecución Real
```python
def suma(a, b):
    return a + b

resultado = suma(10, 20)
print(f"La suma es: {resultado}")
```

### C++ - Compilación Real
```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "¡Hola Mundo!" << endl;
    return 0;
}
```

### JavaScript - Node.js
```javascript
function saludar(nombre) {
    console.log(`¡Hola ${nombre}!`);
}

saludar("Mundo");
```













