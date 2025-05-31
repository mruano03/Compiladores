package main

import (
	"regexp"
)

// TokenPattern define un patrón de expresión regular para un tipo de token
type TokenPattern struct {
	Type    TokenType
	Pattern *regexp.Regexp
	Name    string
}

// LanguagePatterns define los patrones de expresiones regulares por lenguaje
type LanguagePatterns struct {
	Keywords    []*regexp.Regexp
	Identifiers *regexp.Regexp
	Numbers     *regexp.Regexp
	Strings     *regexp.Regexp
	Comments    *regexp.Regexp
	Operators   *regexp.Regexp
	Delimiters  *regexp.Regexp
	Functions   *regexp.Regexp
	Classes     *regexp.Regexp
	Variables   *regexp.Regexp
	Constants   *regexp.Regexp
}

// Patrones generales que aplican a todos los lenguajes
var GeneralPatterns = struct {
	Identifier *regexp.Regexp
	Number     *regexp.Regexp
	String     *regexp.Regexp
	Whitespace *regexp.Regexp
}{
	Identifier: regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*`),
	Number:     regexp.MustCompile(`^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?`),
	String:     regexp.MustCompile(`^("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|` + "`" + `([^` + "`" + `\\]|\\.)*` + "`" + `)`),
	Whitespace: regexp.MustCompile(`^\s+`),
}

// Patrones específicos por lenguaje
var LanguageSpecificPatterns = map[string]LanguagePatterns{
	"cpp": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`^#(include|define|ifdef|ifndef|endif|if|else|elif|pragma|undef|line|error|warning)\b`), // Directivas de preprocesador
			regexp.MustCompile(`^(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|class|private|public|protected|virtual|friend|inline|template|typename|namespace|using|try|catch|throw|new|delete|this|operator|bool|true|false|std|cout|cin|endl|string|vector|map|set|iostream|fstream|sstream)\b`),
		},
		Comments:   regexp.MustCompile(`^(//.*$|/\*[\s\S]*?\*/)`),
		Functions:  regexp.MustCompile(`^([a-zA-Z_][a-zA-Z0-9_]*\s*\(|(int|double|float|char|bool|string|void|auto)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\()`),
		Classes:    regexp.MustCompile(`^class\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Variables:  regexp.MustCompile(`^(int|double|float|char|bool|string|auto)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*[^(]`),
		Constants:  regexp.MustCompile(`^const\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Operators:  regexp.MustCompile(`^(\+\+|--|<<|>>|<=|>=|==|!=|&&|\|\||::|[+\-*/%=<>!&|^~\:])`),
		Delimiters: regexp.MustCompile(`^[(){}\[\];,.<>]`),
	},
	"javascript": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`^(var|let|const|function|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|new|this|typeof|instanceof|in|of|class|extends|super|static|import|export|from|as|async|await|true|false|null|undefined)\b`),
		},
		Comments:   regexp.MustCompile(`^(//.*$|/\*[\s\S]*?\*/)`),
		Functions:  regexp.MustCompile(`^(function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(|[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*function|\([^)]*\)\s*=>|[a-zA-Z_][a-zA-Z0-9_]*\s*=>\s*)`),
		Classes:    regexp.MustCompile(`^class\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Variables:  regexp.MustCompile(`^(var|let|const)\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Constants:  regexp.MustCompile(`^const\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Operators:  regexp.MustCompile(`^(===|!==|<=|>=|==|!=|&&|\|\||\+\+|--|[+\-*/%=<>!&|^~])`),
		Delimiters: regexp.MustCompile(`^[(){}\[\];,.]`),
	},
	"python": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`^(and|as|assert|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|not|or|pass|print|raise|return|try|while|with|yield|True|False|None)\b`),
		},
		Comments:   regexp.MustCompile(`(?m)^#.*`),
		Functions:  regexp.MustCompile(`^def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(`),
		Classes:    regexp.MustCompile(`^class\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Variables:  regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*\s*=`),
		Constants:  regexp.MustCompile(`^[A-Z_][A-Z0-9_]*\s*=`),
		Operators:  regexp.MustCompile(`^(<=|>=|==|!=|//|\*\*|[+\-*/%=<>!&|^~])`),
		Delimiters: regexp.MustCompile(`^[(){}\[\];,.:@]`),
	},
	"pascal": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`(?i)^(program|var|const|type|procedure|function|begin|end|if|then|else|while|do|for|to|downto|repeat|until|case|of|with|goto|label|array|record|set|file|integer|real|boolean|char|string|true|false)\b`),
		},
		Comments:   regexp.MustCompile(`^(\{[^}]*\}|\(\*[\s\S]*?\*\)|//.*$)`),
		Functions:  regexp.MustCompile(`(?i)^(procedure|function)\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Classes:    regexp.MustCompile(`(?i)^type\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*class`),
		Variables:  regexp.MustCompile(`(?i)^var\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Constants:  regexp.MustCompile(`(?i)^const\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Operators:  regexp.MustCompile(`^(<=|>=|<>|:=|[+\-*/<>=])`),
		Delimiters: regexp.MustCompile(`^[();,.:[\]]`),
	},
	"plsql": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`(?i)^(declare|begin|end|if|then|else|elsif|case|when|loop|for|while|exit|continue|procedure|function|package|cursor|exception|raise|pragma|type|subtype|constant|variable|table|index|trigger|view|sequence)\b`),
		},
		Comments:   regexp.MustCompile(`^(--.*$|/\*[\s\S]*?\*/)`),
		Functions:  regexp.MustCompile(`(?i)^(procedure|function)\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Variables:  regexp.MustCompile(`(?i)^[a-zA-Z_][a-zA-Z0-9_]*\s+[a-zA-Z_][a-zA-Z0-9_]*(%TYPE|%ROWTYPE)?`),
		Constants:  regexp.MustCompile(`(?i)^constant\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Operators:  regexp.MustCompile(`^(<=|>=|<>|:=|\|\||[+\-*/<>=])`),
		Delimiters: regexp.MustCompile(`^[();,.:[\]]`),
	},
	"tsql": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`(?i)^(select|from|where|insert|update|delete|create|alter|drop|table|view|index|procedure|function|trigger|declare|set|if|else|while|for|begin|end|try|catch|throw|return|exec|execute|union|join|inner|outer|left|right|on|group|by|having|order|asc|desc|go|print|tran|identity|nvarchar|raiserror)\b`),
		},
		Comments:   regexp.MustCompile(`^(--.*$|/\*[\s\S]*?\*/)`),
		Functions:  regexp.MustCompile(`(?i)^(create\s+)?(procedure|function)\s+[a-zA-Z_][a-zA-Z0-9_]*`),
		Variables:  regexp.MustCompile(`^@[a-zA-Z_][a-zA-Z0-9_]*`),
		Constants:  regexp.MustCompile(`^@@[a-zA-Z_][a-zA-Z0-9_]*`),
		Operators:  regexp.MustCompile(`^(<=|>=|<>|[+\-*/<>=])`),
		Delimiters: regexp.MustCompile(`^[();,.:[\]]`),
	},
	"html": {
		Keywords: []*regexp.Regexp{
			regexp.MustCompile(`(?i)^</?(?:html|head|title|body|div|span|p|a|img|ul|ol|li|table|tr|td|th|form|input|button|select|option|script|style|link|meta|header|footer|nav|section|article)\b`),
		},
		Comments:   regexp.MustCompile(`^<!--[\s\S]*?-->`),
		Functions:  regexp.MustCompile(`^<script[^>]*>[\s\S]*?</script>`),
		Variables:  regexp.MustCompile(`^[a-zA-Z-]+\s*=\s*"[^"]*"`),
		Operators:  regexp.MustCompile(`^[<>/=]`),
		Delimiters: regexp.MustCompile(`^[<>"\s]`),
	},
}

