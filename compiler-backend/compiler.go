// Mini‑compilador: lexer + analyzer + ejecución real (JS, Python, C++)
// -------------------------------------------------------------------------
// $ go run main.go archivo.cpp
//
// Requisitos en el sistema host:
//   • g++  (C++17)
//   • node (>=14)
//   • python3 (>=3.8)
// Los snippets se escriben en archivos temporales, se compilan/ejecutan y se
// devuelve stdout + stderr.  Usa context con timeout de 4 s por seguridad.

package main

import (
    "context"
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "regexp"
    "strconv"
    "strings"
    "time"
)

// ───────────────────────── Tipos básicos ────────────────────────────────

type TokenType int

const (
    UNKNOWN TokenType = iota
    WHITESPACE
    COMMENT
    STRING
    NUMBER
    KEYWORD
    IDENTIFIER
    FUNCTION
    CLASS
    VARIABLE
    CONSTANT
    OPERATOR
    DELIMITER
)

func (t TokenType) String() string {
    return [...]string{"UNKNOWN", "WHITESPACE", "COMMENT", "STRING", "NUMBER", "KEYWORD", "IDENTIFIER", "FUNCTION", "CLASS", "VARIABLE", "CONSTANT", "OPERATOR", "DELIMITER"}[t]
}

type Token struct {
    Type       TokenType
    Lexeme     string
    Start, End int
}

type ParseNode struct {
    Label    string
    Children []ParseNode
}

type Symbol struct {
    Name string
    Kind string
    Pos  int
}

type CompilerError struct {
    Message  string
    Severity string // "error" | "warning"
    Type     string // "lexico" | "sintactico" | "semantico"
    Pos      int
}

type AnalysisPhase struct {
    Completed      bool
    TokensFound    int
    NodesGenerated int
    SymbolsFound   int
    ErrorsFound    int
}

type AnalysisPhases struct {
    Lexical  AnalysisPhase
    Syntax   AnalysisPhase
    Semantic AnalysisPhase
}

type ExecutionResult struct {
    Output string
    Ok     bool
}

type AnalyzeResponse struct {
    Language        string
    Tokens          []Token
    ParseTree       []ParseNode
    SymbolTable     []Symbol
    Errors          []CompilerError
    ExecutionResult *ExecutionResult
    CanExecute      bool
    AnalysisPhases  AnalysisPhases
    ProcessingTime  time.Duration
}

// Config global: activa la ejecución real por defecto
var GlobalConfig = struct{ EnableRealExecution bool }{EnableRealExecution: true}

// ─────────────────────────────── Lexer ───────────────────────────────────

var GeneralPatterns = struct {
    Identifier *regexp.Regexp
    Number     *regexp.Regexp
    String     *regexp.Regexp
    Whitespace *regexp.Regexp
}{
    Identifier: regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*`),
    Number:     regexp.MustCompile(`^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?`),
    String:     regexp.MustCompile("^(?:\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)"),
    Whitespace: regexp.MustCompile(`^\s+`),
}

type LanguagePatterns struct {
    Keywords             []*regexp.Regexp
    Comments, Functions  *regexp.Regexp
    Classes, Variables   *regexp.Regexp
    Constants, Operators *regexp.Regexp
    Delimiters           *regexp.Regexp
}

var LanguageSpecificPatterns = map[string]LanguagePatterns{
    "cpp": {
        Keywords: []*regexp.Regexp{
            regexp.MustCompile(`^\s*#\s*(?:include|define|ifdef|ifndef|endif|if|else|elif|pragma|undef|line|error|warning)\b`),
            regexp.MustCompile(`\b(?:alignas|and|asm|auto|bool|break|case|catch|char|class|const|constexpr|continue|decltype|delete|do|double|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while)\b`),
        },
        Comments:   regexp.MustCompile(`^(?:(?://[^\n]*)|(?:/\*[\s\S]*?\*/))`),
        Functions:  regexp.MustCompile(`^([a-zA-Z_]\w*(?:\s*::\s*[a-zA-Z_]\w*)?)\s*\([^()]*\)`),
        Classes:    regexp.MustCompile(`^class\s+([a-zA-Z_]\w*)`),
        Variables:  regexp.MustCompile(`^(?:auto|bool|char|double|float|int|long|short|string)\s+([a-zA-Z_]\w*)`),
        Constants:  regexp.MustCompile(`^const\s+(?:auto|bool|char|double|float|int|long|short|string)\s+([a-zA-Z_]\w*)`),
        Operators:  regexp.MustCompile(`^(::|\+\+|--|<<=?|>>=?|<=|>=|==|!=|&&|\|\||->\*?|[+\-*/%=&|^~<>!?])`),
        Delimiters: regexp.MustCompile(`^[()\[\]{};,:.<>\?]`),
    },
    "javascript": {
        Keywords: []*regexp.Regexp{
            regexp.MustCompile(`\b(?:var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|typeof|instanceof|in|of|class|extends|super|static|import|export|from|as|async|await|true|false|null|undefined)\b`),
        },
        Comments:   regexp.MustCompile(`^(?:(?://[^\n]*)|(?:/\*[\s\S]*?\*/))`),
        Functions:  regexp.MustCompile(`^(?:function\s+)?([a-zA-Z_$][\w$]*)\s*\([^)]*\)`),
        Classes:    regexp.MustCompile(`^class\s+([a-zA-Z_$][\w$]*)`),
        Variables:  regexp.MustCompile(`^(?:var|let|const)\s+([a-zA-Z_$][\w$]*)`),
        Constants:  regexp.MustCompile(`^const\s+([a-zA-Z_$][\w$]*)`),
        Operators:  regexp.MustCompile(`^(===|!==|>>>=?|<<=|>>=|<=|>=|==|!=|\+\+|--|\*\*|&&|\|\||=>|[+\-*/%=&|^~<>!?])`),
        Delimiters: regexp.MustCompile(`^[()\[\]{};,.:\?]`),
    },
    "python": {
        Keywords: []*regexp.Regexp{
            regexp.MustCompile(`\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|nonlocal|None|not|or|pass|raise|return|True|try|while|with|yield)\b`),
        },
        Comments:   regexp.MustCompile(`^#[^\n]*`),
        Functions:  regexp.MustCompile(`^def\s+([a-zA-Z_]\w*)\s*\(`),
        Classes:    regexp.MustCompile(`^class\s+([a-zA-Z_]\w*)`),
        Variables:  regexp.MustCompile(`^([a-zA-Z_]\w*)\s*=`),
        Constants:  regexp.MustCompile(`^([A-Z_][A-Z0-9_]*)\s*=`),
        Operators:  regexp.MustCompile(`^(//|<<|>>|<=|>=|==|!=|\*\*|and|or|not|is|in|[+\-*/%=&|^~<>])`),
        Delimiters: regexp.MustCompile(`^[()\[\]{};,.:@]`),
    },
}

