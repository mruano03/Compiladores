package main

import (
	"strings"
)

// SemanticAnalyzer estructura del analizador semántico
type SemanticAnalyzer struct {
	tokens          []Token
	parseTree       []ParseNode
	language        string
	symbols         map[string]Symbol
	scopes          []string
	currentFunction string
}

// NewSemanticAnalyzer crea un nuevo analizador semántico
func NewSemanticAnalyzer(tokens []Token, parseTree []ParseNode, language string) *SemanticAnalyzer {
	return &SemanticAnalyzer{
		tokens:          tokens,
		parseTree:       parseTree,
		language:        strings.ToLower(language),
		symbols:         make(map[string]Symbol),
		scopes:          []string{"global"},
		currentFunction: "",
	}
}

// Analyze realiza el análisis semántico
func (s *SemanticAnalyzer) Analyze() ([]Symbol, []CompilerError) {
	var errors []CompilerError

	// Primer paso: registrar todas las declaraciones de funciones y variables
	s.registerDeclarations()

	// Segundo paso: analizar cada nodo del árbol sintáctico
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

// registerDeclarations registra todas las declaraciones antes del análisis
func (s *SemanticAnalyzer) registerDeclarations() {
	for i, token := range s.tokens {
		switch s.language {
		case "python":
			s.registerPythonDeclarations(i, token)
		case "javascript":
			s.registerJavaScriptDeclarations(i, token)
		case "cpp":
			s.registerCppDeclarations(i, token)
		case "html":
			s.registerHTMLDeclarations(i, token)
		case "pascal":
			s.registerPascalDeclarations(i, token)
		case "plsql":
			s.registerPLSQLDeclarations(i, token)
		case "tsql":
			s.registerTSQLDeclarations(i, token)
		}
	}
}

// registerPythonDeclarations registra declaraciones específicas de Python
func (s *SemanticAnalyzer) registerPythonDeclarations(i int, token Token) {
	// Registrar funciones (def nombre(...))
	if token.Type == "FUNCTION" && strings.HasPrefix(token.Value, "def ") {
		funcName := strings.TrimSpace(strings.Split(token.Value, "(")[0][4:])
		if funcName != "" {
			s.symbols[funcName] = Symbol{
				Name:     funcName,
				Type:     "function",
				Value:    token.Value,
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "function",
			}

			// Registrar parámetros de la función
			s.registerPythonFunctionParameters(i, funcName)
		}
	}

	// Registrar variables (nombre = valor)
	if token.Type == "VARIABLE" && strings.Contains(token.Value, "=") {
		varName := strings.TrimSpace(strings.Split(token.Value, "=")[0])
		if varName != "" {
			s.symbols["global."+varName] = Symbol{
				Name:     varName,
				Type:     "variable",
				Value:    "",
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "variable",
			}
		}
	}
}

// registerPythonFunctionParameters registra los parámetros de una función Python
func (s *SemanticAnalyzer) registerPythonFunctionParameters(funcTokenIndex int, funcName string) {
	// Buscar los parámetros entre paréntesis
	for i := funcTokenIndex + 1; i < len(s.tokens); i++ {
		token := s.tokens[i]

		// Si encontramos el cierre de paréntesis, terminamos
		if token.Type == "DELIMITER" && token.Value == ")" {
			break
		}

		// Si es un identificador y no es una coma, es un parámetro
		if token.Type == "IDENTIFIER" {
			paramName := token.Value
			s.symbols[funcName+"."+paramName] = Symbol{
				Name:     paramName,
				Type:     "parameter",
				Value:    "",
				Scope:    funcName,
				Line:     token.Line,
				Column:   token.Column,
				Category: "parameter",
			}
		}
	}
}

// registerJavaScriptDeclarations registra declaraciones específicas de JavaScript
func (s *SemanticAnalyzer) registerJavaScriptDeclarations(i int, token Token) {
	// Registrar funciones (function nombre(...) o arrow functions)
	if token.Type == "FUNCTION" {
		var funcName string

		// Caso: function nombre(...)
		if strings.HasPrefix(token.Value, "function ") {
			parts := strings.Split(token.Value, "(")
			if len(parts) > 0 {
				funcPart := strings.TrimSpace(parts[0])
				if len(funcPart) > 9 { // "function " tiene 9 caracteres
					funcName = strings.TrimSpace(funcPart[9:])
				}
			}
		}

		// Caso: arrow function (x, y) => o x =>
		if strings.Contains(token.Value, "=>") {
			// Para arrow functions, buscar el nombre de la variable anterior
			if i > 0 {
				prevToken := s.tokens[i-1]
				if prevToken.Type == "OPERATOR" && prevToken.Value == "=" && i > 1 {
					varToken := s.tokens[i-2]
					if varToken.Type == "VARIABLE" {
						parts := strings.Fields(varToken.Value)
						if len(parts) >= 2 {
							funcName = parts[1]
						}
					}
				}
			}

			// Registrar parámetros de arrow function
			if funcName != "" {
				s.registerJavaScriptArrowFunctionParameters(i, funcName, token.Value)
			}
		}

		if funcName != "" {
			s.symbols[funcName] = Symbol{
				Name:     funcName,
				Type:     "function",
				Value:    token.Value,
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "function",
			}

			// Registrar parámetros de la función normal
			if !strings.Contains(token.Value, "=>") {
				s.registerJavaScriptFunctionParameters(i, funcName)
			}
		}
	}

	// Registrar variables (const/let/var nombre = valor)
	if token.Type == "VARIABLE" && (strings.HasPrefix(token.Value, "const ") ||
		strings.HasPrefix(token.Value, "let ") || strings.HasPrefix(token.Value, "var ")) {

		parts := strings.Fields(token.Value)
		if len(parts) >= 2 {
			varName := parts[1]
			s.symbols["global."+varName] = Symbol{
				Name:     varName,
				Type:     "variable",
				Value:    "",
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "variable",
			}
		}
	}
}

// registerJavaScriptFunctionParameters registra los parámetros de una función JavaScript
func (s *SemanticAnalyzer) registerJavaScriptFunctionParameters(funcTokenIndex int, funcName string) {
	// Buscar los parámetros entre paréntesis
	for i := funcTokenIndex + 1; i < len(s.tokens); i++ {
		token := s.tokens[i]

		// Si encontramos el cierre de paréntesis, terminamos
		if token.Type == "DELIMITER" && token.Value == ")" {
			break
		}

		// Si es un identificador y no es una coma, es un parámetro
		if token.Type == "IDENTIFIER" {
			paramName := token.Value
			s.symbols[funcName+"."+paramName] = Symbol{
				Name:     paramName,
				Type:     "parameter",
				Value:    "",
				Scope:    funcName,
				Line:     token.Line,
				Column:   token.Column,
				Category: "parameter",
			}
		}
	}
}

// registerJavaScriptArrowFunctionParameters registra los parámetros de una arrow function
func (s *SemanticAnalyzer) registerJavaScriptArrowFunctionParameters(funcTokenIndex int, funcName string, arrowFuncValue string) {
	// Extraer parámetros de la arrow function
	// Formato: (x, y) => o x =>
	if strings.HasPrefix(arrowFuncValue, "(") {
		// Múltiples parámetros: (x, y) =>
		endParen := strings.Index(arrowFuncValue, ")")
		if endParen > 1 {
			paramsStr := arrowFuncValue[1:endParen]
			params := strings.Split(paramsStr, ",")
			for _, param := range params {
				paramName := strings.TrimSpace(param)
				if paramName != "" {
					// Buscar el token correspondiente para obtener línea y columna
					for _, token := range s.tokens {
						if token.Value == paramName && token.Type == "IDENTIFIER" {
							s.symbols[funcName+"."+paramName] = Symbol{
								Name:     paramName,
								Type:     "parameter",
								Value:    "",
								Scope:    funcName,
								Line:     token.Line,
								Column:   token.Column,
								Category: "parameter",
							}
							break
						}
					}
				}
			}
		}
	} else {
		// Un solo parámetro: x =>
		arrowIndex := strings.Index(arrowFuncValue, "=>")
		if arrowIndex > 0 {
			paramName := strings.TrimSpace(arrowFuncValue[:arrowIndex])
			if paramName != "" {
				// Buscar el token correspondiente
				for _, token := range s.tokens {
					if token.Value == paramName && token.Type == "IDENTIFIER" {
						s.symbols[funcName+"."+paramName] = Symbol{
							Name:     paramName,
							Type:     "parameter",
							Value:    "",
							Scope:    funcName,
							Line:     token.Line,
							Column:   token.Column,
							Category: "parameter",
						}
						break
					}
				}
			}
		}
	}
}

// registerCppDeclarations registra declaraciones específicas de C++
func (s *SemanticAnalyzer) registerCppDeclarations(i int, token Token) {
	// Registrar funciones (tipo nombre(...) o nombre(...))
	if token.Type == "FUNCTION" {
		var funcName string

		// Extraer nombre de función de diferentes patrones
		if strings.Contains(token.Value, "(") {
			parts := strings.Split(token.Value, "(")
			if len(parts) > 0 {
				funcPart := strings.TrimSpace(parts[0])
				// Remover tipos de retorno comunes
				funcPart = strings.ReplaceAll(funcPart, "int ", "")
				funcPart = strings.ReplaceAll(funcPart, "void ", "")
				funcPart = strings.ReplaceAll(funcPart, "double ", "")
				funcPart = strings.ReplaceAll(funcPart, "float ", "")
				funcPart = strings.ReplaceAll(funcPart, "char ", "")
				funcPart = strings.ReplaceAll(funcPart, "bool ", "")
				funcName = strings.TrimSpace(funcPart)
			}
		}

		if funcName != "" {
			s.symbols[funcName] = Symbol{
				Name:     funcName,
				Type:     "function",
				Value:    token.Value,
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "function",
			}

			// Registrar parámetros de la función
			s.registerCppFunctionParameters(i, funcName)
		}
	}

	// Registrar variables (tipo nombre = valor o tipo nombre;)
	if token.Type == "VARIABLE" {
		parts := strings.Fields(token.Value)
		if len(parts) >= 2 {
			varName := parts[1]
			// Remover caracteres especiales como = o ;
			varName = strings.TrimRight(varName, "=;")
			s.symbols["global."+varName] = Symbol{
				Name:     varName,
				Type:     "variable",
				Value:    "",
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "variable",
			}
		}
	}
}

// registerCppFunctionParameters registra los parámetros de una función C++
func (s *SemanticAnalyzer) registerCppFunctionParameters(funcTokenIndex int, funcName string) {
	// Buscar los parámetros entre paréntesis
	for i := funcTokenIndex + 1; i < len(s.tokens); i++ {
		token := s.tokens[i]

		// Si encontramos el cierre de paréntesis, terminamos
		if token.Type == "DELIMITER" && token.Value == ")" {
			break
		}

		// Si es un identificador y no es una coma ni un tipo, es un parámetro
		if token.Type == "IDENTIFIER" && !s.isCppType(token.Value) {
			paramName := token.Value
			s.symbols[funcName+"."+paramName] = Symbol{
				Name:     paramName,
				Type:     "parameter",
				Value:    "",
				Scope:    funcName,
				Line:     token.Line,
				Column:   token.Column,
				Category: "parameter",
			}
		}
	}
}

// isCppType verifica si un identificador es un tipo de C++
func (s *SemanticAnalyzer) isCppType(value string) bool {
	cppTypes := []string{"int", "double", "float", "char", "bool", "void", "string", "long", "short", "unsigned"}
	for _, cppType := range cppTypes {
		if value == cppType {
			return true
		}
	}
	return false
}

// registerHTMLDeclarations registra declaraciones específicas de HTML
func (s *SemanticAnalyzer) registerHTMLDeclarations(i int, token Token) {
	// HTML no tiene declaraciones de variables o funciones tradicionales
	// Pero podemos registrar elementos, atributos y scripts

	// Registrar elementos HTML como símbolos
	if token.Type == "KEYWORD" && strings.HasPrefix(token.Value, "<") {
		elementName := strings.TrimPrefix(token.Value, "<")
		elementName = strings.TrimSuffix(elementName, ">")
		elementName = strings.TrimPrefix(elementName, "/")
		elementName = strings.Fields(elementName)[0] // Tomar solo el nombre del elemento

		if elementName != "" {
			s.symbols["html."+elementName] = Symbol{
				Name:     elementName,
				Type:     "element",
				Value:    token.Value,
				Scope:    "html",
				Line:     token.Line,
				Column:   token.Column,
				Category: "element",
			}
		}
	}

	// Registrar atributos HTML
	if token.Type == "VARIABLE" && strings.Contains(token.Value, "=") {
		parts := strings.Split(token.Value, "=")
		if len(parts) >= 2 {
			attrName := strings.TrimSpace(parts[0])
			s.symbols["html."+attrName] = Symbol{
				Name:     attrName,
				Type:     "attribute",
				Value:    token.Value,
				Scope:    "html",
				Line:     token.Line,
				Column:   token.Column,
				Category: "attribute",
			}
		}
	}
}

// registerPascalDeclarations registra declaraciones específicas de Pascal
func (s *SemanticAnalyzer) registerPascalDeclarations(i int, token Token) {
	// Registrar procedimientos y funciones
	if token.Type == "FUNCTION" {
		var funcName string

		// Extraer nombre de procedure/function
		if strings.Contains(strings.ToLower(token.Value), "procedure") ||
			strings.Contains(strings.ToLower(token.Value), "function") {
			parts := strings.Fields(token.Value)
			if len(parts) >= 2 {
				funcName = parts[1]
			}
		}

		if funcName != "" {
			s.symbols[funcName] = Symbol{
				Name:     funcName,
				Type:     "function",
				Value:    token.Value,
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "function",
			}

			// Registrar parámetros de Pascal
			s.registerPascalFunctionParameters(i, funcName)
		}
	}

	// Registrar variables (var nombre: tipo)
	if token.Type == "VARIABLE" && strings.Contains(strings.ToLower(token.Value), "var") {
		parts := strings.Fields(token.Value)
		if len(parts) >= 2 {
			varName := parts[1]
			// Remover : y tipo si existe
			if strings.Contains(varName, ":") {
				varName = strings.Split(varName, ":")[0]
			}
			s.symbols["global."+varName] = Symbol{
				Name:     varName,
				Type:     "variable",
				Value:    "",
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "variable",
			}
		}
	}
}

// registerPascalFunctionParameters registra los parámetros de una función Pascal
func (s *SemanticAnalyzer) registerPascalFunctionParameters(funcTokenIndex int, funcName string) {
	// Buscar los parámetros entre paréntesis
	for i := funcTokenIndex + 1; i < len(s.tokens); i++ {
		token := s.tokens[i]

		// Si encontramos el cierre de paréntesis, terminamos
		if token.Type == "DELIMITER" && token.Value == ")" {
			break
		}

		// Si es un identificador y no es un tipo, es un parámetro
		if token.Type == "IDENTIFIER" && !s.isPascalType(token.Value) {
			paramName := token.Value
			s.symbols[funcName+"."+paramName] = Symbol{
				Name:     paramName,
				Type:     "parameter",
				Value:    "",
				Scope:    funcName,
				Line:     token.Line,
				Column:   token.Column,
				Category: "parameter",
			}
		}
	}
}

// isPascalType verifica si un identificador es un tipo de Pascal
func (s *SemanticAnalyzer) isPascalType(value string) bool {
	pascalTypes := []string{"integer", "real", "boolean", "char", "string", "array", "record", "set", "file"}
	lowerValue := strings.ToLower(value)
	for _, pascalType := range pascalTypes {
		if lowerValue == pascalType {
			return true
		}
	}
	return false
}

// registerPLSQLDeclarations registra declaraciones específicas de PL/SQL
func (s *SemanticAnalyzer) registerPLSQLDeclarations(i int, token Token) {
	// Registrar procedimientos y funciones
	if token.Type == "FUNCTION" {
		var funcName string

		// Extraer nombre de procedure/function
		lowerValue := strings.ToLower(token.Value)
		if strings.Contains(lowerValue, "procedure") || strings.Contains(lowerValue, "function") {
			parts := strings.Fields(token.Value)
			if len(parts) >= 2 {
				funcName = parts[1]
			}
		}

		if funcName != "" {
			s.symbols[funcName] = Symbol{
				Name:     funcName,
				Type:     "function",
				Value:    token.Value,
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "function",
			}

			// Registrar parámetros de PL/SQL
			s.registerPLSQLFunctionParameters(i, funcName)
		}
	}

	// Registrar variables (nombre tipo;)
	if token.Type == "VARIABLE" {
		parts := strings.Fields(token.Value)
		if len(parts) >= 2 {
			varName := parts[0]
			s.symbols["global."+varName] = Symbol{
				Name:     varName,
				Type:     "variable",
				Value:    "",
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "variable",
			}
		}
	}
}

// registerPLSQLFunctionParameters registra los parámetros de una función PL/SQL
func (s *SemanticAnalyzer) registerPLSQLFunctionParameters(funcTokenIndex int, funcName string) {
	// Buscar los parámetros entre paréntesis
	for i := funcTokenIndex + 1; i < len(s.tokens); i++ {
		token := s.tokens[i]

		// Si encontramos el cierre de paréntesis, terminamos
		if token.Type == "DELIMITER" && token.Value == ")" {
			break
		}

		// Si es un identificador y no es un tipo, es un parámetro
		if token.Type == "IDENTIFIER" && !s.isPLSQLType(token.Value) {
			paramName := token.Value
			s.symbols[funcName+"."+paramName] = Symbol{
				Name:     paramName,
				Type:     "parameter",
				Value:    "",
				Scope:    funcName,
				Line:     token.Line,
				Column:   token.Column,
				Category: "parameter",
			}
		}
	}
}

// isPLSQLType verifica si un identificador es un tipo de PL/SQL
func (s *SemanticAnalyzer) isPLSQLType(value string) bool {
	plsqlTypes := []string{"number", "varchar2", "char", "date", "boolean", "binary_integer", "pls_integer", "rowtype", "type"}
	lowerValue := strings.ToLower(value)
	for _, plsqlType := range plsqlTypes {
		if lowerValue == plsqlType {
			return true
		}
	}
	return false
}

// registerTSQLDeclarations registra declaraciones específicas de T-SQL
func (s *SemanticAnalyzer) registerTSQLDeclarations(i int, token Token) {
	// Registrar procedimientos y funciones
	if token.Type == "FUNCTION" {
		var funcName string

		// Extraer nombre de procedure/function
		lowerValue := strings.ToLower(token.Value)
		if strings.Contains(lowerValue, "procedure") || strings.Contains(lowerValue, "function") {
			parts := strings.Fields(token.Value)
			if len(parts) >= 2 {
				funcName = parts[len(parts)-1] // Último elemento después de CREATE PROCEDURE
			}
		}

		if funcName != "" {
			s.symbols[funcName] = Symbol{
				Name:     funcName,
				Type:     "function",
				Value:    token.Value,
				Scope:    "global",
				Line:     token.Line,
				Column:   token.Column,
				Category: "function",
			}

			// Registrar parámetros de T-SQL
			s.registerTSQLFunctionParameters(i, funcName)
		}
	}

	// Registrar variables (@nombre tipo)
	if token.Type == "VARIABLE" && strings.HasPrefix(token.Value, "@") {
		varName := strings.Fields(token.Value)[0]
		varName = strings.TrimPrefix(varName, "@")
		s.symbols["global."+varName] = Symbol{
			Name:     varName,
			Type:     "variable",
			Value:    "",
			Scope:    "global",
			Line:     token.Line,
			Column:   token.Column,
			Category: "variable",
		}
	}

	// Registrar tablas en CREATE TABLE
	if token.Type == "KEYWORD" && strings.Contains(strings.ToLower(token.Value), "create table") {
		parts := strings.Fields(strings.ToLower(token.Value))
		for i, part := range parts {
			if part == "table" && i+1 < len(parts) {
				tableName := parts[i+1]
				s.symbols["table."+tableName] = Symbol{
					Name:     tableName,
					Type:     "table",
					Value:    token.Value,
					Scope:    "database",
					Line:     token.Line,
					Column:   token.Column,
					Category: "table",
				}
				break
			}
		}
	}
}

// registerTSQLFunctionParameters registra los parámetros de una función T-SQL
func (s *SemanticAnalyzer) registerTSQLFunctionParameters(funcTokenIndex int, funcName string) {
	// Buscar los parámetros entre paréntesis
	for i := funcTokenIndex + 1; i < len(s.tokens); i++ {
		token := s.tokens[i]

		// Si encontramos el cierre de paréntesis, terminamos
		if token.Type == "DELIMITER" && token.Value == ")" {
			break
		}

		// Si es una variable (@param), es un parámetro
		if token.Type == "VARIABLE" && strings.HasPrefix(token.Value, "@") {
			paramName := strings.TrimPrefix(token.Value, "@")
			paramName = strings.Fields(paramName)[0]
			s.symbols[funcName+"."+paramName] = Symbol{
				Name:     paramName,
				Type:     "parameter",
				Value:    "",
				Scope:    funcName,
				Line:     token.Line,
				Column:   token.Column,
				Category: "parameter",
			}
		}
	}
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
		// Verificar si es una propiedad de un objeto global
		if s.isPropertyAccess(node) {
			return errors // No marcar error para propiedades de objetos globales
		}

		// Casos especiales para Python
		if s.language == "python" {
			// Ignorar texto adicional que no es código válido
			if s.isInvalidTrailingText(node.Value) {
				errors = append(errors, CompilerError{
					Type:     "lexico",
					Message:  "Texto inesperado: '" + node.Value + "'",
					Line:     node.Line,
					Column:   node.Column,
					Position: 0,
					Severity: "error",
				})
				return errors
			}
		}

		if !s.isVariableDeclared(node.Value) && !s.isKeyword(node.Value) && !s.isGlobalObject(node.Value) {
			errors = append(errors, CompilerError{
				Type:     "semantico",
				Message:  "Variable '" + node.Value + "' no declarada",
				Line:     node.Line,
				Column:   node.Column,
				Position: 0,
				Severity: "error",
			})
		}
	}

	return errors
}

