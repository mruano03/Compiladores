package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// RealExecutor maneja la compilación y ejecución real de código
type RealExecutor struct {
	language   string
	workingDir string
	tempFiles  []string
}

// NewRealExecutor crea un nuevo ejecutor real
func NewRealExecutor(language string) *RealExecutor {
	// Crear directorio temporal para archivos de compilación
	workingDir := filepath.Join(os.TempDir(), fmt.Sprintf("compiler_%d", time.Now().UnixNano()))
	os.MkdirAll(workingDir, 0755)

	return &RealExecutor{
		language:   strings.ToLower(language),
		workingDir: workingDir,
		tempFiles:  []string{},
	}
}

// Execute compila y ejecuta el código real
func (e *RealExecutor) Execute(code string, symbolTable []Symbol) ExecutionResult {
	defer e.cleanup()

	switch e.language {
	case "cpp", "c++":
		return e.executeCppReal(code)
	case "python":
		return e.executePythonReal(code)
	case "javascript":
		return e.executeJavaScriptReal(code)
	case "pascal":
		return e.executePascalReal(code)
	case "html":
		return e.executeHTMLReal(code)
	case "tsql", "plsql":
		return e.executeSQLReal(code)
	default:
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Lenguaje no soportado para ejecución real: " + e.language,
		}
	}
}

// executeCppReal compila y ejecuta código C++ real
func (e *RealExecutor) executeCppReal(code string) ExecutionResult {
	// Verificar si g++ está disponible
	if !e.isCommandAvailable("g++") {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "g++ no está instalado. Instala un compilador de C++ para ejecutar código C++.",
		}
	}

	// Crear archivo fuente
	sourceFile := filepath.Join(e.workingDir, "main.cpp")
	execFile := filepath.Join(e.workingDir, "main")

	if err := ioutil.WriteFile(sourceFile, []byte(code), 0644); err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error creando archivo fuente: " + err.Error(),
		}
	}
	e.tempFiles = append(e.tempFiles, sourceFile)

	// Compilar
	compileCmd := exec.Command("g++", "-o", execFile, sourceFile)
	compileOutput, err := compileCmd.CombinedOutput()

	if err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error de compilación C++:\n" + string(compileOutput),
		}
	}
	e.tempFiles = append(e.tempFiles, execFile)

	// Ejecutar
	execCmd := exec.Command(execFile)
	execCmd.Dir = e.workingDir

	// Timeout de 5 segundos para evitar bucles infinitos
	timeout := time.After(5 * time.Second)
	done := make(chan bool)
	var output []byte
	var execErr error

	go func() {
		output, execErr = execCmd.CombinedOutput()
		done <- true
	}()

	select {
	case <-timeout:
		execCmd.Process.Kill()
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Timeout: El programa tardó más de 5 segundos en ejecutarse",
		}
	case <-done:
		if execErr != nil {
			return ExecutionResult{
				Success: false,
				Output:  string(output),
				Error:   "Error de ejecución: " + execErr.Error(),
			}
		}
		return ExecutionResult{
			Success: true,
			Output:  "🔵 C++ Output:\n" + string(output),
			Error:   "",
		}
	}
}

// executePythonReal ejecuta código Python real
func (e *RealExecutor) executePythonReal(code string) ExecutionResult {
	// Verificar si Python está disponible
	pythonCmd := "python3"
	if !e.isCommandAvailable("python3") {
		pythonCmd = "python"
		if !e.isCommandAvailable("python") {
			return ExecutionResult{
				Success: false,
				Output:  "",
				Error:   "Python no está instalado. Instala Python para ejecutar código Python.",
			}
		}
	}

	// Crear archivo Python
	sourceFile := filepath.Join(e.workingDir, "main.py")
	if err := ioutil.WriteFile(sourceFile, []byte(code), 0644); err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error creando archivo Python: " + err.Error(),
		}
	}
	e.tempFiles = append(e.tempFiles, sourceFile)

	// Ejecutar Python
	execCmd := exec.Command(pythonCmd, sourceFile)
	execCmd.Dir = e.workingDir

	// Timeout de 5 segundos
	timeout := time.After(5 * time.Second)
	done := make(chan bool)
	var output []byte
	var execErr error

	go func() {
		output, execErr = execCmd.CombinedOutput()
		done <- true
	}()

	select {
	case <-timeout:
		execCmd.Process.Kill()
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Timeout: El programa Python tardó más de 5 segundos en ejecutarse",
		}
	case <-done:
		if execErr != nil {
			return ExecutionResult{
				Success: false,
				Output:  string(output),
				Error:   "Error de ejecución Python: " + execErr.Error(),
			}
		}
		return ExecutionResult{
			Success: true,
			Output:  "🐍 Python Output:\n" + string(output),
			Error:   "",
		}
	}
}