// escáner
func matchHere(rx *regexp.Regexp, src string, pos int) (string, bool) {
    if pos >= len(src) {
        return "", false
    }
    if loc := rx.FindStringIndex(src[pos:]); loc != nil && loc[0] == 0 {
        return src[pos : pos+loc[1]], true
    }
    return "", false
}

type matcher func(*LanguagePatterns, string, int) (TokenType, string)

func whitespace(_ *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(GeneralPatterns.Whitespace, s, p); ok {
        return WHITESPACE, lex
    }
    return UNKNOWN, ""
}
func comment(lp *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(lp.Comments, s, p); ok {
        return COMMENT, lex
    }
    return UNKNOWN, ""
}
func strlit(_ *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(GeneralPatterns.String, s, p); ok {
        return STRING, lex
    }
    return UNKNOWN, ""
}
func number(_ *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(GeneralPatterns.Number, s, p); ok {
        return NUMBER, lex
    }
    return UNKNOWN, ""
}
func keyword(lp *LanguagePatterns, s string, p int) (TokenType, string) {
    for _, rx := range lp.Keywords {
        if lex, ok := matchHere(rx, s, p); ok {
            return KEYWORD, lex
        }
    }
    return UNKNOWN, ""
}
func ident(_ *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(GeneralPatterns.Identifier, s, p); ok {
        return IDENTIFIER, lex
    }
    return UNKNOWN, ""
}
func oper(lp *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(lp.Operators, s, p); ok {
        return OPERATOR, lex
    }
    return UNKNOWN, ""
}
func delim(lp *LanguagePatterns, s string, p int) (TokenType, string) {
    if lex, ok := matchHere(lp.Delimiters, s, p); ok {
        return DELIMITER, lex
    }
    return UNKNOWN, ""
}

var order = []matcher{whitespace, comment, strlit, number, keyword, ident, oper, delim}

func Tokenize(src, lang string) []Token {
    lp := LanguageSpecificPatterns[lang]
    var out []Token
    for pos := 0; pos < len(src); {
        matched := false
        for _, fn := range order {
            if typ, lex := fn(&lp, src, pos); typ != UNKNOWN {
                if typ != WHITESPACE {
                    out = append(out, Token{Type: typ, Lexeme: lex, Start: pos, End: pos + len(lex)})
                }
                pos += len(lex)
                matched = true
                break
            }
        }
        if !matched {
            out = append(out, Token{Type: UNKNOWN, Lexeme: string(src[pos]), Start: pos, End: pos + 1})
            pos++
        }
    }
    return out
}

// ───────────────────── Stub Parser & Semantics ───────────────────────────

type Parser struct{ tokens []Token }
func NewParser(t []Token, _ string) *Parser { return &Parser{tokens: t} }
func (p *Parser) Parse() ([]ParseNode, []CompilerError) {
    var n []ParseNode
    for _, tk := range p.tokens { n = append(n, ParseNode{Label: tk.Lexeme}) }
    
    var errors []CompilerError
    
    // Errores sintácticos más realistas
    parentheses := 0
    braces := 0
    brackets := 0
    
    for i, tk := range p.tokens {
        switch tk.Lexeme {
        case "(":
            parentheses++
        case ")":
            parentheses--
            if parentheses < 0 {
                errors = append(errors, CompilerError{
                    Message:  "Error sintáctico: Paréntesis de cierre sin apertura correspondiente",
                    Severity: "error",
                    Type:     "sintactico",
                    Pos:      tk.Start,
                })
            }
        case "{":
            braces++
        case "}":
            braces--
            if braces < 0 {
                errors = append(errors, CompilerError{
                    Message:  "Error sintáctico: Llave de cierre sin apertura correspondiente",
                    Severity: "error",
                    Type:     "sintactico",
                    Pos:      tk.Start,
                })
            }
        case "[":
            brackets++
        case "]":
            brackets--
            if brackets < 0 {
                errors = append(errors, CompilerError{
                    Message:  "Error sintáctico: Corchete de cierre sin apertura correspondiente",
                    Severity: "error",
                    Type:     "sintactico",
                    Pos:      tk.Start,
                })
            }
        case ";":
            if i > 0 && p.tokens[i-1].Lexeme == ";" {
                errors = append(errors, CompilerError{
                    Message:  "Error sintáctico: Punto y coma duplicado",
                    Severity: "warning",
                    Type:     "sintactico",
                    Pos:      tk.Start,
                })
            }
        }
    }
    
    // Verificar balanceo al final
    if parentheses > 0 {
        errors = append(errors, CompilerError{
            Message:  fmt.Sprintf("Error sintáctico: %d paréntesis sin cerrar", parentheses),
            Severity: "error",
            Type:     "sintactico",
            Pos:      0,
        })
    }
    if braces > 0 {
        errors = append(errors, CompilerError{
            Message:  fmt.Sprintf("Error sintáctico: %d llaves sin cerrar", braces),
            Severity: "error",
            Type:     "sintactico",
            Pos:      0,
        })
    }
    if brackets > 0 {
        errors = append(errors, CompilerError{
            Message:  fmt.Sprintf("Error sintáctico: %d corchetes sin cerrar", brackets),
            Severity: "error",
            Type:     "sintactico",
            Pos:      0,
        })
    }
    
    // Error de tokens vacíos
    if len(p.tokens) == 0 {
        errors = append(errors, CompilerError{
            Message:  "Error sintáctico: No se encontraron tokens válidos",
            Severity: "error",
            Type:     "sintactico",
            Pos:      0,
        })
    }
    
    return n, errors
}

