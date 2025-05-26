package main

import (
	"strings"
	"unicode"
)

// TokenType define los tipos de tokens
type TokenType string

const (
	// Tokens generales
	KEYWORD    TokenType = "KEYWORD"
	IDENTIFIER TokenType = "IDENTIFIER"
	NUMBER     TokenType = "NUMBER"
	STRING     TokenType = "STRING"
	OPERATOR   TokenType = "OPERATOR"
	DELIMITER  TokenType = "DELIMITER"
	COMMENT    TokenType = "COMMENT"
	WHITESPACE TokenType = "WHITESPACE"
	UNKNOWN    TokenType = "UNKNOWN"

	// Tokens específicos
	FUNCTION TokenType = "FUNCTION"
	CLASS    TokenType = "CLASS"
	VARIABLE TokenType = "VARIABLE"
	CONSTANT TokenType = "CONSTANT"
)

// LanguageKeywords define las palabras reservadas por lenguaje
var LanguageKeywords = map[string][]string{
	"cpp": {
		"auto", "break", "case", "char", "const", "continue", "default", "do",
		"double", "else", "enum", "extern", "float", "for", "goto", "if",
		"int", "long", "register", "return", "short", "signed", "sizeof", "static",
		"struct", "switch", "typedef", "union", "unsigned", "void", "volatile", "while",
		"class", "private", "public", "protected", "virtual", "friend", "inline",
		"template", "typename", "namespace", "using", "try", "catch", "throw",
		"new", "delete", "this", "operator", "bool", "true", "false",
	},
	"html": {
		"html", "head", "title", "body", "div", "span", "p", "a", "img", "ul", "ol", "li",
		"table", "tr", "td", "th", "form", "input", "button", "select", "option",
		"script", "style", "link", "meta", "header", "footer", "nav", "section", "article",
	},
	"javascript": {
		"var", "let", "const", "function", "return", "if", "else", "for", "while", "do",
		"switch", "case", "default", "break", "continue", "try", "catch", "finally",
		"throw", "new", "this", "typeof", "instanceof", "in", "of", "class", "extends",
		"super", "static", "import", "export", "from", "as", "async", "await",
		"true", "false", "null", "undefined",
	},
	"pascal": {
		"program", "var", "const", "type", "procedure", "function", "begin", "end",
		"if", "then", "else", "while", "do", "for", "to", "downto", "repeat", "until",
		"case", "of", "with", "goto", "label", "array", "record", "set", "file",
		"integer", "real", "boolean", "char", "string", "true", "false",
	},
	"plsql": {
		"declare", "begin", "end", "if", "then", "else", "elsif", "case", "when",
		"loop", "for", "while", "exit", "continue", "procedure", "function", "package",
		"cursor", "exception", "raise", "pragma", "type", "subtype", "constant",
		"variable", "table", "index", "trigger", "view", "sequence",
	},
	"python": {
		"and", "as", "assert", "break", "class", "continue", "def", "del", "elif",
		"else", "except", "exec", "finally", "for", "from", "global", "if", "import",
		"in", "is", "lambda", "not", "or", "pass", "print", "raise", "return",
		"try", "while", "with", "yield", "True", "False", "None",
	},
	"tsql": {
		"select", "from", "where", "insert", "update", "delete", "create", "alter",
		"drop", "table", "view", "index", "procedure", "function", "trigger",
		"declare", "set", "if", "else", "while", "for", "begin", "end", "try", "catch",
		"throw", "return", "exec", "execute", "union", "join", "inner", "outer",
		"left", "right", "on", "group", "by", "having", "order", "asc", "desc",
	},
}

// Lexer estructura principal del analizador léxico
type Lexer struct {
	input    string
	position int
	line     int
	column   int
	language string
}

// NewLexer crea un nuevo analizador léxico
func NewLexer(input, language string) *Lexer {
	return &Lexer{
		input:    input,
		position: 0,
		line:     1,
		column:   1,
		language: strings.ToLower(language),
	}
}

// Tokenize analiza el código y devuelve los tokens
func (l *Lexer) Tokenize() ([]Token, []CompilerError) {
	var tokens []Token
	var errors []CompilerError

	for l.position < len(l.input) {
		token, err := l.nextToken()
		if err != nil {
			errors = append(errors, *err)
		}
		if token != nil {
			tokens = append(tokens, *token)
		}
	}

	return tokens, errors
}

