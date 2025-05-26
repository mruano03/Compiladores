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
    
    // Verificar si el código está vacío o solo tiene espacios
    if (!this.code.trim()) {
      return { tokens: [], errors: [] };
    }
    
    let iterations = 0;
    const maxIterations = this.code.length * 3; // Safety limit aumentado
    
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
        // Token no reconocido - manejar según el lenguaje
        if (this.language === 'unknown') {
          // Para lenguaje desconocido, ser muy estricto
          if (/[a-zA-Z]/.test(char)) {
            // Buscar toda la palabra no reconocida
            let wordEnd = this.position;
            while (wordEnd < this.code.length && /[a-zA-Z0-9]/.test(this.code[wordEnd])) {
              wordEnd++;
            }
            const unknownWord = this.code.slice(this.position, wordEnd);
            this.addError(`Token no reconocido: '${unknownWord}' - No se puede determinar el lenguaje`, unknownWord);
            this.advance(unknownWord.length);
          } else {
            this.addError(`Carácter no válido: '${char}' - Lenguaje no reconocido`, char);
            this.advance(1);
          }
        } else {
          // Para lenguajes conocidos, mantener la lógica anterior pero menos permisiva
          if (this.isValidSingleChar(char)) {
            // Crear token para caracteres válidos individuales
            const charToken = this.createToken('CARACTER_ESPECIAL', char, 'SIMBOLO');
            charToken.position = this.position;
            charToken.line = this.line;
            charToken.column = this.column;
            this.tokens.push(charToken);
            this.advance(1);
          } else if (/[a-zA-Z0-9]/.test(char)) {
            // Si es alfanumérico, crear token genérico con advertencia
            const charToken = this.createToken('CARACTER', char, 'SIMBOLO');
            charToken.position = this.position;
            charToken.line = this.line;
            charToken.column = this.column;
            this.tokens.push(charToken);
            this.addError(`Token posiblemente no válido: '${char}'`, char);
            this.advance(1);
          } else if (char === '\r' || char === '\t' || /[\u00a0\u2028\u2029]/.test(char)) {
            // Caracteres de control - simplemente ignorar
            this.advance(1);
          } else {
            // Solo reportar error para caracteres verdaderamente problemáticos
            const problematicChars = /[^\x20-\x7E\n\r\t\s]/; // Caracteres no ASCII imprimibles
            if (problematicChars.test(char) && char !== '´' && char !== '`' && char !== '"' && char !== "'" && char !== '—' && char !== '–') {
              this.addError(`Carácter no válido: '${char}' (código: ${char.charCodeAt(0)})`, char);
            } else {
              // Para otros caracteres, crear token genérico en lugar de error
              const charToken = this.createToken('SIMBOLO_ESPECIAL', char, 'SIMBOLO');
              charToken.position = this.position;
              charToken.line = this.line;
              charToken.column = this.column;
              this.tokens.push(charToken);
            }
            this.advance(1);
          }
        }
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        // Solo forzar avance si realmente no se movió nada
        this.position++;
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
      const lineEnd = remaining.indexOf('\n');
      const value = lineEnd === -1 ? remaining : remaining.slice(0, lineEnd);
      this.advance(value.length);
      return this.createToken('COMENTARIO_LINEA', value, 'COMENTARIO');
    }
    
    // Comentario multilínea (/* */)
    if (remaining.startsWith('/*')) {
      const endIndex = remaining.indexOf('*/');
      if (endIndex !== -1) {
        const value = remaining.slice(0, endIndex + 2);
        this.advanceMultiline(value);
        return this.createToken('COMENTARIO_BLOQUE', value, 'COMENTARIO');
      } else {
        // Comentario sin cerrar
        const value = remaining;
        this.advanceMultiline(value);
        this.addError('Comentario multilínea sin cerrar', value);
        return this.createToken('COMENTARIO_BLOQUE_INCOMPLETO', value, 'COMENTARIO');
      }
    }
    
    // Comentario Python (#)
    if (remaining.startsWith('#') && (this.language === 'python' || this.language.includes('sql'))) {
      const lineEnd = remaining.indexOf('\n');
      const value = lineEnd === -1 ? remaining : remaining.slice(0, lineEnd);
      this.advance(value.length);
      return this.createToken('COMENTARIO_PYTHON', value, 'COMENTARIO');
    }
    
    // Comentario SQL (--)
    if (remaining.startsWith('--') && (this.language.toLowerCase().includes('sql'))) {
      const lineEnd = remaining.indexOf('\n');
      const value = lineEnd === -1 ? remaining : remaining.slice(0, lineEnd);
      this.advance(value.length);
      return this.createToken('COMENTARIO_SQL', value, 'COMENTARIO');
    }
    
    // Comentario Pascal { } o (* *)
    if (this.language === 'pascal') {
      if (remaining.startsWith('{')) {
        const endIndex = remaining.indexOf('}');
        if (endIndex !== -1) {
          const value = remaining.slice(0, endIndex + 1);
          this.advanceMultiline(value);
          return this.createToken('COMENTARIO_PASCAL', value, 'COMENTARIO');
        }
      }
      
      if (remaining.startsWith('(*')) {
        const endIndex = remaining.indexOf('*)');
        if (endIndex !== -1) {
          const value = remaining.slice(0, endIndex + 2);
          this.advanceMultiline(value);
          return this.createToken('COMENTARIO_PASCAL', value, 'COMENTARIO');
        }
      }
    }
    
    return null;
  }

  private tryMatchString(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    // Cadena con comillas dobles
    if (remaining.startsWith('"')) {
      // Buscar el cierre de la cadena, manejando escapes
      let i = 1;
      let escaped = false;
      while (i < remaining.length) {
        const char = remaining[i];
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          // Encontramos el cierre
          const value = remaining.slice(0, i + 1);
          this.advance(value.length);
          return this.createToken('CADENA_DOBLE', value, 'CADENA');
        } else if (char === '\n' && this.language !== 'python') {
          // Cadena sin cerrar (excepto en Python que permite multilínea)
          break;
        }
        i++;
      }
      
      // Cadena sin cerrar - crear token pero reportar error
      const value = remaining.slice(0, i);
      this.advance(value.length);
      this.addError('Cadena sin cerrar', value);
      return this.createToken('CADENA_DOBLE_INCOMPLETA', value, 'CADENA');
    }
    
    // Cadena con comillas simples
    if (remaining.startsWith("'")) {
      let i = 1;
      let escaped = false;
      while (i < remaining.length) {
        const char = remaining[i];
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === "'") {
          const value = remaining.slice(0, i + 1);
          this.advance(value.length);
          return this.createToken('CADENA_SIMPLE', value, 'CADENA');
        } else if (char === '\n' && this.language !== 'python') {
          break;
        }
        i++;
      }
      
      // Cadena sin cerrar
      const value = remaining.slice(0, i);
      this.advance(value.length);
      this.addError('Cadena sin cerrar', value);
      return this.createToken('CADENA_SIMPLE_INCOMPLETA', value, 'CADENA');
    }
    
    // Template string (JavaScript)
    if (remaining.startsWith('`') && this.language === 'javascript') {
      let i = 1;
      let escaped = false;
      while (i < remaining.length) {
        const char = remaining[i];
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '`') {
          const value = remaining.slice(0, i + 1);
          this.advanceMultiline(value);
          return this.createToken('TEMPLATE_STRING', value, 'CADENA');
        }
        i++;
      }
      
      // Template string sin cerrar
      const value = remaining.slice(0, i);
      this.advanceMultiline(value);
      this.addError('Template string sin cerrar', value);
      return this.createToken('TEMPLATE_STRING_INCOMPLETA', value, 'CADENA');
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
    
    // Número decimal o entero (más permisivo)
    const numMatch = remaining.match(/^[+-]?\d*\.?\d+([eE][+-]?\d+)?/);
    if (numMatch) {
      const value = numMatch[0];
      
      // Validar que no sea solo un punto
      if (value === '.' || value === '+.' || value === '-.') {
        return null;
      }
      
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
    
    // Operadores específicos por lenguaje
    const languageSpecificOps: { [key: string]: string[] } = {
      'python': ['**', '//', '+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '>>=', '<<='],
      'c++': ['<<', '>>', '->', '::', '.*', '->*', '++', '--'],
      'javascript': ['=>', '...', '??', '?.', '**', '++', '--'],
      'pascal': [':=', '<>', '<=', '>='],
      'sql': ['||', '!=', '<>', '<=', '>='],
      'pl/sql': ['||', ':=', '=>', '!=', '<>', '<=', '>=', '%'],
      't-sql': ['+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '!=', '<>', '<=', '>=']
    };
    
    // Operadores de múltiples caracteres (orden importa - más largos primero)
    const multiCharOps = [
      '===', '!==', '<<=', '>>=', '**=', '//=', '->*', '...', 
      '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '<>', 
      '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
      '->', '::', '.*', '=>', '??', '?.', '**', '//', ':=', '||'
    ];
    
    // Añadir operadores específicos del lenguaje actual
    const langOps = languageSpecificOps[this.language] || [];
    const allOps = [...new Set([...multiCharOps, ...langOps])].sort((a, b) => b.length - a.length);
    
    for (const op of allOps) {
      if (remaining.startsWith(op)) {
        this.advance(op.length);
        return this.createToken(this.getOperatorType(op), op, 'OPERADOR');
      }
    }
    
    // Operadores de un carácter
    const singleCharOps = ['+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?', '@'];
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
    
    // Si el lenguaje es desconocido, ser mucho más estricto
    if (this.language === 'unknown') {
      // No reconocer cadenas aleatorias como identificadores válidos
      const match = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]{0,15}/);
      if (match) {
        const value = match[0];
        
        // Verificar si parece una palabra real o código válido
        const hasVowels = /[aeiouAEIOU]/.test(value);
        const hasConsonants = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/.test(value);
        const isReasonableLength = value.length >= 2 && value.length <= 15;
        const isAllSameChar = /^(.)\1+$/.test(value);
        const hasRepeatingPattern = /(.{2,})\1{2,}/.test(value);
        
        // Si parece una cadena aleatoria, reportar error
        if (!hasVowels || !hasConsonants || !isReasonableLength || isAllSameChar || hasRepeatingPattern) {
          this.addError(`Token no reconocido en lenguaje desconocido: '${value}'`, value);
          this.advance(value.length);
          return null;
        }
        
        this.advance(value.length);
        return this.createToken('IDENTIFICADOR_POSIBLE', value, 'IDENTIFICADOR');
      }
      return null;
    }
    
    // Patrón más amplio para identificadores en lenguajes conocidos
    // Permitir identificadores que empiecen con letra, guion bajo, o @ (para SQL Server)
    let match = remaining.match(/^[a-zA-Z_@][a-zA-Z0-9_$@]*/);
    
    // Para PL/SQL, permitir identificadores con % (como %ROWTYPE, %TYPE)
    if (!match && (this.language.includes('sql') || this.language === 'pl/sql')) {
      match = remaining.match(/^[a-zA-Z_@][a-zA-Z0-9_$@]*(%[a-zA-Z]+)?/);
    }
    
    // Para C++, permitir espacios de nombres (::)
    if (!match && this.language === 'c++') {
      match = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*(::[a-zA-Z_][a-zA-Z0-9_]*)*/);
    }
    
    // Para HTML, permitir identificadores con guiones
    if (!match && this.language === 'html') {
      match = remaining.match(/^[a-zA-Z][a-zA-Z0-9\-_]*/);
    }
    
    if (match) {
      const value = match[0];
      this.advance(value.length);
      
      // Verificar si es palabra reservada
      const reservedWords = RESERVED_WORDS_EXTENDED[this.language as keyof typeof RESERVED_WORDS_EXTENDED] || [];
      
      // Verificación más flexible de palabras reservadas
      const isReserved = reservedWords.some(word => 
        word.toLowerCase() === value.toLowerCase() || 
        word === value
      );
      
      if (isReserved) {
        return this.createToken('PALABRA_RESERVADA', value, 'PALABRA_RESERVADA');
      } else {
        return this.createToken('IDENTIFICADOR', value, 'IDENTIFICADOR');
      }
    }
    
    return null;
  }

  private tryMatchPreprocessor(): LexicalToken | null {
    const remaining = this.code.slice(this.position);
    
    // Directivas de preprocesador para C++
    if (remaining.startsWith('#') && (this.language === 'c++' || this.language.includes('cpp'))) {
      // Buscar hasta el final de la línea o hasta encontrar un comentario
      const lineEnd = remaining.indexOf('\n');
      const commentStart = remaining.indexOf('//');
      
      let endPos = lineEnd === -1 ? remaining.length : lineEnd;
      if (commentStart !== -1 && commentStart < endPos) {
        endPos = commentStart;
      }
      
      const value = remaining.slice(0, endPos).trim();
      if (value) {
        this.advance(value.length);
        return this.createToken('DIRECTIVA_PREPROCESADOR', value, 'SIMBOLO');
      }
    }
    
    return null;
  }

  private getOperatorType(op: string): string {
    const arithmeticOps = ['+', '-', '*', '/', '%', '++', '--', '**', '//', '+=', '-=', '*=', '/=', '%=', '**=', '//='];
    const comparisonOps = ['==', '!=', '<', '>', '<=', '>=', '===', '!==', '<>', 'is', 'is not', 'in', 'not in'];
    const logicalOps = ['&&', '||', '!', 'and', 'or', 'not', '??'];
    const assignmentOps = ['=', '+=', '-=', '*=', '/=', '%=', ':=', '=>'];
    const bitwiseOps = ['&', '|', '^', '~', '<<', '>>', '&=', '|=', '^=', '<<=', '>>='];
    const memberAccessOps = ['.', '->', '::', '?.'];
    const specialOps = ['...', '||', '@'];
    
    if (arithmeticOps.includes(op)) return 'OPERADOR_ARITMETICO';
    if (comparisonOps.includes(op)) return 'OPERADOR_COMPARACION';
    if (logicalOps.includes(op)) return 'OPERADOR_LOGICO';
    if (assignmentOps.includes(op)) return 'OPERADOR_ASIGNACION';
    if (bitwiseOps.includes(op)) return 'OPERADOR_BITWISE';
    if (memberAccessOps.includes(op)) return 'OPERADOR_ACCESO';
    if (specialOps.includes(op)) return 'OPERADOR_ESPECIAL';
    
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

  private isValidSingleChar(char: string): boolean {
    // Caracteres que pueden ser tokens válidos por sí solos
    return /[{}()\[\];,.:!@#$%^&*+=|\\/<>?~`-]/.test(char);
  }

  private isIgnorableChar(char: string): boolean {
    // Caracteres que podemos ignorar sin reportar error
    return /[\r\n\t\f\v\u00a0\u2028\u2029]/.test(char);
  }
}