type SemanticAnalyzer struct{ 
    tokens []Token
    language string 
}
func NewSemanticAnalyzer(t []Token, _ []ParseNode, lang string) *SemanticAnalyzer { 
    return &SemanticAnalyzer{tokens: t, language: lang} 
}
func (s *SemanticAnalyzer) Analyze() ([]Symbol, []CompilerError) {
    var syms []Symbol
    var errors []CompilerError
    
    // Mapas para rastrear declaraciones y usos
    declared := make(map[string]int) // nombre -> posición de declaración
    used := make(map[string][]int)   // nombre -> posiciones de uso
    
    // Primera pasada: identificar declaraciones y usos según el lenguaje
    for i, tk := range s.tokens {
        if tk.Type == IDENTIFIER {
            // Detectar declaraciones específicas por lenguaje
            isDeclaration := false
            if i > 0 {
                prevToken := s.tokens[i-1]
                
                switch s.language {
                case "cpp":
                    // C++: tipos de datos y palabras clave de declaración
                    if prevToken.Type == KEYWORD && 
                       (strings.Contains(prevToken.Lexeme, "int") || 
                        strings.Contains(prevToken.Lexeme, "char") ||
                        strings.Contains(prevToken.Lexeme, "string") ||
                        strings.Contains(prevToken.Lexeme, "float") ||
                        strings.Contains(prevToken.Lexeme, "double") ||
                        strings.Contains(prevToken.Lexeme, "bool") ||
                        strings.Contains(prevToken.Lexeme, "void")) {
                        isDeclaration = true
                    }
                case "javascript":
                    // JavaScript: var, let, const, function
                    if prevToken.Type == KEYWORD && 
                       (prevToken.Lexeme == "var" || 
                        prevToken.Lexeme == "let" ||
                        prevToken.Lexeme == "const" ||
                        prevToken.Lexeme == "function") {
                        isDeclaration = true
                    }
                case "python":
                    // Python: detectar asignaciones como declaraciones
                    if i+1 < len(s.tokens) && s.tokens[i+1].Lexeme == "=" {
                        isDeclaration = true
                    }
                    // Python: def para funciones
                    if prevToken.Type == KEYWORD && prevToken.Lexeme == "def" {
                        isDeclaration = true
                    }
                    // Python: class para clases
                    if prevToken.Type == KEYWORD && prevToken.Lexeme == "class" {
                        isDeclaration = true
                    }
                default:
                    // Lenguaje genérico
                    if prevToken.Type == KEYWORD && 
                       (strings.Contains(prevToken.Lexeme, "int") || 
                        strings.Contains(prevToken.Lexeme, "var") ||
                        strings.Contains(prevToken.Lexeme, "let") ||
                        strings.Contains(prevToken.Lexeme, "const") ||
                        strings.Contains(prevToken.Lexeme, "string") ||
                        strings.Contains(prevToken.Lexeme, "float") ||
                        strings.Contains(prevToken.Lexeme, "double")) {
                        isDeclaration = true
                    }
                }
            }
            
            if isDeclaration {
                // Verificar redefinición
                if pos, exists := declared[tk.Lexeme]; exists {
                    errors = append(errors, CompilerError{
                        Message:  fmt.Sprintf("Error semántico: Variable '%s' ya fue declarada anteriormente en posición %d", tk.Lexeme, pos),
                        Severity: "error",
                        Type:     "semantico",
                        Pos:      tk.Start,
                    })
                } else {
                    declared[tk.Lexeme] = tk.Start
                    
                    // Determinar el tipo de símbolo
                    symbolKind := "var"
                    if i > 0 {
                        prevToken := s.tokens[i-1]
                        switch prevToken.Lexeme {
                        case "function", "def":
                            symbolKind = "function"
                        case "class":
                            symbolKind = "class"
                        case "const":
                            symbolKind = "constant"
                        }
                    }
                    
                    syms = append(syms, Symbol{Name: tk.Lexeme, Kind: symbolKind, Pos: tk.Start})
                }
            } else {
                // Es un uso
                used[tk.Lexeme] = append(used[tk.Lexeme], tk.Start)
            }
        }
    }
    
    // Segunda pasada: verificar usos de variables no declaradas
    // Excluir palabras reservadas y funciones built-in
    builtInFunctions := s.getBuiltInFunctions()
    
    for varName, positions := range used {
        if _, isDeclared := declared[varName]; !isDeclared && !builtInFunctions[varName] {
            for _, pos := range positions {
                errors = append(errors, CompilerError{
                    Message:  fmt.Sprintf("Error semántico: Variable '%s' no fue declarada", varName),
                    Severity: "error",
                    Type:     "semantico",
                    Pos:      pos,
                })
            }
        }
    }
    
    // Verificar variables declaradas pero no utilizadas
    for varName, declPos := range declared {
        if usages, used := used[varName]; !used || len(usages) == 0 {
            errors = append(errors, CompilerError{
                Message:  fmt.Sprintf("Error semántico: Variable '%s' fue declarada pero nunca utilizada", varName),
                Severity: "warning",
                Type:     "semantico",
                Pos:      declPos,
            })
        }
    }
    
    // Detectar palabras reservadas usadas como identificadores
    reservedWords := s.getReservedWords()
    
    for _, sym := range syms {
        if reservedWords[sym.Name] {
            errors = append(errors, CompilerError{
                Message:  fmt.Sprintf("Error semántico: '%s' es una palabra reservada y no puede usarse como identificador", sym.Name),
                Severity: "error",
                Type:     "semantico",
                Pos:      sym.Pos,
            })
        }
    }
    
    return syms, errors
}

