package main

import "time"

// TokenType representa los tipos de tokens
type TokenType string

// Constantes para tipos de tokens
const (
	EspacioBlanco TokenType = "EspacioBlanco"
	Comentario    TokenType = "Comentario"
	Texto     TokenType = "Texto"
	Numero     TokenType = "Numero"
	Funcion   TokenType = "Funcion"
	Clase      TokenType = "Clase"
	Variable   TokenType = "Variable"		
	Constante   TokenType = "Constante"
	PalabraClave    TokenType = "PalabraClave"
	Operador   TokenType = "Operador"
	Delimitador  TokenType = "Delimitador"
	Identificador TokenType = "Identificador"
	Desconocido    TokenType = "Desconocido"
	
	// Aliases en inglés para compatibilidad con el código existente
	WHITESPACE TokenType = "WHITESPACE"
	COMMENT    TokenType = "COMMENT"
	STRING     TokenType = "STRING"
	NUMBER     TokenType = "NUMBER"
	FUNCTION   TokenType = "FUNCTION"
	CLASS      TokenType = "CLASS"
	VARIABLE   TokenType = "VARIABLE"
	CONSTANT   TokenType = "CONSTANT"
	KEYWORD    TokenType = "KEYWORD"
	OPERATOR   TokenType = "OPERATOR"
	DELIMITER  TokenType = "DELIMITER"
	IDENTIFIER TokenType = "IDENTIFIER"
	UNKNOWN    TokenType = "UNKNOWN"
)

// AnalyzeRequest representa la solicitud de análisis de código
type AnalyzeRequest struct {
	Code     string `json:"code"`
	Language string `json:"language"`
}

// Token representa un token léxico
type Token struct {
	Type     string `json:"type"`
	Value    string `json:"value"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Position int    `json:"position"`
}

// ParseNode representa un nodo del árbol sintáctico
type ParseNode struct {
	Type     string      `json:"type"`
	Value    string      `json:"value"`
	Children []ParseNode `json:"children"`
	Line     int         `json:"line"`
	Column   int         `json:"column"`
}

// Symbol representa un símbolo en la tabla de símbolos
type Symbol struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Value    string `json:"value"`
	Scope    string `json:"scope"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Category string `json:"category"` // variable, function, class, etc.
}

// CompilerError representa un error del compilador
type CompilerError struct {
	Type     string `json:"type"` // lexico, sintactico, semantico
	Message  string `json:"message"`
	Line     int    `json:"line"`
	Column   int    `json:"column"`
	Position int    `json:"position"`
	Severity string `json:"severity"` // error, warning, info
}

// AnalysisPhase representa el estado de una fase de análisis
type AnalysisPhase struct {
	Completed      bool `json:"completed"`
	TokensFound    int  `json:"tokensFound,omitempty"`
	NodesGenerated int  `json:"nodesGenerated,omitempty"`
	SymbolsFound   int  `json:"symbolsFound,omitempty"`
	ErrorsFound    int  `json:"errorsFound"`
}

// AnalysisPhases representa todas las fases del compilador
type AnalysisPhases struct {
	Lexical  AnalysisPhase `json:"lexical"`
	Syntax   AnalysisPhase `json:"syntax"`
	Semantic AnalysisPhase `json:"semantic"`
}

// ExecutionResult representa el resultado de la ejecución
type ExecutionResult struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

// AnalyzeResponse representa la respuesta completa del análisis
type AnalyzeResponse struct {
	Language        string           `json:"language"`
	Tokens          []Token          `json:"tokens"`
	ParseTree       []ParseNode      `json:"parseTree"`
	SymbolTable     []Symbol         `json:"symbolTable"`
	Errors          []CompilerError  `json:"errors"`
	CanExecute      bool             `json:"canExecute"`
	AnalysisPhases  AnalysisPhases   `json:"analysisPhases"`
	ExecutionResult *ExecutionResult `json:"executionResult,omitempty"`
	ProcessingTime  time.Duration    `json:"processingTime"`
}