// LanguageKeywords define las palabras clave por lenguaje (para compatibilidad)
var LanguageKeywords = map[string][]string{
	"cpp": {
		"auto", "break", "case", "char", "const", "continue", "default", "do", "double", "else", "enum", "extern", "float", "for", "goto", "if", "int", "long", "register", "return", "short", "signed", "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned", "void", "volatile", "while", "class", "private", "public", "protected", "virtual", "friend", "inline", "template", "typename", "namespace", "using", "try", "catch", "throw", "new", "delete", "this", "operator", "bool", "true", "false", "std", "cout", "cin", "endl", "string", "vector", "map", "set", "iostream", "fstream", "sstream", "#include", "#define", "#ifdef", "#ifndef", "#endif", "#if", "#else", "#elif", "#pragma", "#undef",
	},
	"javascript": {
		"var", "let", "const", "function", "return", "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue", "try", "catch", "finally", "throw", "new", "this", "typeof", "instanceof", "in", "of", "class", "extends", "super", "static", "import", "export", "from", "as", "async", "await", "true", "false", "null", "undefined",
	},
	"python": {
		"and", "as", "assert", "break", "class", "continue", "def", "del", "elif", "else", "except", "exec", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "not", "or", "pass", "print", "raise", "return", "try", "while", "with", "yield", "True", "False", "None",
	},
	"pascal": {
		"program", "var", "const", "type", "procedure", "function", "begin", "end", "if", "then", "else", "while", "do", "for", "to", "downto", "repeat", "until", "case", "of", "with", "goto", "label", "array", "record", "set", "file", "integer", "real", "boolean", "char", "string", "true", "false",
	},
	"plsql": {
		"declare", "begin", "end", "if", "then", "else", "elsif", "case", "when", "loop", "for", "while", "exit", "continue", "procedure", "function", "package", "cursor", "exception", "raise", "pragma", "type", "subtype", "constant", "variable", "table", "index", "trigger", "view", "sequence",
	},
	"tsql": {
		"select", "from", "where", "insert", "update", "delete", "create", "alter", "drop", "table", "view", "index", "procedure", "function", "trigger", "declare", "set", "if", "else", "while", "for", "begin", "end", "try", "catch", "throw", "return", "exec", "execute", "union", "join", "inner", "outer", "left", "right", "on", "group", "by", "having", "order", "asc", "desc", "go", "print", "tran", "identity", "nvarchar", "raiserror",
	},
	"html": {
		"html", "head", "title", "body", "div", "span", "p", "a", "img", "ul", "ol", "li", "table", "tr", "td", "th", "form", "input", "button", "select", "option", "script", "style", "link", "meta", "header", "footer", "nav", "section", "article",
	},
}