// Obtener funciones built-in según el lenguaje
func (s *SemanticAnalyzer) getBuiltInFunctions() map[string]bool {
    switch s.language {
    case "python":
        return map[string]bool{
            "print": true, "len": true, "str": true, "int": true, "float": true,
            "range": true, "input": true, "type": true, "isinstance": true,
            "list": true, "dict": true, "tuple": true, "set": true,
            "min": true, "max": true, "sum": true, "abs": true,
        }
    case "javascript":
        return map[string]bool{
            "console": true, "alert": true, "prompt": true, "confirm": true,
            "parseInt": true, "parseFloat": true, "isNaN": true, "String": true,
            "Number": true, "Boolean": true, "Array": true, "Object": true,
            "Math": true, "Date": true, "JSON": true, "setTimeout": true,
            "setInterval": true, "clearTimeout": true, "clearInterval": true,
        }
    case "cpp":
        return map[string]bool{
            "cout": true, "cin": true, "endl": true, "std": true,
            "printf": true, "scanf": true, "malloc": true, "free": true,
            "strlen": true, "strcpy": true, "strcmp": true,
        }
    default:
        return map[string]bool{}
    }
}

// Obtener palabras reservadas según el lenguaje
func (s *SemanticAnalyzer) getReservedWords() map[string]bool {
    switch s.language {
    case "python":
        return map[string]bool{
            "and": true, "as": true, "assert": true, "async": true, "await": true,
            "break": true, "class": true, "continue": true, "def": true, "del": true,
            "elif": true, "else": true, "except": true, "False": true, "finally": true,
            "for": true, "from": true, "global": true, "if": true, "import": true,
            "in": true, "is": true, "lambda": true, "nonlocal": true, "None": true,
            "not": true, "or": true, "pass": true, "raise": true, "return": true,
            "True": true, "try": true, "while": true, "with": true, "yield": true,
        }
    case "javascript":
        return map[string]bool{
            "var": true, "let": true, "const": true, "function": true, "return": true,
            "if": true, "else": true, "for": true, "while": true, "do": true,
            "switch": true, "case": true, "break": true, "continue": true,
            "try": true, "catch": true, "finally": true, "throw": true,
            "new": true, "this": true, "typeof": true, "instanceof": true,
            "in": true, "of": true, "class": true, "extends": true, "super": true,
            "static": true, "import": true, "export": true, "from": true, "as": true,
            "async": true, "await": true, "true": true, "false": true, "null": true,
            "undefined": true,
        }
    case "cpp":
        return map[string]bool{
            "if": true, "else": true, "while": true, "for": true, "return": true,
            "int": true, "float": true, "double": true, "char": true, "void": true,
            "class": true, "public": true, "private": true, "protected": true,
            "namespace": true, "using": true, "include": true, "define": true,
            "bool": true, "true": true, "false": true, "const": true, "static": true,
            "virtual": true, "override": true, "template": true, "typename": true,
        }
    default:
        return map[string]bool{
            "if": true, "else": true, "while": true, "for": true, "return": true,
            "int": true, "float": true, "double": true, "char": true, "void": true,
            "class": true, "public": true, "private": true, "protected": true,
        }
    }
}

// ───────────────────── Ejecutores (real y simulado) ──────────────────────

type Executor interface { Execute(code string, symbols []Symbol) ExecutionResult }

// --- Simulado (por si no se quiere compilar de verdad) ---
type FakeExecutor struct{ language string }
func NewExecutor(lang string) *FakeExecutor { return &FakeExecutor{language: lang} }
func (e *FakeExecutor) Execute(_ string, _ []Symbol) ExecutionResult {
    return ExecutionResult{Output: fmt.Sprintf("[simulado %s] OK", e.language), Ok: true}
}

// --- Real: escribe temp file, llama al intérprete/compilador --------------
type RealExecutor struct{ language string }
func NewRealExecutor(lang string) *RealExecutor { return &RealExecutor{language: lang} }

func (re *RealExecutor) Execute(code string, _ []Symbol) ExecutionResult {
    switch re.language {
    case "javascript":
        return runTemp(".js", code, "node")
    case "python":
        return runTemp(".py", code, "python3")
    case "cpp":
        return compileAndRunCPP(code)
    default:
        return ExecutionResult{Output: "Real executor no soporta " + re.language, Ok: false}
    }
}

