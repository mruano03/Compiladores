package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/rs/cors"
)

// Estructuras de la API REST para comunicarse con el frontend
type AnalyzeRequest struct {
	Code     string `json:"code"`
	Language string `json:"language"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

type APIToken struct {
	Type     string `json:"type"`
	Value    string `json:"value"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Position int    `json:"position"`
}

type APIParseNode struct {
	Type     string         `json:"type"`
	Value    string         `json:"value"`
	Children []APIParseNode `json:"children"`
	Line     int            `json:"line"`
	Column   int            `json:"column"`
}

type APISymbol struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Value    string `json:"value"`
	Scope    string `json:"scope"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Category string `json:"category"`
}

type APICompilerError struct {
	Type     string `json:"type"`
	Message  string `json:"message"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Position int    `json:"position"`
	Severity string `json:"severity"`
}

type APIAnalysisPhase struct {
	Completed      bool `json:"completed"`
	TokensFound    *int `json:"tokensFound,omitempty"`
	NodesGenerated *int `json:"nodesGenerated,omitempty"`
	SymbolsFound   *int `json:"symbolsFound,omitempty"`
	ErrorsFound    int  `json:"errorsFound"`
}

type APIAnalysisPhases struct {
	Lexical  APIAnalysisPhase `json:"lexical"`
	Syntax   APIAnalysisPhase `json:"syntax"`
	Semantic APIAnalysisPhase `json:"semantic"`
}

type APIExecutionResult struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

type APIAnalyzeResponse struct {
	Language        string               `json:"language"`
	Tokens          []APIToken           `json:"tokens"`
	ParseTree       []APIParseNode       `json:"parseTree"`
	SymbolTable     []APISymbol          `json:"symbolTable"`
	Errors          []APICompilerError   `json:"errors"`
	CanExecute      bool                 `json:"canExecute"`
	AnalysisPhases  APIAnalysisPhases    `json:"analysisPhases"`
	ExecutionResult *APIExecutionResult  `json:"executionResult,omitempty"`
	ProcessingTime  string               `json:"processingTime"`
}

// Convertir tipos internos a tipos de API
func convertToAPITokens(tokens []Token, originalCode string) []APIToken {
	apiTokens := make([]APIToken, len(tokens))
	
	for i, token := range tokens {
		line, col := calculateLineColumnFromPosition(token.Start, originalCode)
		
		apiTokens[i] = APIToken{
			Type:     strings.ToUpper(token.Type.String()),
			Value:    token.Lexeme,
			Line:     line,
			Column:   col,
			Position: token.Start,
		}
	}
	return apiTokens
}

func calculateLineColumnFromPosition(pos int, code string) (int, int) {
	if pos <= 0 {
		return 1, 1
	}
	
	line := 1
	column := 1
	
	for i, char := range code {
		if i >= pos {
			break
		}
		if char == '\n' {
			line++
			column = 1
		} else {
			column++
		}
	}
	
	return line, column
}

func convertToAPIParseNodes(nodes []ParseNode) []APIParseNode {
	apiNodes := make([]APIParseNode, len(nodes))
	for i, node := range nodes {
		apiNodes[i] = APIParseNode{
			Type:     "node",
			Value:    node.Label,
			Children: convertToAPIParseNodes(node.Children),
			Line:     1, // Se calcularía basándose en tokens
			Column:   1,
		}
	}
	return apiNodes
}

func convertToAPISymbols(symbols []Symbol, originalCode string) []APISymbol {
	apiSymbols := make([]APISymbol, len(symbols))
	for i, symbol := range symbols {
		line, column := calculateLineColumnFromPosition(symbol.Pos, originalCode)
		
		apiSymbols[i] = APISymbol{
			Name:     symbol.Name,
			Type:     symbol.Kind,
			Value:    "",
			Scope:    "global",
			Line:     line,
			Column:   column,
			Category: symbol.Kind,
		}
	}
	return apiSymbols
}

