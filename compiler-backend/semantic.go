package main

import (
	"strings"
)

// SemanticAnalyzer estructura del analizador semántico
type SemanticAnalyzer struct {
	tokens    []Token
	parseTree []ParseNode
	language  string
	symbols   map[string]Symbol
	scopes    []string
}

// NewSemanticAnalyzer crea un nuevo analizador semántico
func NewSemanticAnalyzer(tokens []Token, parseTree []ParseNode, language string) *SemanticAnalyzer {
	return &SemanticAnalyzer{
		tokens:    tokens,
		parseTree: parseTree,
		language:  strings.ToLower(language),
		symbols:   make(map[string]Symbol),
		scopes:    []string{"global"},
	}
}

// Analyze realiza el análisis semántico
func (s *SemanticAnalyzer) Analyze() ([]Symbol, []CompilerError) {
	var errors []CompilerError

	// Analizar cada nodo del árbol sintáctico
	for _, node := range s.parseTree {
		nodeErrors := s.analyzeNode(node)
		errors = append(errors, nodeErrors...)
	}

	// Verificar declaraciones y usos
	usageErrors := s.checkVariableUsage()
	errors = append(errors, usageErrors...)

	// Convertir mapa de símbolos a slice
	var symbolTable []Symbol
	for _, symbol := range s.symbols {
		symbolTable = append(symbolTable, symbol)
	}

	return symbolTable, errors
}

// analyzeNode analiza un nodo específico
func (s *SemanticAnalyzer) analyzeNode(node ParseNode) []CompilerError {
	var errors []CompilerError

	switch node.Type {
	case "FunctionDeclaration":
		errors = append(errors, s.analyzeFunctionDeclaration(node)...)
	case "VariableDeclaration":
		errors = append(errors, s.analyzeVariableDeclaration(node)...)
	case "ClassDeclaration":
		errors = append(errors, s.analyzeClassDeclaration(node)...)
	case "Expression":
		errors = append(errors, s.analyzeExpression(node)...)
	}

	// Analizar nodos hijos recursivamente
	for _, child := range node.Children {
		childErrors := s.analyzeNode(child)
		errors = append(errors, childErrors...)
	}

	return errors
}

// analyzeFunctionDeclaration analiza declaraciones de función
func (s *SemanticAnalyzer) analyzeFunctionDeclaration(node ParseNode) []CompilerError {
	var errors []CompilerError

	// Buscar el nombre de la función en los hijos
	var functionName string
	for _, child := range node.Children {
		if child.Type == "Identifier" {
			functionName = child.Value
			break
		}
	}

	if functionName == "" {
		errors = append(errors, CompilerError{
			Type:     "semantico",
			Message:  "Función sin nombre",
			Line:     node.Line,
			Column:   node.Column,
			Position: 0,
			Severity: "error",
		})
		return errors
	}

	// Verificar si la función ya existe
	if _, exists := s.symbols[functionName]; exists {
		errors = append(errors, CompilerError{
			Type:     "semantico",
			Message:  "Función '" + functionName + "' ya declarada",
			Line:     node.Line,
			Column:   node.Column,
			Position: 0,
			Severity: "error",
		})
	} else {
		// Agregar función a la tabla de símbolos
		s.symbols[functionName] = Symbol{
			Name:     functionName,
			Type:     "function",
			Value:    node.Value,
			Scope:    s.getCurrentScope(),
			Line:     node.Line,
			Column:   node.Column,
			Category: "function",
		}
	}

	return errors
}

// analyzeVariableDeclaration analiza declaraciones de variable
func (s *SemanticAnalyzer) analyzeVariableDeclaration(node ParseNode) []CompilerError {
	var errors []CompilerError

	// Buscar el nombre de la variable en los hijos
	var variableName string
	for _, child := range node.Children {
		if child.Type == "Identifier" {
			variableName = child.Value
			break
		}
	}

	if variableName == "" {
		errors = append(errors, CompilerError{
			Type:     "semantico",
			Message:  "Variable sin nombre",
			Line:     node.Line,
			Column:   node.Column,
			Position: 0,
			Severity: "error",
		})
		return errors
	}

	// Verificar si la variable ya existe en el scope actual
	scopedName := s.getCurrentScope() + "." + variableName
	if _, exists := s.symbols[scopedName]; exists {
		errors = append(errors, CompilerError{
			Type:     "semantico",
			Message:  "Variable '" + variableName + "' ya declarada en este scope",
			Line:     node.Line,
			Column:   node.Column,
			Position: 0,
			Severity: "error",
		})
	} else {
		// Agregar variable a la tabla de símbolos
		s.symbols[scopedName] = Symbol{
			Name:     variableName,
			Type:     s.inferType(node.Value),
			Value:    "",
			Scope:    s.getCurrentScope(),
			Line:     node.Line,
			Column:   node.Column,
			Category: "variable",
		}
	}

	return errors
}

