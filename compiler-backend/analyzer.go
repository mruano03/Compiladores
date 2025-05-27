package main

import (
	"strings"
	"time"
)

// AnalyzeCode es la función principal que coordina todo el análisis
func AnalyzeCode(code, language string) AnalyzeResponse {
	startTime := time.Now()

	// Detectar lenguaje si no se especifica
	if language == "" || language == "auto" {
		language = DetectLanguage(code)
	}

	// Inicializar respuesta
	response := AnalyzeResponse{
		Language:       language,
		Tokens:         []Token{},
		ParseTree:      []ParseNode{},
		SymbolTable:    []Symbol{},
		Errors:         []CompilerError{},
		CanExecute:     false,
		AnalysisPhases: AnalysisPhases{},
		ProcessingTime: 0,
	}

	// Fase 1: Análisis Léxico (usando expresiones regulares)
	regexAnalyzer := NewRegexAnalyzer(code, language)
	tokens, lexErrors := regexAnalyzer.TokenizeWithRegex()

	response.Tokens = tokens
	response.Errors = append(response.Errors, lexErrors...)
	response.AnalysisPhases.Lexical = AnalysisPhase{
		Completed:   true,
		TokensFound: len(tokens),
		ErrorsFound: len(lexErrors),
	}

	// Fase 2: Análisis Sintáctico
	parser := NewParser(tokens, language)
	parseTree, parseErrors := parser.Parse()

	response.ParseTree = parseTree
	response.Errors = append(response.Errors, parseErrors...)
	response.AnalysisPhases.Syntax = AnalysisPhase{
		Completed:      true,
		NodesGenerated: countNodes(parseTree),
		ErrorsFound:    len(parseErrors),
	}

	// Fase 3: Análisis Semántico
	semantic := NewSemanticAnalyzer(tokens, parseTree, language)
	symbolTable, semanticErrors := semantic.Analyze()

	response.SymbolTable = symbolTable
	response.Errors = append(response.Errors, semanticErrors...)
	response.AnalysisPhases.Semantic = AnalysisPhase{
		Completed:    true,
		SymbolsFound: len(symbolTable),
		ErrorsFound:  len(semanticErrors),
	}

	// Determinar si se puede ejecutar
	response.CanExecute = len(response.Errors) == 0 || !hasErrorSeverity(response.Errors)

	// Ejecutar si es posible
	if response.CanExecute {
		var result ExecutionResult

		// Verificar configuración para decidir tipo de ejecución
		if GlobalConfig.EnableRealExecution {
			// Usar el ejecutor real para compilación y ejecución real
			realExecutor := NewRealExecutor(language)
			result = realExecutor.Execute(code, response.SymbolTable)
		} else {
			// Usar el ejecutor simulado
			executor := NewExecutor(language)
			result = executor.Execute(code, response.SymbolTable)
		}

		response.ExecutionResult = &result
	}

	response.ProcessingTime = time.Since(startTime)
	return response
}

// DetectLanguage detecta el lenguaje basado en patrones del código
func DetectLanguage(code string) string {
	code = strings.TrimSpace(strings.ToLower(code))

	// Patrones específicos por lenguaje
	patterns := map[string][]string{
		"html": {
			"<!doctype", "<html", "<head", "<body", "<div", "<span", "<p>", "<a href",
		},
		"javascript": {
			"function", "var ", "let ", "const ", "console.log", "document.", "window.",
			"=>", "async", "await", "import ", "export ",
		},
		"python": {
			"def ", "import ", "from ", "print(", "if __name__", "class ", "self.",
			"elif", "range(", "len(", "str(", "int(",
		},
		"cpp": {
			"#include", "using namespace", "std::", "cout", "cin", "endl",
			"int main", "class ", "public:", "private:", "protected:",
		},
		"pascal": {
			"program ", "begin", "end.", "var ", "procedure ", "function ",
			"writeln", "readln", "if then", "while do",
		},
		"tsql": {
			"select ", "from ", "where ", "insert into", "update ", "delete from",
			"create table", "alter table", "drop table", "declare @",
		},
		"plsql": {
			"declare", "begin", "end;", "procedure ", "function ", "package ",
			"cursor ", "exception", "pragma", "dbms_output.put_line",
		},
	}

	// Contar coincidencias por lenguaje
	scores := make(map[string]int)
	for lang, keywords := range patterns {
		for _, keyword := range keywords {
			if strings.Contains(code, keyword) {
				scores[lang]++
			}
		}
	}

	// Encontrar el lenguaje con mayor puntuación
	maxScore := 0
	detectedLang := "unknown"
	for lang, score := range scores {
		if score > maxScore {
			maxScore = score
			detectedLang = lang
		}
	}

	return detectedLang
}

// countNodes cuenta recursivamente los nodos en el árbol sintáctico
func countNodes(nodes []ParseNode) int {
	count := len(nodes)
	for _, node := range nodes {
		count += countNodes(node.Children)
	}
	return count
}

// hasErrorSeverity verifica si hay errores críticos
func hasErrorSeverity(errors []CompilerError) bool {
	for _, err := range errors {
		if err.Severity == "error" {
			return true
		}
	}
	return false
}