func runTemp(ext, code, cmdName string) ExecutionResult {
    file, err := os.CreateTemp("", "snippet-*"+ext)
    if err != nil { return ExecutionResult{Output: err.Error(), Ok: false} }
    defer os.Remove(file.Name())
    if _, err = file.WriteString(code); err != nil { return ExecutionResult{Output: err.Error(), Ok: false} }
    file.Close()

    ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
    defer cancel()
    cmd := exec.CommandContext(ctx, cmdName, file.Name())
    out, err := cmd.CombinedOutput()
    return ExecutionResult{Output: string(out), Ok: err == nil}
}

func compileAndRunCPP(code string) ExecutionResult {
    dir, err := os.MkdirTemp("", "cpp-run-*")
    if err != nil { return ExecutionResult{Output: err.Error(), Ok: false} }
    defer os.RemoveAll(dir)

    src := filepath.Join(dir, "main.cpp")
    if err := os.WriteFile(src, []byte(code), 0600); err != nil {
        return ExecutionResult{Output: err.Error(), Ok: false}
    }
    exe := filepath.Join(dir, "prog")

    ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
    defer cancel()

    compile := exec.CommandContext(ctx, "g++", "-std=c++17", src, "-o", exe)
    if out, err := compile.CombinedOutput(); err != nil {
        return ExecutionResult{Output: string(out), Ok: false}
    }

    run := exec.CommandContext(ctx, exe)
    out, err := run.CombinedOutput()
    return ExecutionResult{Output: string(out), Ok: err == nil}
}

// ───────────────────── Detectar lenguaje rápido ──────────────────────────

func DetectLanguage(code string) string {
    low := strings.ToLower(code)
    switch {
    case strings.Contains(low, "#include") || strings.Contains(low, "std::"):
        return "cpp"
    case strings.Contains(low, "def ") || strings.Contains(low, "print("):
        return "python"
    case strings.Contains(low, "function") || strings.Contains(low, "=>"):
        return "javascript"
    default:
        return "unknown"
    }
}

// Función para parsear errores reales de compilación y categorizarlos
func parseCompilerErrors(output string, language string) []CompilerError {
    var errors []CompilerError
    
    switch language {
    case "cpp":
        return parseCPPErrors(output)
    case "python":
        return parsePythonErrors(output)
    case "javascript":
        return parseJavaScriptErrors(output)
    }
    
    return errors
}

// Parsear errores específicos de C++
func parseCPPErrors(output string) []CompilerError {
    var errors []CompilerError
    lines := strings.Split(output, "\n")
    
    for _, line := range lines {
        line = strings.TrimSpace(line)
        
        if strings.Contains(line, "error:") {
            // Extraer información del error
            var errorType, message string
            var lineNum, column int = 1, 1
            var severity string = "error"
            
            // Parsear línea y columna si están disponibles
            if colonIndex := strings.Index(line, ":"); colonIndex != -1 {
                parts := strings.Split(line, ":")
                if len(parts) >= 4 {
                    // Formato: archivo.cpp:línea:columna: error: mensaje
                    if lineStr := parts[1]; lineStr != "" {
                        if ln, err := fmt.Sscanf(lineStr, "%d", &lineNum); err == nil && ln > 0 {
                            // Línea parseada correctamente
                        }
                    }
                    if colStr := parts[2]; colStr != "" {
                        if cn, err := fmt.Sscanf(colStr, "%d", &column); err == nil && cn > 0 {
                            // Columna parseada correctamente
                        }
                    }
                }
            }
            
            // Categorizar el tipo de error basándose en el mensaje
            if strings.Contains(line, "invalid digit") || 
               strings.Contains(line, "invalid character") ||
               strings.Contains(line, "stray") ||
               strings.Contains(line, "unexpected character") {
                errorType = "lexico"
                message = "Error Léxico: " + extractErrorMessage(line)
            } else if strings.Contains(line, "expected") ||
                     strings.Contains(line, "missing") ||
                     strings.Contains(line, "syntax error") ||
                     strings.Contains(line, "unmatched") {
                errorType = "sintactico"
                message = "Error Sintáctico: " + extractErrorMessage(line)
            } else if strings.Contains(line, "not declared") ||
                     strings.Contains(line, "undeclared") ||
                     strings.Contains(line, "redefinition") ||
                     strings.Contains(line, "type") {
                errorType = "semantico"
                message = "Error Semántico: " + extractErrorMessage(line)
            } else {
                // Error general
                errorType = "sintactico"
                message = "Error: " + extractErrorMessage(line)
            }
            
            errors = append(errors, CompilerError{
                Message:  message,
                Severity: severity,
                Type:     errorType,
                Pos:      (lineNum-1)*100 + column, // Aproximación para posición
            })
        }
    }
    
    return errors
}