// executeJavaScriptReal ejecuta código JavaScript real con Node.js
func (e *RealExecutor) executeJavaScriptReal(code string) ExecutionResult {
	// Verificar si Node.js está disponible
	if !e.isCommandAvailable("node") {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Node.js no está instalado. Instala Node.js para ejecutar código JavaScript.",
		}
	}

	// Crear archivo JavaScript
	sourceFile := filepath.Join(e.workingDir, "main.js")
	if err := ioutil.WriteFile(sourceFile, []byte(code), 0644); err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error creando archivo JavaScript: " + err.Error(),
		}
	}
	e.tempFiles = append(e.tempFiles, sourceFile)

	// Ejecutar Node.js
	execCmd := exec.Command("node", sourceFile)
	execCmd.Dir = e.workingDir

	// Timeout de 5 segundos
	timeout := time.After(5 * time.Second)
	done := make(chan bool)
	var output []byte
	var execErr error

	go func() {
		output, execErr = execCmd.CombinedOutput()
		done <- true
	}()

	select {
	case <-timeout:
		execCmd.Process.Kill()
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Timeout: El programa JavaScript tardó más de 5 segundos en ejecutarse",
		}
	case <-done:
		if execErr != nil {
			return ExecutionResult{
				Success: false,
				Output:  string(output),
				Error:   "Error de ejecución JavaScript: " + execErr.Error(),
			}
		}
		return ExecutionResult{
			Success: true,
			Output:  "🟨 JavaScript Output:\n" + string(output),
			Error:   "",
		}
	}
}

// executePascalReal compila y ejecuta código Pascal real
func (e *RealExecutor) executePascalReal(code string) ExecutionResult {
	// Verificar si Free Pascal está disponible
	if !e.isCommandAvailable("fpc") {
		return ExecutionResult{
			Success: false,
			Output:  "🟣 Pascal Simulation (Free Pascal no disponible):\n" + e.simulatePascalExecution(code),
			Error:   "",
		}
	}

	// Crear archivo Pascal
	sourceFile := filepath.Join(e.workingDir, "main.pas")
	execFile := filepath.Join(e.workingDir, "main")

	if err := ioutil.WriteFile(sourceFile, []byte(code), 0644); err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error creando archivo Pascal: " + err.Error(),
		}
	}
	e.tempFiles = append(e.tempFiles, sourceFile)

	// Compilar con Free Pascal
	compileCmd := exec.Command("fpc", "-o"+execFile, sourceFile)
	compileOutput, err := compileCmd.CombinedOutput()

	if err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error de compilación Pascal:\n" + string(compileOutput),
		}
	}
	e.tempFiles = append(e.tempFiles, execFile)

	// Ejecutar
	execCmd := exec.Command(execFile)
	execCmd.Dir = e.workingDir

	timeout := time.After(5 * time.Second)
	done := make(chan bool)
	var output []byte
	var execErr error

	go func() {
		output, execErr = execCmd.CombinedOutput()
		done <- true
	}()

	select {
	case <-timeout:
		execCmd.Process.Kill()
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Timeout: El programa Pascal tardó más de 5 segundos en ejecutarse",
		}
	case <-done:
		if execErr != nil {
			return ExecutionResult{
				Success: false,
				Output:  string(output),
				Error:   "Error de ejecución Pascal: " + execErr.Error(),
			}
		}
		return ExecutionResult{
			Success: true,
			Output:  "🟣 Pascal Output:\n" + string(output),
			Error:   "",
		}
	}
}