func convertToAPIErrors(errors []CompilerError, originalCode string) []APICompilerError {
	apiErrors := make([]APICompilerError, len(errors))
	
	for i, err := range errors {
		line, column := calculateLineColumnFromPosition(err.Pos, originalCode)
		
		apiErrors[i] = APICompilerError{
			Type:     err.Type, // Usar el campo Type directamente
			Message:  err.Message,
			Line:     line,
			Column:   column,
			Position: err.Pos,
			Severity: err.Severity,
		}
	}
	return apiErrors
}

// Handlers HTTP
func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := HealthResponse{
		Status:  "ok",
		Service: "Compilador Go Backend",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func analyzeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validar entrada
	if req.Code == "" {
		http.Error(w, "Code is required", http.StatusBadRequest)
		return
	}

	// Mapear lenguaje del frontend al backend
	language := mapLanguage(req.Language)
	
	// Ejecutar análisis usando el compilador existente
	result := AnalyzeCode(req.Code, language)

	// Convertir resultado interno a formato de API
	apiResponse := APIAnalyzeResponse{
		Language:    result.Language,
		Tokens:      convertToAPITokens(result.Tokens, req.Code),
		ParseTree:   convertToAPIParseNodes(result.ParseTree),
		SymbolTable: convertToAPISymbols(result.SymbolTable, req.Code),
		Errors:      convertToAPIErrors(result.Errors, req.Code),
		CanExecute:  result.CanExecute,
		AnalysisPhases: APIAnalysisPhases{
			Lexical: APIAnalysisPhase{
				Completed:   result.AnalysisPhases.Lexical.Completed,
				TokensFound: &result.AnalysisPhases.Lexical.TokensFound,
				ErrorsFound: result.AnalysisPhases.Lexical.ErrorsFound,
			},
			Syntax: APIAnalysisPhase{
				Completed:      result.AnalysisPhases.Syntax.Completed,
				NodesGenerated: &result.AnalysisPhases.Syntax.NodesGenerated,
				ErrorsFound:    result.AnalysisPhases.Syntax.ErrorsFound,
			},
			Semantic: APIAnalysisPhase{
				Completed:    result.AnalysisPhases.Semantic.Completed,
				SymbolsFound: &result.AnalysisPhases.Semantic.SymbolsFound,
				ErrorsFound:  result.AnalysisPhases.Semantic.ErrorsFound,
			},
		},
		ProcessingTime: result.ProcessingTime.String(),
	}

	// Agregar resultado de ejecución si existe
	if result.ExecutionResult != nil {
		apiResponse.ExecutionResult = &APIExecutionResult{
			Success: result.ExecutionResult.Ok,
			Output:  result.ExecutionResult.Output,
		}
		if !result.ExecutionResult.Ok {
			apiResponse.ExecutionResult.Error = result.ExecutionResult.Output
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apiResponse)
}

func mapLanguage(frontendLang string) string {
	switch strings.ToLower(frontendLang) {
	case "c++", "cpp":
		return "cpp"
	case "javascript", "js":
		return "javascript"
	case "python", "py":
		return "python"
	case "", "auto":
		return ""
	default:
		return frontendLang
	}
}

func main() {
	// Configurar rutas
	mux := http.NewServeMux()
	
	// Rutas de la API
	mux.HandleFunc("/api/v1/health", healthHandler)
	mux.HandleFunc("/api/v1/analyze", analyzeHandler)
	
	// Configurar CORS para permitir conexiones desde el frontend
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000", // Next.js dev
			"http://localhost:3001", // Alternativo
			"https://localhost:3000", // HTTPS local
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"Accept",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"X-CSRF-Token",
			"Authorization",
		},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	// Obtener puerto del entorno o usar 8080 por defecto
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Servidor del compilador iniciado en puerto %s\n", port)
	fmt.Printf("📋 Health check: http://localhost:%s/api/v1/health\n", port)
	fmt.Printf("🔍 Análisis: http://localhost:%s/api/v1/analyze\n", port)
	fmt.Printf("🌐 CORS habilitado para: http://localhost:3000\n")
	
	log.Fatal(http.ListenAndServe(":"+port, handler))
} 