// isInvalidTrailingText verifica si el texto es código inválido al final
func (s *SemanticAnalyzer) isInvalidTrailingText(value string) bool {
	// Patrones comunes de texto inválido
	invalidPatterns := []string{"asd", "asdf", "test", "xxx", "yyy", "zzz"}

	lowerValue := strings.ToLower(value)
	for _, pattern := range invalidPatterns {
		if lowerValue == pattern {
			return true
		}
	}

	// Verificar si es un identificador que aparece sin contexto válido
	switch s.language {
	case "python":
		// En Python, texto después de strings o paréntesis sin operador
		return len(value) <= 5 && s.isIdentifier(value) && !s.isKeyword(value) && !s.isGlobalObject(value)
	case "javascript":
		// En JavaScript, similar lógica
		return len(value) <= 5 && s.isIdentifier(value) && !s.isKeyword(value) && !s.isGlobalObject(value)
	case "html":
		// En HTML, texto fuera de elementos
		return !strings.HasPrefix(value, "<") && !strings.HasSuffix(value, ">") && len(value) <= 5
	case "pascal", "plsql", "tsql":
		// En lenguajes estructurados, identificadores sin contexto
		return len(value) <= 5 && s.isIdentifier(value) && !s.isKeyword(value)
	case "cpp":
		// En C++, similar lógica
		return len(value) <= 5 && s.isIdentifier(value) && !s.isKeyword(value) && !s.isCppType(value)
	}

	return false
}

