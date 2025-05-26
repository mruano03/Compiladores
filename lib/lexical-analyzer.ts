// Analizador Léxico Avanzado para Compiladores
// Implementa análisis léxico completo con expresiones regulares

export interface LexicalToken {
  type: string;
  value: string;
  lexeme: string;
  line: number;
  column: number;
  position: number;
  category: 'PALABRA_RESERVADA' | 'IDENTIFICADOR' | 'NUMERO' | 'CADENA' | 'OPERADOR' | 'DELIMITADOR' | 'COMENTARIO' | 'LITERAL' | 'SIMBOLO';
}

export interface LexicalError {
  message: string;
  line: number;
  column: number;
  position: number;
  token: string;
}

// Expresiones regulares avanzadas por categoría
export const LEXICAL_PATTERNS = {
  // Números enteros y decimales (incluye notación científica)
  NUMBER_INTEGER: /^[+-]?\d+$/,
  NUMBER_DECIMAL: /^[+-]?\d+\.\d+([eE][+-]?\d+)?$/,
  NUMBER_SCIENTIFIC: /^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/,
  NUMBER_HEXADECIMAL: /^0[xX][0-9a-fA-F]+$/,
  NUMBER_OCTAL: /^0[0-7]+$/,
  NUMBER_BINARY: /^0[bB][01]+$/,

  // Identificadores y variables
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  IDENTIFIER_WITH_NAMESPACE: /^[a-zA-Z_][a-zA-Z0-9_]*(::[a-zA-Z_][a-zA-Z0-9_]*)*$/,

  // Cadenas de texto
  STRING_DOUBLE_QUOTE: /^"([^"\\]|\\.)*"$/,
  STRING_SINGLE_QUOTE: /^'([^'\\]|\\.)*'$/,
  STRING_TEMPLATE: /^`([^`\\]|\\.)*`$/,
  STRING_MULTILINE: /^"""[\s\S]*?"""$/,

  // Caracteres
  CHARACTER: /^'[^'\\]'$/,
  CHARACTER_ESCAPE: /^'\\[nrtbf0'"\\]'$/,

  // Operadores matemáticos
  OPERATOR_ARITHMETIC: /^(\+\+|--|[+\-*/%=])$/,
  OPERATOR_ASSIGNMENT: /^(=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=)$/,
  OPERATOR_COMPARISON: /^(==|!=|<=|>=|<|>)$/,
  OPERATOR_LOGICAL: /^(&&|\|\||!)$/,
  OPERATOR_BITWISE: /^(&|\||\^|~|<<|>>)$/,

  // Delimitadores y símbolos
  DELIMITER_PARENTHESIS: /^[()]$/,
  DELIMITER_BRACKET: /^[\[\]]$/,
  DELIMITER_BRACE: /^[{}]$/,
  DELIMITER_SEMICOLON: /^;$/,
  DELIMITER_COMMA: /^,$/,
  DELIMITER_DOT: /^\.$/,
  DELIMITER_COLON: /^:$/,
  DELIMITER_QUESTION: /^\?$/,

  // Comentarios
  COMMENT_SINGLE_LINE: /^\/\/.*$/,
  COMMENT_MULTI_LINE: /^\/\*[\s\S]*?\*\/$/,
  COMMENT_PYTHON: /^#.*$/,
  COMMENT_SQL: /^--.*$/,
  COMMENT_PASCAL: /^(\{.*?\}|\(\*.*?\*\))$/,

  // Directivas de preprocesador
  PREPROCESSOR: /^#[a-zA-Z_][a-zA-Z0-9_]*.*$/,

  // Literales booleanos
  BOOLEAN_LITERAL: /^(true|false|True|False|TRUE|FALSE)$/,

  // Null/Undefined
  NULL_LITERAL: /^(null|NULL|nil|NIL|None|undefined)$/,

  // Espacios en blanco
  WHITESPACE: /^\s+$/,

  // Salto de línea
  NEWLINE: /^\n$/,

  // Patrones específicos de Python
  PYTHON_INDENT: /^[ ]{4}|^\t/,
  PYTHON_DEDENT: /^$/,
};

// Palabras reservadas expandidas por lenguaje
export const RESERVED_WORDS_EXTENDED = {
  javascript: [
    // Palabras clave básicas
    'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 
    'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 
    'finally', 'throw', 'new', 'this', 'super', 'class', 'extends', 'static',
    'import', 'export', 'from', 'as', 'default', 'async', 'await', 'yield',
    'typeof', 'instanceof', 'in', 'delete', 'void', 'with', 'debugger',
    // Palabras reservadas futuras
    'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public'
  ],
  python: [
    // Palabras clave
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
    'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
    'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or',
    'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
    // Funciones built-in comunes
    'print', 'input', 'len', 'range', 'str', 'int', 'float', 'bool',
    'list', 'dict', 'tuple', 'set', 'type', 'isinstance', 'hasattr'
  ],
  'C++': [
    // Palabras clave C++
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default',
    'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto',
    'if', 'inline', 'int', 'long', 'register', 'restrict', 'return',
    'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
    'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
    // Palabras clave específicas de C++
    'class', 'namespace', 'using', 'public', 'private', 'protected',
    'virtual', 'override', 'final', 'explicit', 'operator', 'template',
    'typename', 'friend', 'mutable', 'const_cast', 'static_cast',
    'dynamic_cast', 'reinterpret_cast', 'new', 'delete', 'this',
    // Tipos estándar
    'bool', 'true', 'false', 'nullptr'
  ],
  html: [
    // Etiquetas HTML comunes
    'html', 'head', 'title', 'body', 'div', 'span', 'p', 'a', 'img',
    'table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'form', 'input',
    'button', 'script', 'style', 'link', 'meta', 'header', 'footer',
    'nav', 'main', 'section', 'article', 'aside', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'br', 'hr', 'strong', 'em', 'code', 'pre'
  ],
  pascal: [
    // Palabras clave Pascal
    'program', 'var', 'const', 'type', 'procedure', 'function', 'begin',
    'end', 'if', 'then', 'else', 'while', 'do', 'for', 'to', 'downto',
    'repeat', 'until', 'case', 'of', 'array', 'record', 'string',
    'integer', 'real', 'boolean', 'char', 'byte', 'word', 'longint',
    'and', 'or', 'not', 'div', 'mod', 'nil', 'true', 'false',
    'uses', 'unit', 'interface', 'implementation', 'with', 'goto', 'label'
  ],
  'PL/SQL': [
    // Comandos SQL
    'select', 'from', 'where', 'insert', 'update', 'delete', 'create',
    'table', 'alter', 'drop', 'index', 'view', 'sequence', 'trigger',
    // PL/SQL específico
    'declare', 'begin', 'end', 'if', 'then', 'else', 'elsif', 'loop',
    'while', 'for', 'cursor', 'procedure', 'function', 'package',
    'exception', 'when', 'others', 'raise', 'pragma', 'type',
    // Tipos de datos
    'varchar2', 'number', 'date', 'timestamp', 'clob', 'blob',
    'boolean', 'binary_integer', 'pls_integer'
  ],
  'T-SQL': [
    // Comandos SQL Server
    'select', 'from', 'where', 'insert', 'update', 'delete', 'create',
    'table', 'alter', 'drop', 'index', 'view', 'procedure', 'function',
    'trigger', 'database', 'schema', 'constraint', 'primary', 'foreign',
    'key', 'references', 'check', 'unique', 'not', 'null', 'identity',
    // T-SQL específico
    'declare', 'begin', 'end', 'if', 'else', 'while', 'break',
    'continue', 'goto', 'return', 'try', 'catch', 'throw', 'raiserror',
    // Tipos de datos
    'int', 'bigint', 'smallint', 'tinyint', 'bit', 'decimal', 'numeric',
    'float', 'real', 'datetime', 'datetime2', 'date', 'time',
    'varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext'
  ]
};

export class LexicalAnalyzer {
  private code: string;
  private language: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: LexicalToken[] = [];
  private errors: LexicalError[] = [];

  constructor(code: string, language: string) {
    this.code = code;
    this.language = language.toLowerCase();
  }

  public analyze(): { tokens: LexicalToken[], errors: LexicalError[] } {
    this.reset();
    
    let iterations = 0;
    const maxIterations = this.code.length * 2; // Safety limit
    
    while (this.position < this.code.length && iterations < maxIterations) {
      const char = this.code[this.position];
      const previousPosition = this.position;
      
      // Saltar espacios en blanco
      if (this.isWhitespace(char)) {
        this.skipWhitespace();
        continue;
      }
      
      // Manejar saltos de línea
      if (char === '\n') {
        this.line++;
        this.column = 1;
        this.position++;
        continue;
      }
      
      // Intentar reconocer tokens
      const token = this.getNextToken();
      if (token) {
        this.tokens.push(token);
      } else {
        // Token no reconocido
        this.addError(`Carácter no reconocido: '${char}'`, char);
        this.position++;
        this.column++;
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.addError(`Error interno: posición no avanza en '${char}'`, char);
        this.position++; // Force advancement to prevent infinite loop
        this.column++;
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis léxico detenido por seguridad (posible bucle infinito)', this.code[this.position] || '');
    }
    
    return {
      tokens: this.tokens,
      errors: this.errors
    };
  }

  private reset(): void {
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char) && char !== '\n';
  }

  private skipWhitespace(): void {
    while (this.position < this.code.length && this.isWhitespace(this.code[this.position])) {
      this.position++;
      this.column++;
    }
  }

  private getNextToken(): LexicalToken | null {
    const startPosition = this.position;
    const startColumn = this.column;
    
    // Intentar reconocer diferentes tipos de tokens
    let token = this.tryMatchComment() ||
                this.tryMatchString() ||
                this.tryMatchNumber() ||
                this.tryMatchOperator() ||
                this.tryMatchDelimiter() ||
                this.tryMatchIdentifierOrKeyword() ||
                this.tryMatchPreprocessor();
    
    if (token) {
      token.position = startPosition;
      token.line = this.line;
      token.column = startColumn;
    }
    
    return token;
  }

  private tryMatchComment(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    // Comentario de línea simple (//)
    if (remaining.startsWith('//')) {
      const match = remaining.match(/^\/\/.*$/);
      if (match) {
        const value = match[0];
        this.advance(value.length);
        return this.createToken('COMENTARIO_LINEA', value, 'COMENTARIO');
      }
    }
    
    // Comentario multilínea (/* */)
    if (remaining.startsWith('/*')) {
      const match = remaining.match(/^\/\*[\s\S]*?\*\//);
      if (match) {
        const value = match[0];
        this.advanceMultiline(value);
        return this.createToken('COMENTARIO_BLOQUE', value, 'COMENTARIO');
      }
    }
    
    // Comentario Python (#)
    if (remaining.startsWith('#') && this.language === 'python') {
      const match = remaining.match(/^#.*$/);
      if (match) {
        const value = match[0];
        this.advance(value.length);
        return this.createToken('COMENTARIO_PYTHON', value, 'COMENTARIO');
      }
    }
    
    // Comentario SQL (--)
    if (remaining.startsWith('--') && (this.language.includes('sql'))) {
      const match = remaining.match(/^--.*$/);
      if (match) {
        const value = match[0];
        this.advance(value.length);
        return this.createToken('COMENTARIO_SQL', value, 'COMENTARIO');
      }
    }
    
    return null;
  }

  private tryMatchString(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    // Cadena con comillas dobles
    if (remaining.startsWith('"')) {
      const match = remaining.match(/^"([^"\\]|\\.)*"/);
      if (match) {
        const value = match[0];
        this.advance(value.length);
        return this.createToken('CADENA_DOBLE', value, 'CADENA');
      }
    }
    
    // Cadena con comillas simples
    if (remaining.startsWith("'")) {
      const match = remaining.match(/^'([^'\\]|\\.)*'/);
      if (match) {
        const value = match[0];
        this.advance(value.length);
        return this.createToken('CADENA_SIMPLE', value, 'CADENA');
      }
    }
    
    // Template string (JavaScript)
    if (remaining.startsWith('`') && this.language === 'javascript') {
      const match = remaining.match(/^`([^`\\]|\\.)*`/);
      if (match) {
        const value = match[0];
        this.advanceMultiline(value);
        return this.createToken('TEMPLATE_STRING', value, 'CADENA');
      }
    }
    
    return null;
  }

  private tryMatchNumber(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    // Número hexadecimal
    const hexMatch = remaining.match(/^0[xX][0-9a-fA-F]+/);
    if (hexMatch) {
      const value = hexMatch[0];
      this.advance(value.length);
      return this.createToken('NUMERO_HEXADECIMAL', value, 'NUMERO');
    }
    
    // Número binario
    const binMatch = remaining.match(/^0[bB][01]+/);
    if (binMatch) {
      const value = binMatch[0];
      this.advance(value.length);
      return this.createToken('NUMERO_BINARIO', value, 'NUMERO');
    }
    
    // Número decimal o entero
    const numMatch = remaining.match(/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?/);
    if (numMatch) {
      const value = numMatch[0];
      this.advance(value.length);
      
      if (value.includes('.') || value.includes('e') || value.includes('E')) {
        return this.createToken('NUMERO_DECIMAL', value, 'NUMERO');
      } else {
        return this.createToken('NUMERO_ENTERO', value, 'NUMERO');
      }
    }
    
    return null;
  }

  private tryMatchOperator(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    // Operadores de múltiples caracteres (orden importa)
    const multiCharOps = [
      '===', '!==', '++', '--', '<<', '>>', '<=', '>=', '==', '!=',
      '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
      '<<=', '>>='
    ];
    
    for (const op of multiCharOps) {
      if (remaining.startsWith(op)) {
        this.advance(op.length);
        return this.createToken(this.getOperatorType(op), op, 'OPERADOR');
      }
    }
    
    // Operadores de un carácter
    const singleCharOps = ['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?'];
    const firstChar = remaining[0];
    
    if (singleCharOps.includes(firstChar)) {
      this.advance(1);
      return this.createToken(this.getOperatorType(firstChar), firstChar, 'OPERADOR');
    }
    
    return null;
  }

  private tryMatchDelimiter(): LexicalToken | null {
    const char = this.code[this.position];
    const delimiters = ['(', ')', '[', ']', '{', '}', ';', ',', '.', ':'];
    
    if (delimiters.includes(char)) {
      this.advance(1);
      return this.createToken(this.getDelimiterType(char), char, 'DELIMITADOR');
    }
    
    return null;
  }

  private tryMatchIdentifierOrKeyword(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    const match = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    
    if (match) {
      const value = match[0];
      this.advance(value.length);
      
      // Verificar si es palabra reservada
      const reservedWords = RESERVED_WORDS_EXTENDED[this.language as keyof typeof RESERVED_WORDS_EXTENDED] || [];
      
      if (reservedWords.includes(value.toLowerCase()) || reservedWords.includes(value)) {
        return this.createToken('PALABRA_RESERVADA', value, 'PALABRA_RESERVADA');
      } else {
        return this.createToken('IDENTIFICADOR', value, 'IDENTIFICADOR');
      }
    }
    
    return null;
  }

  private tryMatchPreprocessor(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    if (remaining.startsWith('#') && this.language === 'c++') {
      const match = remaining.match(/^#[a-zA-Z_][a-zA-Z0-9_]*.*$/);
      if (match) {
        const value = match[0];
        this.advance(value.length);
        return this.createToken('DIRECTIVA_PREPROCESADOR', value, 'SIMBOLO');
      }
    }
    
    return null;
  }

  private getOperatorType(op: string): string {
    const arithmeticOps = ['+', '-', '*', '/', '%', '++', '--'];
    const comparisonOps = ['==', '!=', '<', '>', '<=', '>=', '===', '!=='];
    const logicalOps = ['&&', '||', '!'];
    const assignmentOps = ['=', '+=', '-=', '*=', '/=', '%='];
    const bitwiseOps = ['&', '|', '^', '~', '<<', '>>', '&=', '|=', '^=', '<<=', '>>='];
    
    if (arithmeticOps.includes(op)) return 'OPERADOR_ARITMETICO';
    if (comparisonOps.includes(op)) return 'OPERADOR_COMPARACION';
    if (logicalOps.includes(op)) return 'OPERADOR_LOGICO';
    if (assignmentOps.includes(op)) return 'OPERADOR_ASIGNACION';
    if (bitwiseOps.includes(op)) return 'OPERADOR_BITWISE';
    
    return 'OPERADOR';
  }

  private getDelimiterType(delimiter: string): string {
    const types: { [key: string]: string } = {
      '(': 'PARENTESIS_ABIERTO',
      ')': 'PARENTESIS_CERRADO',
      '[': 'CORCHETE_ABIERTO',
      ']': 'CORCHETE_CERRADO',
      '{': 'LLAVE_ABIERTA',
      '}': 'LLAVE_CERRADA',
      ';': 'PUNTO_COMA',
      ',': 'COMA',
      '.': 'PUNTO',
      ':': 'DOS_PUNTOS'
    };
    
    return types[delimiter] || 'DELIMITADOR';
  }

  private createToken(type: string, value: string, category: LexicalToken['category']): LexicalToken {
    return {
      type,
      value,
      lexeme: value,
      line: this.line,
      column: this.column,
      position: this.position,
      category
    };
  }

  private advance(count: number): void {
    this.position += count;
    this.column += count;
  }

  private advanceMultiline(text: string): void {
    for (const char of text) {
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      this.position++;
    }
  }

  private addError(message: string, token: string): void {
    this.errors.push({
      message,
      line: this.line,
      column: this.column,
      position: this.position,
      token
    });
  }
}