// Parsear errores específicos de Python
func parsePythonErrors(output string) []CompilerError {
    var errors []CompilerError
    lines := strings.Split(output, "\n")
    
    for i, line := range lines {
        line = strings.TrimSpace(line)
        
        // Python muestra errores en múltiples líneas
        if strings.Contains(line, "File \"") && strings.Contains(line, "line") {
            // Formato: File "archivo.py", line 1
            var lineNum int = 1
            var severity string = "error"
            var errorType, message string
            
            // Extraer número de línea
            re := regexp.MustCompile(`line (\d+)`)
            if matches := re.FindStringSubmatch(line); len(matches) > 1 {
                if ln, err := strconv.Atoi(matches[1]); err == nil {
                    lineNum = ln
                }
            }
            
            // Buscar el mensaje de error en las líneas siguientes
            if i+1 < len(lines) {
                errorLine := strings.TrimSpace(lines[i+1])
                
                // Categorizar errores de Python
                if strings.Contains(errorLine, "SyntaxError") {
                    if strings.Contains(errorLine, "invalid character") ||
                       strings.Contains(errorLine, "invalid decimal literal") ||
                       strings.Contains(errorLine, "invalid token") {
                        errorType = "lexico"
                        message = "Error Léxico: " + strings.TrimPrefix(errorLine, "SyntaxError: ")
                    } else {
                        errorType = "sintactico"
                        message = "Error Sintáctico: " + strings.TrimPrefix(errorLine, "SyntaxError: ")
                    }
                } else if strings.Contains(errorLine, "IndentationError") {
                    errorType = "sintactico"
                    message = "Error Sintáctico: " + strings.TrimPrefix(errorLine, "IndentationError: ")
                } else if strings.Contains(errorLine, "NameError") {
                    errorType = "semantico"
                    message = "Error Semántico: " + strings.TrimPrefix(errorLine, "NameError: ")
                } else if strings.Contains(errorLine, "TypeError") {
                    errorType = "semantico"
                    message = "Error Semántico: " + strings.TrimPrefix(errorLine, "TypeError: ")
                } else if strings.Contains(errorLine, "ValueError") {
                    errorType = "semantico"
                    message = "Error Semántico: " + strings.TrimPrefix(errorLine, "ValueError: ")
                } else if strings.Contains(errorLine, "AttributeError") {
                    errorType = "semantico"
                    message = "Error Semántico: " + strings.TrimPrefix(errorLine, "AttributeError: ")
                } else {
                    errorType = "sintactico"
                    message = "Error: " + errorLine
                }
                
                errors = append(errors, CompilerError{
                    Message:  message,
                    Severity: severity,
                    Type:     errorType,
                    Pos:      (lineNum-1)*100 + 1, // Aproximación para posición
                })
            }
        }
    }
    
    return errors
}

// Parsear errores específicos de JavaScript (Node.js)
func parseJavaScriptErrors(output string) []CompilerError {
    var errors []CompilerError
    lines := strings.Split(output, "\n")
    
    for _, line := range lines {
        line = strings.TrimSpace(line)
        
        // Errores de sintaxis de JavaScript
        if strings.Contains(line, "SyntaxError") {
            var lineNum int = 1
            var severity string = "error"
            var errorType, message string
            
            // Buscar número de línea en el formato "archivo:línea:columna"
            re := regexp.MustCompile(`(\w+\.js):(\d+):(\d+)`)
            if matches := re.FindStringSubmatch(line); len(matches) > 2 {
                if ln, err := strconv.Atoi(matches[2]); err == nil {
                    lineNum = ln
                }
            }
            
            // Categorizar errores de JavaScript
            if strings.Contains(line, "Unexpected token") ||
               strings.Contains(line, "Invalid character") ||
               strings.Contains(line, "Unterminated string") ||
               strings.Contains(line, "Octal literals") {
                errorType = "lexico"
                message = "Error Léxico: " + extractJSErrorMessage(line)
            } else if strings.Contains(line, "Unexpected end of input") ||
                     strings.Contains(line, "Missing") ||
                     strings.Contains(line, "Expected") {
                errorType = "sintactico"
                message = "Error Sintáctico: " + extractJSErrorMessage(line)
            } else {
                errorType = "sintactico"
                message = "Error Sintáctico: " + extractJSErrorMessage(line)
            }
            
            errors = append(errors, CompilerError{
                Message:  message,
                Severity: severity,
                Type:     errorType,
                Pos:      (lineNum-1)*100 + 1, // Aproximación para posición
            })
        }
        
        // Errores de referencia (ReferenceError)
        if strings.Contains(line, "ReferenceError") {
            var lineNum int = 1
            
            // Buscar número de línea
            re := regexp.MustCompile(`at.*?:(\d+):(\d+)`)
            if matches := re.FindStringSubmatch(line); len(matches) > 1 {
                if ln, err := strconv.Atoi(matches[1]); err == nil {
                    lineNum = ln
                }
            }
            
            errors = append(errors, CompilerError{
                Message:  "Error Semántico: " + extractJSErrorMessage(line),
                Severity: "error",
                Type:     "semantico",
                Pos:      (lineNum-1)*100 + 1,
            })
        }
        
        // Errores de tipo (TypeError)
        if strings.Contains(line, "TypeError") {
            var lineNum int = 1
            
            re := regexp.MustCompile(`at.*?:(\d+):(\d+)`)
            if matches := re.FindStringSubmatch(line); len(matches) > 1 {
                if ln, err := strconv.Atoi(matches[1]); err == nil {
                    lineNum = ln
                }
            }
            
            errors = append(errors, CompilerError{
                Message:  "Error Semántico: " + extractJSErrorMessage(line),
                Severity: "error",
                Type:     "semantico",
                Pos:      (lineNum-1)*100 + 1,
            })
        }
    }
    
    return errors
}

// Extraer el mensaje de error de JavaScript
func extractJSErrorMessage(line string) string {
    if idx := strings.Index(line, "SyntaxError: "); idx != -1 {
        return strings.TrimSpace(line[idx+13:])
    }
    if idx := strings.Index(line, "ReferenceError: "); idx != -1 {
        return strings.TrimSpace(line[idx+16:])
    }
    if idx := strings.Index(line, "TypeError: "); idx != -1 {
        return strings.TrimSpace(line[idx+11:])
    }
    return line
}

// Extraer el mensaje de error limpio
func extractErrorMessage(line string) string {
    if idx := strings.Index(line, "error:"); idx != -1 {
        return strings.TrimSpace(line[idx+6:])
    }
    return line
}

