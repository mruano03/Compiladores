package main

import (
	"fmt"
	"strings"
)

// Executor estructura del ejecutor
type Executor struct {
	language string
}

// NewExecutor crea un nuevo ejecutor
func NewExecutor(language string) *Executor {
	return &Executor{
		language: strings.ToLower(language),
	}
}

// Execute simula la ejecución del código
func (e *Executor) Execute(code string, symbolTable []Symbol) ExecutionResult {
	switch e.language {
	case "tsql", "plsql":
		return e.executeSQLCode(code, symbolTable)
	case "python":
		return e.executePythonCode(code, symbolTable)
	case "javascript":
		return e.executeJavaScriptCode(code, symbolTable)
	case "cpp":
		return e.executeCppCode(code, symbolTable)
	case "pascal":
		return e.executePascalCode(code, symbolTable)
	case "html":
		return e.executeHTMLCode(code, symbolTable)
	default:
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Lenguaje no soportado para ejecución: " + e.language,
		}
	}
}

// executeSQLCode simula la ejecución de código SQL
func (e *Executor) executeSQLCode(code string, symbolTable []Symbol) ExecutionResult {
	code = strings.TrimSpace(strings.ToLower(code))

	if strings.HasPrefix(code, "create table") {
		return e.executeCreateTable(code)
	} else if strings.HasPrefix(code, "select") {
		return e.executeSelect(code)
	} else if strings.HasPrefix(code, "insert") {
		return e.executeInsert(code)
	} else if strings.HasPrefix(code, "update") {
		return e.executeUpdate(code)
	} else if strings.HasPrefix(code, "delete") {
		return e.executeDelete(code)
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Comando SQL ejecutado correctamente",
		Error:   "",
	}
}

// executeCreateTable simula la creación de una tabla
func (e *Executor) executeCreateTable(code string) ExecutionResult {
	// Extraer nombre de la tabla
	parts := strings.Fields(code)
	if len(parts) >= 3 {
		tableName := parts[2]
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("✅ Tabla '%s' creada exitosamente", tableName),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Tabla creada exitosamente",
		Error:   "",
	}
}

// executeSelect simula una consulta SELECT
func (e *Executor) executeSelect(code string) ExecutionResult {
	return ExecutionResult{
		Success: true,
		Output:  "✅ Consulta SELECT ejecutada\n📊 Resultados: (simulado)\nID | Nombre | Valor\n1  | Ejemplo | 100",
		Error:   "",
	}
}

// executeInsert simula una inserción
func (e *Executor) executeInsert(code string) ExecutionResult {
	return ExecutionResult{
		Success: true,
		Output:  "✅ Registro insertado exitosamente\n📝 1 fila afectada",
		Error:   "",
	}
}

// executeUpdate simula una actualización
func (e *Executor) executeUpdate(code string) ExecutionResult {
	return ExecutionResult{
		Success: true,
		Output:  "✅ Registros actualizados exitosamente\n📝 Filas afectadas: (simulado)",
		Error:   "",
	}
}

// executeDelete simula una eliminación
func (e *Executor) executeDelete(code string) ExecutionResult {
	return ExecutionResult{
		Success: true,
		Output:  "✅ Registros eliminados exitosamente\n📝 Filas afectadas: (simulado)",
		Error:   "",
	}
}

// executePythonCode simula la ejecución de código Python
func (e *Executor) executePythonCode(code string, symbolTable []Symbol) ExecutionResult {
	code = strings.TrimSpace(code)

	if strings.Contains(code, "print(") {
		return e.executePythonPrint(code)
	} else if strings.HasPrefix(code, "def ") {
		return e.executePythonFunction(code)
	} else if strings.Contains(code, "=") && !strings.Contains(code, "==") {
		return e.executePythonAssignment(code)
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Código Python ejecutado correctamente",
		Error:   "",
	}
}

// executePythonPrint simula la función print de Python
func (e *Executor) executePythonPrint(code string) ExecutionResult {
	// Extraer contenido entre paréntesis
	start := strings.Index(code, "(")
	end := strings.LastIndex(code, ")")

	if start != -1 && end != -1 && end > start {
		content := code[start+1 : end]
		content = strings.Trim(content, "\"'")
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("🐍 Python Output:\n%s", content),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "🐍 Python print ejecutado",
		Error:   "",
	}
}

// executePythonFunction simula la definición de una función Python
func (e *Executor) executePythonFunction(code string) ExecutionResult {
	parts := strings.Fields(code)
	if len(parts) >= 2 {
		funcName := strings.TrimSuffix(parts[1], "(")
		funcName = strings.Split(funcName, "(")[0]
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("✅ Función '%s' definida correctamente", funcName),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Función Python definida",
		Error:   "",
	}
}

// executePythonAssignment simula una asignación de variable Python
func (e *Executor) executePythonAssignment(code string) ExecutionResult {
	parts := strings.Split(code, "=")
	if len(parts) >= 2 {
		varName := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("✅ Variable '%s' asignada con valor: %s", varName, value),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Asignación Python ejecutada",
		Error:   "",
	}
}

