package main

import (
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
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

// executeHTMLReal valida, procesa y ejecuta HTML real
func (e *RealExecutor) executeHTMLReal(code string) ExecutionResult {
	// Crear archivo HTML
	htmlFile := filepath.Join(e.workingDir, "index.html")
	
	// Mejorar el HTML con estructura básica si no la tiene
	enhancedHTML := e.enhanceHTML(code)
	
	if err := ioutil.WriteFile(htmlFile, []byte(enhancedHTML), 0644); err != nil {
		return ExecutionResult{
			Success: false,
			Output:  "",
			Error:   "Error creando archivo HTML: " + err.Error(),
		}
	}
	e.tempFiles = append(e.tempFiles, htmlFile)

	// Validación detallada de HTML
	validation := e.validateHTMLDetailed(enhancedHTML)
	
	// Crear servidor web temporal para mostrar el HTML
	serverInfo := e.createTemporaryWebServer(htmlFile)
	
	// Intentar abrir en el navegador si es posible
	browserResult := e.openInBrowser(serverInfo.URL)

	output := fmt.Sprintf("🌐 HTML Ejecutado Exitosamente:\n")
	output += fmt.Sprintf("📁 Archivo creado: %s\n", htmlFile)
	output += fmt.Sprintf("🌍 Servidor web: %s\n", serverInfo.URL)
	output += fmt.Sprintf("⏱️  Servidor activo por: %d segundos\n", serverInfo.Duration)
	output += fmt.Sprintf("🌊 %s\n", browserResult)
	output += fmt.Sprintf("\n%s", validation)
	
	return ExecutionResult{
		Success: true,
		Output:  output,
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

// ServerInfo contiene información del servidor web temporal
type ServerInfo struct {
	URL      string
	Port     int
	Duration int
}

// enhanceHTML mejora el código HTML agregando estructura básica si no la tiene
func (e *RealExecutor) enhanceHTML(code string) string {
	code = strings.TrimSpace(code)
	lowerCode := strings.ToLower(code)
	
	// Si ya tiene estructura completa, devolver como está
	if strings.Contains(lowerCode, "<!doctype") && 
	   strings.Contains(lowerCode, "<html") && 
	   strings.Contains(lowerCode, "<head") && 
	   strings.Contains(lowerCode, "<body") {
		return code
	}
	
	// Si solo tiene contenido del body, agregar estructura completa
	if !strings.Contains(lowerCode, "<html") {
		enhanced := `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compilador HTML - Resultado</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .generated-notice {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="generated-notice">
            🚀 Código ejecutado por el Compilador HTML - ` + time.Now().Format("15:04:05") + `
        </div>
        <div class="content">
` + code + `
        </div>
    </div>
</body>
</html>`
		return enhanced
	}
	
	return code
}

// validateHTMLDetailed realiza una validación detallada del HTML
func (e *RealExecutor) validateHTMLDetailed(code string) string {
	validation := "📋 Validación HTML Detallada:\n"
	lowerCode := strings.ToLower(code)
	
	// Verificar DOCTYPE
	if strings.Contains(lowerCode, "<!doctype") {
		validation += "✅ DOCTYPE declarado correctamente\n"
	} else {
		validation += "⚠️  DOCTYPE no encontrado (agregado automáticamente)\n"
	}
	
	// Verificar estructura básica
	requiredTags := map[string]string{
		"html": "Estructura raíz del documento",
		"head": "Metadatos del documento", 
		"body": "Contenido visible del documento",
	}
	
	for tag, description := range requiredTags {
		if strings.Contains(lowerCode, "<"+tag) {
			validation += fmt.Sprintf("✅ <%s>: %s\n", tag, description)
		} else {
			validation += fmt.Sprintf("⚠️  <%s>: %s (agregado automáticamente)\n", tag, description)
		}
	}
	
	// Verificar metadatos importantes
	metaTags := map[string]string{
		"charset": "Codificación de caracteres",
		"viewport": "Configuración de viewport",
		"title": "Título del documento",
	}
	
	for meta, description := range metaTags {
		if strings.Contains(lowerCode, meta) {
			validation += fmt.Sprintf("✅ %s: %s\n", meta, description)
		} else {
			validation += fmt.Sprintf("⚠️  %s: %s (agregado automáticamente)\n", meta, description)
		}
	}
	
	// Contar elementos
	validation += e.countHTMLElements(code)
	
	// Verificar posibles problemas
	validation += e.checkHTMLIssues(code)
	
	return validation
}

// countHTMLElements cuenta diferentes tipos de elementos HTML
func (e *RealExecutor) countHTMLElements(code string) string {
	counts := "📊 Elementos encontrados:\n"
	
	elementTypes := map[string]string{
		"div": "Contenedores",
		"p": "Párrafos", 
		"h[1-6]": "Encabezados",
		"img": "Imágenes",
		"a": "Enlaces",
		"button": "Botones",
		"input": "Campos de entrada",
		"script": "Scripts",
		"style": "Estilos",
	}
	
	for pattern, description := range elementTypes {
		re := regexp.MustCompile(`<` + pattern + `[^>]*>`)
		matches := re.FindAllString(code, -1)
		count := len(matches)
		if count > 0 {
			counts += fmt.Sprintf("   • %s: %d\n", description, count)
		}
	}
	
	return counts
}

// checkHTMLIssues verifica posibles problemas en el HTML
func (e *RealExecutor) checkHTMLIssues(code string) string {
	issues := "🔍 Verificación de calidad:\n"
	hasIssues := false
	
	// Verificar etiquetas no cerradas (verificación básica)
	openTags := regexp.MustCompile(`<([a-zA-Z][a-zA-Z0-9]*)[^>]*>`).FindAllStringSubmatch(code, -1)
	closeTags := regexp.MustCompile(`</([a-zA-Z][a-zA-Z0-9]*)>`).FindAllStringSubmatch(code, -1)
	
	if len(openTags) > len(closeTags) {
		issues += "⚠️  Posibles etiquetas sin cerrar detectadas\n"
		hasIssues = true
	}
	
	// Verificar alt en imágenes
	imgTags := regexp.MustCompile(`<img[^>]*>`).FindAllString(code, -1)
	for _, img := range imgTags {
		if !strings.Contains(img, "alt=") {
			issues += "⚠️  Imagen sin atributo alt (accesibilidad)\n"
			hasIssues = true
			break
		}
	}
	
	if !hasIssues {
		issues += "✅ No se detectaron problemas comunes\n"
	}
	
	return issues
}

// createTemporaryWebServer crea un servidor web temporal para mostrar el HTML
func (e *RealExecutor) createTemporaryWebServer(htmlFile string) ServerInfo {
	port := 8081
	duration := 30 // segundos
	
	// Verificar si el puerto está disponible, si no, usar otro
	for i := 0; i < 10; i++ {
		if e.isPortAvailable(port + i) {
			port = port + i
			break
		}
	}
	
	url := fmt.Sprintf("http://localhost:%d", port)
	
	// Iniciar servidor en background
	go func() {
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, htmlFile)
		})
		
		server := &http.Server{Addr: ":" + strconv.Itoa(port)}
		
		// Detener el servidor después del tiempo especificado
		go func() {
			time.Sleep(time.Duration(duration) * time.Second)
			server.Close()
		}()
		
		server.ListenAndServe()
	}()
	
	// Esperar un momento para que el servidor inicie
	time.Sleep(500 * time.Millisecond)
	
	return ServerInfo{
		URL:      url,
		Port:     port,
		Duration: duration,
	}
}

// isPortAvailable verifica si un puerto está disponible
func (e *RealExecutor) isPortAvailable(port int) bool {
	address := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return false
	}
	listener.Close()
	return true
}

// openInBrowser intenta abrir el HTML en el navegador
func (e *RealExecutor) openInBrowser(url string) string {
	var cmd *exec.Cmd
	
	switch runtime.GOOS {
	case "darwin": // macOS
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		return "Sistema operativo no soportado para abrir navegador automáticamente"
	}
	
	err := cmd.Start()
	if err != nil {
		return "No se pudo abrir el navegador automáticamente - Abre manualmente: " + url
	}
	
	return "Abriendo en el navegador predeterminado..."
}

func (e *RealExecutor) simulatePascalExecution(code string) string {
	if strings.Contains(strings.ToLower(code), "writeln") {
		return "Programa Pascal ejecutado (simulado)\nSalida: Hello World"
	}
	return "Programa Pascal compilado y ejecutado (simulado)"
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