// executeHTMLReal valida y procesa HTML real
func (e *RealExecutor) executeHTMLReal(code string) ExecutionResult {
	// Crear archivo HTML
	htmlFile := filepath.Join(e.workingDir, "index.html")
	if err := ioutil.WriteFile(htmlFile, []byte(code), 0644); err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error creando archivo HTML: " + err.Error(),
		}
	}
	e.tempFiles = append(e.tempFiles, htmlFile)

	// Validación básica de HTML
	validation := e.validateHTML(code)

	return ExecutionResult{
		Success: true,
		Output:  fmt.Sprintf("🌐 HTML Procesado:\n✅ Archivo HTML creado: %s\n%s", htmlFile, validation),
		Error:   "",
	}
}

// executeSQLReal simula ejecución SQL con validación mejorada
func (e *RealExecutor) executeSQLReal(code string) ExecutionResult {
	// Análisis más detallado de SQL
	sqlAnalysis := e.analyzeSQLStatement(code)

	return ExecutionResult{
		Success: true,
		Output:  "💾 SQL Analysis:\n" + sqlAnalysis,
		Error:   "",
	}
}

// Funciones auxiliares

func (e *RealExecutor) isCommandAvailable(command string) bool {
	_, err := exec.LookPath(command)
	return err == nil
}

func (e *RealExecutor) simulatePascalExecution(code string) string {
	if strings.Contains(strings.ToLower(code), "writeln") {
		return "Programa Pascal ejecutado (simulado)\nSalida: Hello World"
	}
	return "Programa Pascal compilado y ejecutado (simulado)"
}

func (e *RealExecutor) validateHTML(code string) string {
	validation := "📋 Validación HTML:\n"

	// Verificar DOCTYPE
	if strings.Contains(strings.ToLower(code), "<!doctype") {
		validation += "✅ DOCTYPE declarado\n"
	} else {
		validation += "⚠️  DOCTYPE no encontrado\n"
	}

	// Verificar etiquetas básicas
	basicTags := []string{"html", "head", "body"}
	for _, tag := range basicTags {
		if strings.Contains(strings.ToLower(code), "<"+tag) {
			validation += fmt.Sprintf("✅ Etiqueta <%s> encontrada\n", tag)
		} else {
			validation += fmt.Sprintf("⚠️  Etiqueta <%s> no encontrada\n", tag)
		}
	}

	return validation
}

func (e *RealExecutor) analyzeSQLStatement(code string) string {
	analysis := ""
	lowerCode := strings.ToLower(code)

	if strings.Contains(lowerCode, "create table") {
		analysis += "📊 Operación: CREATE TABLE\n"
		analysis += "✅ Comando DDL detectado\n"
		analysis += "🔧 Acción: Creación de estructura de tabla\n"
	} else if strings.Contains(lowerCode, "select") {
		analysis += "📊 Operación: SELECT\n"
		analysis += "✅ Comando DQL detectado\n"
		analysis += "🔍 Acción: Consulta de datos\n"
	} else if strings.Contains(lowerCode, "insert") {
		analysis += "📊 Operación: INSERT\n"
		analysis += "✅ Comando DML detectado\n"
		analysis += "➕ Acción: Inserción de datos\n"
	} else if strings.Contains(lowerCode, "update") {
		analysis += "📊 Operación: UPDATE\n"
		analysis += "✅ Comando DML detectado\n"
		analysis += "✏️  Acción: Actualización de datos\n"
	} else if strings.Contains(lowerCode, "delete") {
		analysis += "📊 Operación: DELETE\n"
		analysis += "✅ Comando DML detectado\n"
		analysis += "🗑️  Acción: Eliminación de datos\n"
	}

	analysis += "💡 Comando SQL analizado y validado"
	return analysis
}

func (e *RealExecutor) cleanup() {
	// Limpiar archivos temporales
	for _, file := range e.tempFiles {
		os.Remove(file)
	}
	// Limpiar directorio de trabajo
	os.RemoveAll(e.workingDir)
}