// analyzeClassDeclaration analiza declaraciones de clase
func (s *SemanticAnalyzer) analyzeClassDeclaration(node ParseNode) []CompilerError {
	var errors []CompilerError

	// Buscar el nombre de la clase en los hijos
	var className string
	for _, child := range node.Children {
		if child.Type == "Identifier" {
			className = child.Value
			break
		}
	}

	if className == "" {
		errors = append(errors, CompilerError{
			Type:     "semantico",
			Message:  "Clase sin nombre",
			Line:     node.Line,
			Column:   node.Column,
			Position: 0,
			Severity: "error",
		})
		return errors
	}

	// Verificar si la clase ya existe
	if _, exists := s.symbols[className]; exists {
		errors = append(errors, CompilerError{
			Type:     "semantico",
			Message:  "Clase '" + className + "' ya declarada",
			Line:     node.Line,
			Column:   node.Column,
			Position: 0,
			Severity: "error",
		})
	} else {
		// Agregar clase a la tabla de símbolos
		s.symbols[className] = Symbol{
			Name:     className,
			Type:     "class",
			Value:    "",
			Scope:    s.getCurrentScope(),
			Line:     node.Line,
			Column:   node.Column,
			Category: "class",
		}
	}

	return errors
}

// analyzeExpression analiza expresiones
func (s *SemanticAnalyzer) analyzeExpression(node ParseNode) []CompilerError {
	var errors []CompilerError

	// Verificar si es un identificador que debe estar declarado
	if node.Type == "Expression" && s.isIdentifier(node.Value) {
		if !s.isVariableDeclared(node.Value) && !s.isKeyword(node.Value) {
			errors = append(errors, CompilerError{
				Type:     "semantico",
				Message:  "Variable '" + node.Value + "' no declarada",
				Line:     node.Line,
				Column:   node.Column,
				Position: 0,
				Severity: "warning",
			})
		}
	}

	return errors
}

// checkVariableUsage verifica el uso correcto de variables
func (s *SemanticAnalyzer) checkVariableUsage() []CompilerError {
	var errors []CompilerError

	// Verificar variables declaradas pero no usadas
	for _, symbol := range s.symbols {
		if symbol.Category == "variable" && !s.isVariableUsed(symbol.Name) {
			errors = append(errors, CompilerError{
				Type:     "semantico",
				Message:  "Variable '" + symbol.Name + "' declarada pero no usada",
				Line:     symbol.Line,
				Column:   symbol.Column,
				Position: 0,
				Severity: "warning",
			})
		}
	}

	return errors
}

// Métodos auxiliares

func (s *SemanticAnalyzer) getCurrentScope() string {
	if len(s.scopes) == 0 {
		return "global"
	}
	return s.scopes[len(s.scopes)-1]
}

func (s *SemanticAnalyzer) inferType(keyword string) string {
	switch strings.ToLower(keyword) {
	case "int", "integer":
		return "integer"
	case "double", "float", "real":
		return "real"
	case "char", "string":
		return "string"
	case "bool", "boolean":
		return "boolean"
	case "var", "let", "const":
		return "auto"
	default:
		return "unknown"
	}
}

func (s *SemanticAnalyzer) isIdentifier(value string) bool {
	if len(value) == 0 {
		return false
	}

	// Un identificador debe empezar con letra o _
	first := value[0]
	if !((first >= 'a' && first <= 'z') || (first >= 'A' && first <= 'Z') || first == '_') {
		return false
	}

	// El resto pueden ser letras, números o _
	for i := 1; i < len(value); i++ {
		char := value[i]
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') || char == '_') {
			return false
		}
	}

	return true
}

func (s *SemanticAnalyzer) isVariableDeclared(name string) bool {
	// Buscar en scope actual
	scopedName := s.getCurrentScope() + "." + name
	if _, exists := s.symbols[scopedName]; exists {
		return true
	}

	// Buscar en scope global
	if _, exists := s.symbols["global."+name]; exists {
		return true
	}

	// Buscar sin scope (funciones y clases)
	if _, exists := s.symbols[name]; exists {
		return true
	}

	return false
}

func (s *SemanticAnalyzer) isKeyword(value string) bool {
	keywords, exists := LanguageKeywords[s.language]
	if !exists {
		return false
	}

	lowerValue := strings.ToLower(value)
	for _, keyword := range keywords {
		if strings.ToLower(keyword) == lowerValue {
			return true
		}
	}

	return false
}

func (s *SemanticAnalyzer) isVariableUsed(name string) bool {
	// Simplificado: buscar en los tokens si aparece el nombre
	for _, token := range s.tokens {
		if token.Value == name && token.Type == "IDENTIFIER" {
			return true
		}
	}
	return false
}