// isPropertyAccess verifica si un nodo es parte de un acceso a propiedad
func (s *SemanticAnalyzer) isPropertyAccess(node ParseNode) bool {
	// Buscar en el árbol sintáctico si hay un patrón objeto.propiedad
	for i, parseNode := range s.parseTree {
		if parseNode.Value == node.Value {
			// Verificar si el nodo anterior es un punto y el anterior a ese es un objeto global
			if i >= 2 && s.parseTree[i-1].Value == "." {
				prevObject := s.parseTree[i-2].Value
				if s.isGlobalObject(prevObject) {
					return true
				}
			}
			// Verificar si el nodo siguiente es un punto (para objetos como console)
			if i < len(s.parseTree)-1 && s.parseTree[i+1].Value == "." {
				if s.isGlobalObject(parseNode.Value) {
					return true
				}
			}
		}
	}
	return false
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

	// Buscar en parámetros de todas las funciones (para todos los lenguajes)
	for key := range s.symbols {
		if strings.Contains(key, "."+name) && s.symbols[key].Category == "parameter" {
			return true
		}
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

// isGlobalObject verifica si un identificador es un objeto global del lenguaje
func (s *SemanticAnalyzer) isGlobalObject(value string) bool {
	// Casos especiales por lenguaje
	switch s.language {
	case "python":
		// f-strings: el 'f' antes de una cadena no es una variable
		if value == "f" {
			return true
		}
	case "html":
		// Elementos HTML comunes no son variables
		htmlElements := []string{"html", "head", "body", "div", "span", "p", "a", "img", "script", "style"}
		for _, element := range htmlElements {
			if value == element {
				return true
			}
		}
	case "tsql", "plsql":
		// Funciones del sistema SQL
		sqlFunctions := []string{"count", "sum", "avg", "max", "min", "getdate", "sysdate", "user", "system_user"}
		lowerValue := strings.ToLower(value)
		for _, sqlFunc := range sqlFunctions {
			if lowerValue == sqlFunc {
				return true
			}
		}
	}

	globalObjects := getGlobalObjects(s.language)
	for _, obj := range globalObjects {
		if obj == value {
			return true
		}
	}
	return false
}

// getGlobalObjects retorna los objetos globales para cada lenguaje
func getGlobalObjects(language string) []string {
	switch strings.ToLower(language) {
	case "javascript":
		return []string{
			"console", "window", "document", "navigator", "location", "history",
			"localStorage", "sessionStorage", "JSON", "Math", "Date", "Array",
			"Object", "String", "Number", "Boolean", "RegExp", "Error",
			"setTimeout", "setInterval", "clearTimeout", "clearInterval",
			"alert", "confirm", "prompt", "parseInt", "parseFloat", "isNaN",
			"isFinite", "encodeURI", "decodeURI", "encodeURIComponent", "decodeURIComponent",
			"eval", "require", "module", "exports", "global", "process", "Buffer",
		}
	case "python":
		return []string{
			"print", "input", "len", "range", "str", "int", "float", "bool",
			"list", "dict", "tuple", "set", "type", "isinstance", "hasattr",
			"getattr", "setattr", "delattr", "dir", "vars", "globals", "locals",
			"open", "file", "abs", "min", "max", "sum", "sorted", "reversed",
			"enumerate", "zip", "map", "filter", "reduce", "any", "all",
		}
	case "cpp":
		return []string{
			"std", "cout", "cin", "endl", "string", "vector", "map", "set",
			"iostream", "fstream", "sstream", "algorithm", "iterator", "printf",
			"scanf", "malloc", "free", "sizeof", "NULL",
		}
	case "html":
		return []string{
			"document", "window", "console", "alert", "getElementById", "querySelector",
			"addEventListener", "innerHTML", "textContent", "style", "className",
			"setAttribute", "getAttribute", "createElement", "appendChild",
		}
	case "pascal":
		return []string{
			"writeln", "write", "readln", "read", "length", "copy", "pos", "val",
			"str", "chr", "ord", "succ", "pred", "abs", "sqr", "sqrt", "sin",
			"cos", "ln", "exp", "trunc", "round", "random", "randomize",
		}
	case "plsql":
		return []string{
			"dbms_output", "put_line", "sysdate", "user", "dual", "rownum", "rowid",
			"count", "sum", "avg", "max", "min", "nvl", "decode", "substr",
			"length", "upper", "lower", "trim", "to_char", "to_date", "to_number",
			"exception", "when", "others", "raise", "pragma",
		}
	case "tsql":
		return []string{
			"print", "getdate", "user", "system_user", "count", "sum", "avg",
			"max", "min", "len", "substring", "upper", "lower", "ltrim", "rtrim",
			"convert", "cast", "isnull", "coalesce", "case", "when", "then", "else",
			"@@identity", "@@rowcount", "@@error", "raiserror", "try", "catch",
		}
	default:
		return []string{}
	}
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