// nextToken obtiene el siguiente token
func (l *Lexer) nextToken() (*Token, *CompilerError) {
	l.skipWhitespace()

	if l.position >= len(l.input) {
		return nil, nil
	}

	start := l.position
	startLine := l.line
	startColumn := l.column

	char := l.input[l.position]

	// Comentarios
	if l.isComment() {
		return l.readComment(start, startLine, startColumn)
	}

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

// skipWhitespace omite espacios en blanco
func (l *Lexer) skipWhitespace() {
	for l.position < len(l.input) && unicode.IsSpace(rune(l.input[l.position])) {
		if l.input[l.position] == '\n' {
			l.line++
			l.column = 1
		} else {
			l.column++
		}
		l.position++
	}
}

// advance avanza una posición
func (l *Lexer) advance() {
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

// peek mira el siguiente carácter sin avanzar
func (l *Lexer) peek() byte {
	if l.position+1 >= len(l.input) {
		return 0
	}
	return l.input[l.position+1]
}

// isComment verifica si es el inicio de un comentario
func (l *Lexer) isComment() bool {
	if l.position >= len(l.input) {
		return false
	}

	char := l.input[l.position]
	next := l.peek()

	// Comentarios de línea //
	if char == '/' && next == '/' {
		return true
	}

	// Comentarios de bloque /* */
	if char == '/' && next == '*' {
		return true
	}

	// Comentarios HTML <!-- -->
	if l.language == "html" && char == '<' && l.position+3 < len(l.input) {
		if l.input[l.position:l.position+4] == "<!--" {
			return true
		}
	}

	// Comentarios Python #
	if l.language == "python" && char == '#' {
		return true
	}

	return false
}

// readComment lee un comentario completo
func (l *Lexer) readComment(start, startLine, startColumn int) (*Token, *CompilerError) {
	char := l.input[l.position]
	next := l.peek()

	if char == '/' && next == '/' {
		// Comentario de línea
		for l.position < len(l.input) && l.input[l.position] != '\n' {
			l.advance()
		}
	} else if char == '/' && next == '*' {
		// Comentario de bloque
		l.advance() // /
		l.advance() // *
		for l.position < len(l.input)-1 {
			if l.input[l.position] == '*' && l.input[l.position+1] == '/' {
				l.advance() // *
				l.advance() // /
				break
			}
			l.advance()
		}
	} else if l.language == "html" && char == '<' {
		// Comentario HTML
		for l.position < len(l.input)-2 {
			if l.input[l.position:l.position+3] == "-->" {
				l.advance()
				l.advance()
				l.advance()
				break
			}
			l.advance()
		}
	} else if l.language == "python" && char == '#' {
		// Comentario Python
		for l.position < len(l.input) && l.input[l.position] != '\n' {
			l.advance()
		}
	}

	value := l.input[start:l.position]
	return &Token{
		Type:     string(COMMENT),
		Value:    value,
		Line:     startLine,
		Column:   startColumn,
		Position: start,
	}, nil
}

// readString lee una cadena de texto
func (l *Lexer) readString(start, startLine, startColumn int) (*Token, *CompilerError) {
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

// readNumber lee un número
func (l *Lexer) readNumber(start, startLine, startColumn int) (*Token, *CompilerError) {
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

// readIdentifier lee un identificador o palabra reservada
func (l *Lexer) readIdentifier(start, startLine, startColumn int) (*Token, *CompilerError) {
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

// getIdentifierType determina si un identificador es palabra reservada
func (l *Lexer) getIdentifierType(value string) string {
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

// isOperatorOrDelimiter verifica si es un operador o delimitador
func (l *Lexer) isOperatorOrDelimiter(char byte) bool {
	operators := "+-*/%=<>!&|^~(){}[];,.:?@#$"
	return strings.ContainsRune(operators, rune(char))
}

// readOperatorOrDelimiter lee un operador o delimitador
func (l *Lexer) readOperatorOrDelimiter(start, startLine, startColumn int) (*Token, *CompilerError) {
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

// isMultiCharOperator verifica operadores de múltiples caracteres
func (l *Lexer) isMultiCharOperator(op string) bool {
	multiCharOps := []string{"==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "<<", ">>"}
	for _, mop := range multiCharOps {
		if op == mop {
			return true
		}
	}
	return false
}

// isDelimiter verifica si es un delimitador
func (l *Lexer) isDelimiter(char byte) bool {
	delimiters := "(){}[];,."
	return strings.ContainsRune(delimiters, rune(char))
}
