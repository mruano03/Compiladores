package main

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// RegexAnalyzer estructura del analizador léxico con expresiones regulares
type RegexAnalyzer struct {
	input       string
	position    int
	line        int
	column      int
	language    string
	patterns    LanguagePatterns
	hasPatterns bool
}

// NewRegexAnalyzer crea un nuevo analizador léxico con expresiones regulares
func NewRegexAnalyzer(input, language string) *RegexAnalyzer {
	patterns, hasPatterns := GetLanguagePatterns(strings.ToLower(language))

	return &RegexAnalyzer{
		input:       input,
		position:    0,
		line:        1,
		column:      1,
		language:    strings.ToLower(language),
		patterns:    patterns,
		hasPatterns: hasPatterns,
	}
}

// TokenizeWithRegex analiza el código usando expresiones regulares
func (l *RegexAnalyzer) TokenizeWithRegex() ([]Token, []CompilerError) {
	var tokens []Token
	var errors []CompilerError

	for l.position < len(l.input) {
		token, err := l.nextToken()
		if err != nil {
			errors = append(errors, *err)
		}
		if token != nil {
			// Filtrar tokens de espacios en blanco
			if token.Type != string(WHITESPACE) {
				tokens = append(tokens, *token)
			}
		}
	}

	return tokens, errors
}