// executeJavaScriptCode simula la ejecución de código JavaScript
func (e *Executor) executeJavaScriptCode(code string, symbolTable []Symbol) ExecutionResult {
	code = strings.TrimSpace(code)

	if strings.Contains(code, "console.log") {
		return e.executeJSConsoleLog(code)
	} else if strings.HasPrefix(code, "function ") {
		return e.executeJSFunction(code)
	} else if strings.Contains(code, "=") && !strings.Contains(code, "==") {
		return e.executeJSAssignment(code)
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Código JavaScript ejecutado correctamente",
		Error:   "",
	}
}

// executeJSConsoleLog simula console.log de JavaScript
func (e *Executor) executeJSConsoleLog(code string) ExecutionResult {
	start := strings.Index(code, "(")
	end := strings.LastIndex(code, ")")

	if start != -1 && end != -1 && end > start {
		content := code[start+1 : end]
		content = strings.Trim(content, "\"'")
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("🟨 JavaScript Console:\n%s", content),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "🟨 console.log ejecutado",
		Error:   "",
	}
}

// executeJSFunction simula la definición de una función JavaScript
func (e *Executor) executeJSFunction(code string) ExecutionResult {
	parts := strings.Fields(code)
	if len(parts) >= 2 {
		funcName := strings.TrimSuffix(parts[1], "(")
		funcName = strings.Split(funcName, "(")[0]
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("✅ Función JavaScript '%s' definida correctamente", funcName),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Función JavaScript definida",
		Error:   "",
	}
}

// executeJSAssignment simula una asignación de variable JavaScript
func (e *Executor) executeJSAssignment(code string) ExecutionResult {
	parts := strings.Split(code, "=")
	if len(parts) >= 2 {
		varName := strings.TrimSpace(parts[0])
		// Remover palabras clave como var, let, const
		varName = strings.TrimPrefix(varName, "var ")
		varName = strings.TrimPrefix(varName, "let ")
		varName = strings.TrimPrefix(varName, "const ")
		varName = strings.TrimSpace(varName)

		value := strings.TrimSpace(parts[1])
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("✅ Variable JavaScript '%s' asignada con valor: %s", varName, value),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Asignación JavaScript ejecutada",
		Error:   "",
	}
}

// executeCppCode simula la ejecución de código C++
func (e *Executor) executeCppCode(code string, symbolTable []Symbol) ExecutionResult {
	code = strings.TrimSpace(code)

	if strings.Contains(code, "cout") {
		return e.executeCppCout(code)
	} else if strings.Contains(code, "int main") {
		return ExecutionResult{
			Success: true,
			Output:  "✅ Función main() de C++ definida correctamente",
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Código C++ ejecutado correctamente",
		Error:   "",
	}
}

// executeCppCout simula cout de C++
func (e *Executor) executeCppCout(code string) ExecutionResult {
	// Buscar contenido después de <<
	parts := strings.Split(code, "<<")
	if len(parts) >= 2 {
		content := strings.TrimSpace(parts[1])
		content = strings.Trim(content, "\"';")
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("🔵 C++ Output:\n%s", content),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "🔵 cout ejecutado",
		Error:   "",
	}
}

// executePascalCode simula la ejecución de código Pascal
func (e *Executor) executePascalCode(code string, symbolTable []Symbol) ExecutionResult {
	code = strings.TrimSpace(strings.ToLower(code))

	if strings.Contains(code, "writeln") {
		return e.executePascalWriteln(code)
	} else if strings.HasPrefix(code, "program ") {
		return ExecutionResult{
			Success: true,
			Output:  "✅ Programa Pascal definido correctamente",
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Código Pascal ejecutado correctamente",
		Error:   "",
	}
}

// executePascalWriteln simula writeln de Pascal
func (e *Executor) executePascalWriteln(code string) ExecutionResult {
	start := strings.Index(code, "(")
	end := strings.LastIndex(code, ")")

	if start != -1 && end != -1 && end > start {
		content := code[start+1 : end]
		content = strings.Trim(content, "\"'")
		return ExecutionResult{
			Success: true,
			Output:  fmt.Sprintf("🟣 Pascal Output:\n%s", content),
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "🟣 writeln ejecutado",
		Error:   "",
	}
}

// executeHTMLCode simula la "ejecución" de código HTML
func (e *Executor) executeHTMLCode(code string, symbolTable []Symbol) ExecutionResult {
	code = strings.TrimSpace(code)

	if strings.Contains(code, "<") && strings.Contains(code, ">") {
		return ExecutionResult{
			Success: true,
			Output:  "✅ Elemento HTML renderizado correctamente\n🌐 El contenido se mostraría en un navegador web",
			Error:   "",
		}
	}

	return ExecutionResult{
		Success: true,
		Output:  "✅ Código HTML procesado correctamente",
		Error:   "",
	}
}
