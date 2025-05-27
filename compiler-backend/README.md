# Compilador Backend - API REST en Go

Este es el backend que funciona como api para el compilador frontend.

## Características

- **Análisis Léxico**: Tokenización de código fuente
- **Análisis Sintáctico**: Generación de árbol sintáctico
- **Análisis Semántico**: Verificación de tipos y tabla de símbolos
- **Simulación de Ejecución**: Ejecución simulada del código
- **Detección Automática de Lenguaje**: Identifica el lenguaje automáticamente

## Lenguajes Soportados

- C++
- HTML
- JavaScript
- Pascal
- PL/SQL
- Python
- T-SQL

## API Endpoints

### POST /api/v1/analyze
Analiza el código proporcionado y devuelve el resultado completo del compilador.

**Request Body:**
```json
{
  "code": "print('Hello World')",
  "language": "python"
}
```

**Response:**
```json
{
  "language": "python",
  "tokens": [...],
  "parseTree": [...],
  "symbolTable": [...],
  "errors": [...],
  "canExecute": true,
  "analysisPhases": {
    "lexical": {...},
    "syntax": {...},
    "semantic": {...}
  },
  "executionResult": {...},
  "processingTime": "2.5ms"
}
```

### GET /api/v1/health
Verifica el estado del servidor.

## Instalación y Ejecución

1. **Instalar dependencias:**
   ```bash
   go mod tidy
   ```

2. **Compilar el proyecto:**
   ```bash
   go build
   ```

3. **Ejecutar el servidor:**
   ```bash
   ./compiler-backend
   ```
   
   O directamente:
   ```bash
   go run .
   ```

El servidor se ejecutará en el puerto 8080 por defecto.

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 8080)

## Estructura del Proyecto

```
compiler-backend/
├── main.go          # Servidor HTTP principal
├── types.go         # Definiciones de tipos y estructuras
├── lexer.go         # Analizador léxico
├── parser.go        # Analizador sintáctico
├── semantic.go      # Analizador semántico
├── executor.go      # Simulador de ejecución
├── analyzer.go      # Coordinador principal
├── go.mod           # Dependencias de Go
```

## Ejemplos de Uso

### Análisis de código Python:
```bash
curl -X POST http://localhost:8080/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "def hello():\n    print(\"Hello World\")", "language": "python"}'
```

### Análisis de código SQL:
```bash
curl -X POST http://localhost:8080/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "CREATE TABLE usuarios (id INT, nombre VARCHAR(50))", "language": "tsql"}'
```


## Arquitectura

El compilador sigue la arquitectura clásica de compiladores:

1. **Análisis Léxico** → Convierte el código fuente en tokens
2. **Análisis Sintáctico** → Genera el árbol sintáctico abstracto
3. **Análisis Semántico** → Verifica tipos y construye tabla de símbolos
4. **Generación de Código** → Simula la ejecución del código

## CORS

El servidor está configurado para aceptar requests desde:
- http://localhost:3000
