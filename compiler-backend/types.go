package main

import "time"

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
