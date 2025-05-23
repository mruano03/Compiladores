# Compilador - Proyecto en grupo 

Un compilador avanzado desarrollado en Next.js que implementa análisis léxico, sintáctico y semántico para múltiples lenguajes de programación.

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas

- **Análisis Léxico**: Identificación y clasificación de tokens
- **Análisis Sintáctico**: Verificación de estructura y gramática
- **Análisis Semántico**: Validación de tipos y semántica del código
- **Detección Automática de Lenguaje**: Basada en contenido y extensión de archivo
- **Tabla de Símbolos**: Gestión de variables, funciones y constantes
- **Simulación de Ejecución**: Interpretación básica del código analizado
- **Interfaz Moderna**: Editor con resaltado de sintaxis y análisis en tiempo real
- **Soporte Multi-lenguaje**: 7 lenguajes de programación soportados

### 🔧 Lenguajes Soportados

1. **JavaScript** - Análisis completo con detección de ES6+
2. **Python** - Verificación de indentación y sintaxis
3. **C++** - Validación de includes y función main
4. **HTML** - Verificación de etiquetas balanceadas
5. **Pascal** - Análisis de BEGIN/END y procedimientos
6. **PL/SQL** - Comandos SQL y procedimientos almacenados
7. **T-SQL** - Sintaxis específica de SQL Server

### 📊 Tipos de Análisis

#### Análisis Léxico
- Clasificación de tokens por tipo
- Identificación de palabras reservadas
- Detección de operadores y delimitadores
- Manejo de cadenas y números
- Identificación de comentarios

#### Análisis Sintáctico
- Verificación de símbolos balanceados
- Validación de declaraciones de funciones
- Verificación de estructura específica por lenguaje
- Detección de errores de sintaxis

#### Análisis Semántico
- Verificación de variables declaradas
- Validación de llamadas a funciones
- Compatibilidad de tipos básica
- Análisis de alcance de variables

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Editor**: Monaco Editor (VS Code)
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Análisis**: Expresiones regulares personalizadas
- **Temas**: next-themes para modo claro/oscuro

## 📁 Estructura del Proyecto

```
Compiladores/
├── app/                    # Aplicación Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── ui/               # Componentes de interfaz
│   ├── code-editor.tsx   # Editor de código
│   ├── code-analisis.tsx # Panel de análisis
│   ├── editor-layout.tsx # Layout del editor
│   ├── file-upload.tsx   # Subida de archivos
│   └── headert.tsx       # Header de la aplicación
├── lib/                  # Utilidades y lógica
│   ├── compiler-analyzer.ts    # Analizador principal
│   ├── language-detector.ts    # Detector de lenguajes
│   ├── code-analyzer.ts        # Análisis básico
│   └── constants.ts            # Constantes
└── hooks/                # Hooks personalizados
    └── use-toast.ts      # Hook para notificaciones
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/mruano03/Compiladores.git
cd Compiladores
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

### Uso de la Aplicación

1. **Escribir Código**: Usa el editor de la izquierda para escribir o pegar código
2. **Subir Archivos**: Haz clic en el botón de subir para cargar archivos (.txt, .js, .py, .cpp, .html, .sql, .pas)
3. **Análisis Automático**: El análisis se ejecuta en tiempo real
4. **Ver Resultados**: Revisa los paneles de la derecha para:
   - Errores del compilador
   - Tabla de tokens
   - Tabla de símbolos
   - Resultado de ejecución
   - Estadísticas del código

## 📋 Funcionalidades por Panel

### Panel Compilador
- Resumen de errores por tipo (léxico, sintáctico, semántico)
- Detalles de cada error con ubicación
- Estado de ejecución del código

### Panel Tokens
- Lista completa de tokens identificados
- Clasificación por tipo
- Ubicación línea/columna

### Panel Símbolos
- Variables, funciones y constantes
- Tipos de datos detectados
- Ámbito y ubicación

### Panel Ejecución
- Simulación de ejecución del código
- Resultados de operaciones básicas
- Estado de ejecución

### Panel Estadísticas
- Métricas del código (líneas, caracteres, palabras)
- Complejidad calculada
- Número de funciones

## 🎯 Casos de Uso

### Ejemplo JavaScript
```javascript
function calcularFactorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * calcularFactorial(n - 1);
}

console.log(calcularFactorial(5));
```

### Ejemplo SQL
```sql
CREATE TABLE usuarios (
  id INT PRIMARY KEY,
  nombre VARCHAR(50),
  email VARCHAR(100)
);

INSERT INTO usuarios VALUES (1, 'Juan', 'juan@email.com');
```

### Ejemplo Python
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```