// GetLanguagePatterns devuelve los patrones para un lenguaje específico
func GetLanguagePatterns(language string) (LanguagePatterns, bool) {
	patterns, exists := LanguageSpecificPatterns[language]
	return patterns, exists
}

// MatchPattern intenta hacer match de un patrón en una posición específica del texto
func MatchPattern(pattern *regexp.Regexp, text string, position int) (string, bool) {
	if position >= len(text) {
		return "", false
	}

	match := pattern.FindString(text[position:])
	if match != "" {
		return match, true
	}
	return "", false
}

// MatchAnyKeyword intenta hacer match con cualquier palabra clave del lenguaje
func MatchAnyKeyword(patterns []*regexp.Regexp, text string, position int) (string, bool) {
	for _, pattern := range patterns {
		if match, found := MatchPattern(pattern, text, position); found {
			return match, true
		}
	}
	return "", false
}

// IsKeywordPattern verifica si un texto coincide con un patrón de palabra clave
func IsKeywordPattern(text string, patterns []*regexp.Regexp) bool {
	for _, pattern := range patterns {
		if pattern.MatchString(text) {
			return true
		}
	}
	return false
}

// GetTokenTypeByPattern determina el tipo de token basado en patrones regex
func GetTokenTypeByPattern(text string, language string) TokenType {
	patterns, exists := GetLanguagePatterns(language)
	if !exists {
		return UNKNOWN
	}

	// Verificar palabras clave
	if IsKeywordPattern(text, patterns.Keywords) {
		return KEYWORD
	}

	// Verificar funciones
	if patterns.Functions != nil && patterns.Functions.MatchString(text) {
		return FUNCTION
	}

	// Verificar clases
	if patterns.Classes != nil && patterns.Classes.MatchString(text) {
		return CLASS
	}

	// Verificar variables
	if patterns.Variables != nil && patterns.Variables.MatchString(text) {
		return VARIABLE
	}

	// Verificar constantes
	if patterns.Constants != nil && patterns.Constants.MatchString(text) {
		return CONSTANT
	}

	// Verificar números
	if GeneralPatterns.Number.MatchString(text) {
		return NUMBER
	}

	// Verificar strings
	if GeneralPatterns.String.MatchString(text) {
		return STRING
	}

	// Verificar comentarios
	if patterns.Comments != nil && patterns.Comments.MatchString(text) {
		return COMMENT
	}

	// Verificar operadores
	if patterns.Operators != nil && patterns.Operators.MatchString(text) {
		return OPERATOR
	}

	// Verificar delimitadores
	if patterns.Delimiters != nil && patterns.Delimiters.MatchString(text) {
		return DELIMITER
	}

	// Verificar identificadores
	if GeneralPatterns.Identifier.MatchString(text) {
		return IDENTIFIER
	}

	return UNKNOWN
}