// ───────────────────────── Analyzer completo ─────────────────────────────

type RegexAnalyzer struct{ code, lang string }
func NewRegexAnalyzer(c, l string) *RegexAnalyzer { return &RegexAnalyzer{c, l} }
func (r *RegexAnalyzer) TokenizeWithRegex() ([]Token, []CompilerError) { return Tokenize(r.code, r.lang), nil }

func countNodes(n []ParseNode) int { c := len(n); for _, x := range n { c += countNodes(x.Children) }; return c }
func hasCritical(errs []CompilerError) bool { for _, e := range errs { if e.Severity == "error" { return true } }; return false }

func AnalyzeCode(code, language string) AnalyzeResponse {
    start := time.Now()
    if language == "" || language == "auto" { language = DetectLanguage(code) }
    resp := AnalyzeResponse{Language: language}
    var allErrors []CompilerError

    // Léxico
    tok := Tokenize(code, language)
    resp.Tokens = tok
    var lexicalErrors []CompilerError
    
    // Verificar tokens UNKNOWN y analizar su causa
    for i, t := range tok {
        if t.Type == UNKNOWN {
            char := t.Lexeme
            var errorMsg string
            
            // Detectar diferentes tipos de errores léxicos según el lenguaje
            switch language {
            case "python":
                switch {
                case char == "@" && !strings.HasPrefix(code[t.Start:], "@"):
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '@' inesperado en Python (no es un decorador válido)")
                case char == "$":
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '$' no es válido en Python")
                case strings.HasPrefix(char, "\"") && !strings.HasSuffix(char, "\""):
                    errorMsg = fmt.Sprintf("Error Léxico: String no cerrado que comienza con '%s'", char)
                case strings.HasPrefix(char, "'") && !strings.HasSuffix(char, "'"):
                    errorMsg = fmt.Sprintf("Error Léxico: String no cerrado que comienza con '%s'", char)
                case regexp.MustCompile(`^\d+[a-zA-Z]`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número mal formado '%s' - contiene letras", char)
                case regexp.MustCompile(`^[0-9]*\.[0-9]*\.[0-9]*`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número decimal mal formado '%s' - múltiples puntos decimales", char)
                default:
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter o secuencia inesperada '%s' en Python", char)
                }
            case "javascript":
                switch {
                case char == "#":
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '#' no es válido en JavaScript (use // para comentarios)")
                case char == "@" && !strings.HasPrefix(code[t.Start:], "@@"):
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '@' inesperado en JavaScript")
                case strings.HasPrefix(char, "\"") && !strings.HasSuffix(char, "\""):
                    errorMsg = fmt.Sprintf("Error Léxico: String no cerrado que comienza con '%s'", char)
                case strings.HasPrefix(char, "'") && !strings.HasSuffix(char, "'"):
                    errorMsg = fmt.Sprintf("Error Léxico: String no cerrado que comienza con '%s'", char)
                case strings.HasPrefix(char, "`") && !strings.HasSuffix(char, "`"):
                    errorMsg = fmt.Sprintf("Error Léxico: Template literal no cerrado que comienza con '%s'", char)
                case regexp.MustCompile(`^\d+[a-zA-Z]`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número mal formado '%s' - contiene letras", char)
                default:
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter o secuencia inesperada '%s' en JavaScript", char)
                }
            case "cpp":
                switch {
                case char == "@":
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '@' no válido en C++")
                case char == "$":
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '$' no es válido en C++")
                case strings.HasPrefix(char, "\"") && !strings.HasSuffix(char, "\""):
                    errorMsg = fmt.Sprintf("Error Léxico: String no cerrado que comienza con '%s'", char)
                case strings.HasPrefix(char, "'") && !strings.HasSuffix(char, "'"):
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter literal no cerrado que comienza con '%s'", char)
                case regexp.MustCompile(`^\d+[a-zA-Z]`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número mal formado '%s' - contiene letras", char)
                case regexp.MustCompile(`^[0-9]*\.[0-9]*\.[0-9]*`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número decimal mal formado '%s' - múltiples puntos decimales", char)
                default:
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter o secuencia inesperada '%s' en C++", char)
                }
            default:
                switch {
                case char == "@" || char == "#" && language != "python":
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '%s' no válido en %s", char, language)
                case char == "$" && language == "cpp":
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter '$' no es válido en C++")
                case strings.HasPrefix(char, "\"") && !strings.HasSuffix(char, "\""):
                    errorMsg = fmt.Sprintf("Error Léxico: String no cerrado que comienza con '%s'", char)
                case strings.HasPrefix(char, "'") && !strings.HasSuffix(char, "'"):
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter literal no cerrado que comienza con '%s'", char)
                case regexp.MustCompile(`^\d+[a-zA-Z]`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número mal formado '%s' - contiene letras", char)
                case regexp.MustCompile(`^[0-9]*\.[0-9]*\.[0-9]*`).MatchString(char):
                    errorMsg = fmt.Sprintf("Error Léxico: Número decimal mal formado '%s' - múltiples puntos decimales", char)
                default:
                    errorMsg = fmt.Sprintf("Error Léxico: Caracter o secuencia inesperada '%s'", char)
                }
            }
            
            lexicalErrors = append(lexicalErrors, CompilerError{
                Message:  errorMsg,
                Severity: "error",
                Type:     "lexico",
                Pos:      t.Start,
            })
        }
        
        // Detectar números seguidos inmediatamente por identificadores (123abc)
        if t.Type == NUMBER && i+1 < len(tok) {
            nextToken := tok[i+1]
            if nextToken.Type == IDENTIFIER && t.End == nextToken.Start {
                lexicalErrors = append(lexicalErrors, CompilerError{
                    Message:  fmt.Sprintf("Error Léxico: Número mal formado '%s%s' - número seguido de letras", t.Lexeme, nextToken.Lexeme),
                    Severity: "error",
                    Type:     "lexico",
                    Pos:      t.Start,
                })
            }
        }
    }
    
    // Verificar patrones adicionales en el código fuente específicos por lenguaje
    lines := strings.Split(code, "\n")
    for lineNum, line := range lines {
        // Detectar strings mal cerrados
        if strings.Count(line, "\"")%2 != 0 {
            pos := strings.Index(line, "\"")
            if pos != -1 {
                lexicalErrors = append(lexicalErrors, CompilerError{
                    Message:  fmt.Sprintf("Error Léxico: String no cerrado en línea %d", lineNum+1),
                    Severity: "error",
                    Type:     "lexico",
                    Pos:      pos,
                })
            }
        }
        
        // Verificaciones específicas por lenguaje
        switch language {
        case "cpp":
            // Detectar comentarios mal formados para C++
            if strings.Contains(line, "/*") && !strings.Contains(line, "*/") {
                pos := strings.Index(line, "/*")
                lexicalErrors = append(lexicalErrors, CompilerError{
                    Message:  fmt.Sprintf("Error Léxico: Comentario de bloque no cerrado en línea %d", lineNum+1),
                    Severity: "warning",
                    Type:     "lexico",
                    Pos:      pos,
                })
            }
        case "python":
            // Detectar problemas de indentación mixta (tabs y espacios)
            if strings.Contains(line, "\t") && strings.Contains(line, "    ") {
                lexicalErrors = append(lexicalErrors, CompilerError{
                    Message:  fmt.Sprintf("Error Léxico: Indentación mixta (tabs y espacios) en línea %d", lineNum+1),
                    Severity: "warning",
                    Type:     "lexico",
                    Pos:      0,
                })
            }
            // Detectar strings con comillas triples mal cerradas
            if strings.Count(line, "\"\"\"")%2 != 0 || strings.Count(line, "'''")%2 != 0 {
                lexicalErrors = append(lexicalErrors, CompilerError{
                    Message:  fmt.Sprintf("Error Léxico: String de múltiples líneas no cerrado en línea %d", lineNum+1),
                    Severity: "error",
                    Type:     "lexico",
                    Pos:      0,
                })
            }
        case "javascript":
            // Detectar template literals mal cerrados
            if strings.Count(line, "`")%2 != 0 {
                pos := strings.Index(line, "`")
                if pos != -1 {
                    lexicalErrors = append(lexicalErrors, CompilerError{
                        Message:  fmt.Sprintf("Error Léxico: Template literal no cerrado en línea %d", lineNum+1),
                        Severity: "error",
                        Type:     "lexico",
                        Pos:      pos,
                    })
                }
            }
            // Detectar comentarios mal formados para JavaScript
            if strings.Contains(line, "/*") && !strings.Contains(line, "*/") {
                pos := strings.Index(line, "/*")
                lexicalErrors = append(lexicalErrors, CompilerError{
                    Message:  fmt.Sprintf("Error Léxico: Comentario de bloque no cerrado en línea %d", lineNum+1),
                    Severity: "warning",
                    Type:     "lexico",
                    Pos:      pos,
                })
            }
        }
    }
    
    allErrors = append(allErrors, lexicalErrors...)
    resp.AnalysisPhases.Lexical = AnalysisPhase{Completed: true, TokensFound: len(tok), ErrorsFound: len(lexicalErrors)}

    // Sintaxis
    parser := NewParser(tok, language)
    pt, syntaxErrors := parser.Parse()
    allErrors = append(allErrors, syntaxErrors...)
    resp.ParseTree = pt
    resp.AnalysisPhases.Syntax = AnalysisPhase{Completed: true, NodesGenerated: countNodes(pt), ErrorsFound: len(syntaxErrors)}

    // Semántica
    semanticAnalyzer := NewSemanticAnalyzer(tok, pt, language)
    syms, semanticErrors := semanticAnalyzer.Analyze()
    allErrors = append(allErrors, semanticErrors...)
    resp.SymbolTable = syms
    resp.AnalysisPhases.Semantic = AnalysisPhase{Completed: true, SymbolsFound: len(syms), ErrorsFound: len(semanticErrors)}

    resp.Errors = allErrors
    resp.CanExecute = !hasCritical(resp.Errors)
    
    // SIEMPRE ejecutar para capturar errores reales del compilador
        var exec Executor
    if GlobalConfig.EnableRealExecution { 
        exec = NewRealExecutor(language) 
    } else { 
        exec = NewExecutor(language) 
    }
        res := exec.Execute(code, syms)
        resp.ExecutionResult = &res
    
    // SIEMPRE parsear errores reales si existen (independientemente del análisis estático)
    if res.Output != "" {
        realErrors := parseCompilerErrors(res.Output, language)
        if len(realErrors) > 0 {
            resp.Errors = append(resp.Errors, realErrors...)
            
            // Actualizar contadores de fases
            for _, err := range realErrors {
                switch err.Type {
                case "lexico":
                    resp.AnalysisPhases.Lexical.ErrorsFound++
                case "sintactico":
                    resp.AnalysisPhases.Syntax.ErrorsFound++
                case "semantico":
                    resp.AnalysisPhases.Semantic.ErrorsFound++
                }
            }
            
            // Actualizar CanExecute basándose en errores reales también
            resp.CanExecute = false
        }
    }

    resp.ProcessingTime = time.Since(start)
    return resp
}