// nextToken obtiene el siguiente token usando regex
func (l *RegexAnalyzer) nextToken() (*Token, *CompilerError) {
	if l.position >= len(l.input) {
		return nil, nil
	}

	start := l.position
	startLine := l.line
	startColumn := l.column

	// Saltar espacios en blanco pero mantener información de líneas
	if match, found := MatchPattern(GeneralPatterns.Whitespace, l.input, l.position); found {
		l.advanceBy(len(match))
		return &Token{
			Type:     string(WHITESPACE),
			Value:    match,
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, nil
	}

	// Si tenemos patrones específicos del lenguaje, usarlos
	if l.hasPatterns {
		return l.matchLanguagePatterns(start, startLine, startColumn)
	}

	// Fallback al lexer básico
	return l.fallbackAnalyzer(start, startLine, startColumn)
}

// matchLanguagePatterns intenta hacer match con patrones específicos del lenguaje
func (l *RegexAnalyzer) matchLanguagePatterns(start, startLine, startColumn int) (*Token, *CompilerError) {
	remaining := l.input[l.position:]

	// 1. Comentarios (prioridad alta) - Manejo especial para Python
	if l.patterns.Comments != nil {
		if l.language == "python" {
			// Manejo específico para comentarios de Python con caracteres UTF-8
			if l.position < len(l.input) && l.input[l.position] == '#' {
				// Buscar el final de la línea
				endPos := l.position
				for endPos < len(l.input) && l.input[endPos] != '\n' && l.input[endPos] != '\r' {
					endPos++
				}
				match := l.input[l.position:endPos]
				l.advanceBy(len(match))
				return &Token{
					Type:     string(COMMENT),
					Value:    match,
					Line:     startLine,
					Column:   startColumn,
					Position: start,
				}, nil
			}
		} else {
			// Usar regex para otros lenguajes
			if match := l.patterns.Comments.FindString(remaining); match != "" {
				l.advanceBy(len(match))
				return &Token{
					Type:     string(COMMENT),
					Value:    match,
					Line:     startLine,
					Column:   startColumn,
					Position: start,
				}, nil
			}
		}
	}

	// 2. Strings (prioridad alta)
	if match := GeneralPatterns.String.FindString(remaining); match != "" {
		l.advanceBy(len(match))
		return &Token{
			Type:     string(STRING),
			Value:    match,
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, nil
	}

	// 3. Números (prioridad alta)
	if match := GeneralPatterns.Number.FindString(remaining); match != "" {
		l.advanceBy(len(match))
		return &Token{
			Type:     string(NUMBER),
			Value:    match,
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, nil
	}

	// 4. Funciones (antes que palabras clave) - Con manejo especial para C++
	if l.patterns.Functions != nil {
		if match := l.patterns.Functions.FindString(remaining); match != "" {
			l.advanceBy(len(match))
			return &Token{
				Type:     string(FUNCTION),
				Value:    match,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}

		// Manejo especial para C++: detectar "tipo nombre(" como función
		if l.language == "cpp" {
			cppFunctionPattern := regexp.MustCompile(`^(int|double|float|char|bool|string|void|auto)\s+[a-zA-Z_][a-zA-Z0-9_]*`)
			if match := cppFunctionPattern.FindString(remaining); match != "" {
				// Hacer lookahead para ver si hay paréntesis después
				endPos := l.position + len(match)
				// Saltar espacios en blanco
				for endPos < len(l.input) && (l.input[endPos] == ' ' || l.input[endPos] == '\t') {
					endPos++
				}
				// Verificar si hay paréntesis
				if endPos < len(l.input) && l.input[endPos] == '(' {
					l.advanceBy(len(match))
					return &Token{
						Type:     string(FUNCTION),
						Value:    match,
						Line:     startLine,
						Column:   startColumn,
						Position: start,
					}, nil
				}
			}
		}
	}

	// 5. Clases (antes que palabras clave)
	if l.patterns.Classes != nil {
		if match := l.patterns.Classes.FindString(remaining); match != "" {
			l.advanceBy(len(match))
			return &Token{
				Type:     string(CLASS),
				Value:    match,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}
	}

	// 6. Variables específicas del lenguaje
	if l.patterns.Variables != nil {
		if match := l.patterns.Variables.FindString(remaining); match != "" {
			l.advanceBy(len(match))
			return &Token{
				Type:     string(VARIABLE),
				Value:    match,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}
	}

	// 7. Constantes específicas del lenguaje
	if l.patterns.Constants != nil {
		if match := l.patterns.Constants.FindString(remaining); match != "" {
			l.advanceBy(len(match))
			return &Token{
				Type:     string(CONSTANT),
				Value:    match,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}
	}

	// 8. Palabras clave
	if match, found := MatchAnyKeyword(l.patterns.Keywords, l.input, l.position); found {
		l.advanceBy(len(match))
		return &Token{
			Type:     string(KEYWORD),
			Value:    match,
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, nil
	}

	// 9. Operadores
	if l.patterns.Operators != nil {
		if match := l.patterns.Operators.FindString(remaining); match != "" {
			l.advanceBy(len(match))
			return &Token{
				Type:     string(OPERATOR),
				Value:    match,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}
	}

	// 10. Delimitadores
	if l.patterns.Delimiters != nil {
		if match := l.patterns.Delimiters.FindString(remaining); match != "" {
			l.advanceBy(len(match))
			return &Token{
				Type:     string(DELIMITER),
				Value:    match,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}
	}

	// 11. Identificadores generales
	if match := GeneralPatterns.Identifier.FindString(remaining); match != "" {
		l.advanceBy(len(match))
		return &Token{
			Type:     string(IDENTIFIER),
			Value:    match,
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, nil
	}

	// Si no coincide con ningún patrón, es un token desconocido
	char := l.input[l.position]
	l.advance()
	return &Token{
			Type:     string(UNKNOWN),
			Value:    string(char),
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, &CompilerError{
			Type:     "lexico",
			Message:  "Carácter no reconocido: " + string(char),
			Line:     startLine,
			Column:   startColumn,
			Position: start,
			Severity: "error",
		}
}

// fallbackAnalyzer usa la lógica básica como respaldo
func (l *RegexAnalyzer) fallbackAnalyzer(start, startLine, startColumn int) (*Token, *CompilerError) {
	char := l.input[l.position]

	// Strings
	if char == '"' || char == '\'' || char == '`' {
		return l.readString(start, startLine, startColumn)
	}

	// Números
	if unicode.IsDigit(rune(char)) {
		return l.readNumber(start, startLine, startColumn)
	}

	// Identificadores y palabras reservadas
	if unicode.IsLetter(rune(char)) || char == '_' {
		return l.readIdentifier(start, startLine, startColumn)
	}

	// Operadores y delimitadores
	if l.isOperatorOrDelimiter(char) {
		return l.readOperatorOrDelimiter(start, startLine, startColumn)
	}

	// Token desconocido
	l.advance()
	return &Token{
			Type:     string(UNKNOWN),
			Value:    string(char),
			Line:     startLine,
			Column:   startColumn,
			Position: start,
		}, &CompilerError{
			Type:     "lexico",
			Message:  "Carácter no reconocido: " + string(char),
			Line:     startLine,
			Column:   startColumn,
			Position: start,
			Severity: "error",
		}
}

// Métodos auxiliares

func (l *RegexAnalyzer) readString(start, startLine, startColumn int) (*Token, *CompilerError) {
	quote := l.input[l.position]
	l.advance() // Saltar comilla inicial

	for l.position < len(l.input) {
		if l.input[l.position] == quote {
			l.advance() // Saltar comilla final
			break
		}
		if l.input[l.position] == '\\' && l.position+1 < len(l.input) {
			l.advance() // Saltar escape
		}
		l.advance()
	}

	value := l.input[start:l.position]
	return &Token{
		Type:     string(STRING),
		Value:    value,
		Line:     startLine,
		Column:   startColumn,
		Position: start,
	}, nil
}

func (l *RegexAnalyzer) readNumber(start, startLine, startColumn int) (*Token, *CompilerError) {
	for l.position < len(l.input) && (unicode.IsDigit(rune(l.input[l.position])) || l.input[l.position] == '.') {
		l.advance()
	}

	value := l.input[start:l.position]
	return &Token{
		Type:     string(NUMBER),
		Value:    value,
		Line:     startLine,
		Column:   startColumn,
		Position: start,
	}, nil
}

func (l *RegexAnalyzer) readIdentifier(start, startLine, startColumn int) (*Token, *CompilerError) {
	for l.position < len(l.input) && (unicode.IsLetter(rune(l.input[l.position])) || unicode.IsDigit(rune(l.input[l.position])) || l.input[l.position] == '_') {
		l.advance()
	}

	value := l.input[start:l.position]
	tokenType := l.getIdentifierType(value)

	return &Token{
		Type:     tokenType,
		Value:    value,
		Line:     startLine,
		Column:   startColumn,
		Position: start,
	}, nil
}

func (l *RegexAnalyzer) getIdentifierType(value string) string {
	// Usar patrones regex si están disponibles
	if l.hasPatterns {
		tokenType := GetTokenTypeByPattern(value, l.language)
		if tokenType != UNKNOWN {
			return string(tokenType)
		}
	}

	// Fallback al método original
	keywords, exists := LanguageKeywords[l.language]
	if !exists {
		return string(IDENTIFIER)
	}

	lowerValue := strings.ToLower(value)
	for _, keyword := range keywords {
		if strings.ToLower(keyword) == lowerValue {
			return string(KEYWORD)
		}
	}

	return string(IDENTIFIER)
}

func (l *RegexAnalyzer) isOperatorOrDelimiter(char byte) bool {
	operators := "+-*/%=<>!&|^~(){}[];,.:?@#$"
	return strings.ContainsRune(operators, rune(char))
}

func (l *RegexAnalyzer) readOperatorOrDelimiter(start, startLine, startColumn int) (*Token, *CompilerError) {
	char := l.input[l.position]
	l.advance()

	// Verificar operadores de múltiples caracteres
	if l.position < len(l.input) {
		twoChar := string(char) + string(l.input[l.position])
		if l.isMultiCharOperator(twoChar) {
			l.advance()
			return &Token{
				Type:     string(OPERATOR),
				Value:    twoChar,
				Line:     startLine,
				Column:   startColumn,
				Position: start,
			}, nil
		}
	}

	tokenType := OPERATOR
	if l.isDelimiter(char) {
		tokenType = DELIMITER
	}

	return &Token{
		Type:     string(tokenType),
		Value:    string(char),
		Line:     startLine,
		Column:   startColumn,
		Position: start,
	}, nil
}

func (l *RegexAnalyzer) isMultiCharOperator(op string) bool {
	multiCharOps := []string{"==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "<<", ">>", "===", "!==", "**", "//", "<>", ":="}
	for _, mop := range multiCharOps {
		if op == mop {
			return true
		}
	}
	return false
}

func (l *RegexAnalyzer) isDelimiter(char byte) bool {
	delimiters := "(){}[];,."
	return strings.ContainsRune(delimiters, rune(char))
}

// Métodos de navegación

func (l *RegexAnalyzer) advance() {
	if l.position < len(l.input) {
		if l.input[l.position] == '\n' {
			l.line++
			l.column = 1
		} else {
			l.column++
		}
		l.position++
	}
}

func (l *RegexAnalyzer) advanceBy(count int) {
	for i := 0; i < count && l.position < len(l.input); i++ {
		l.advance()
	}
}

func (l *RegexAnalyzer) peek() byte {
	if l.position >= len(l.input) {
		return 0
	}
	return l.input[l.position]
}

// ValidateRegexPatterns valida que los patrones regex sean correctos
func ValidateRegexPatterns() []error {
	var errors []error

	for language, patterns := range LanguageSpecificPatterns {
		// Validar patrones de palabras clave
		for _, pattern := range patterns.Keywords {
			if pattern == nil {
				errors = append(errors, fmt.Errorf("patrón nil encontrado en %s_keyword", language))
			}
		}

		// Validar otros patrones
		patternMap := map[string]*regexp.Regexp{
			language + "_comments":   patterns.Comments,
			language + "_functions":  patterns.Functions,
			language + "_classes":    patterns.Classes,
			language + "_variables":  patterns.Variables,
			language + "_constants":  patterns.Constants,
			language + "_operators":  patterns.Operators,
			language + "_delimiters": patterns.Delimiters,
		}

		for _, pattern := range patternMap {
			if pattern != nil {
				// Los patrones ya están compilados, si llegamos aquí están bien
				continue
			}
		}
	}

	return errors
}
