// Analizador de compilador completo para múltiples lenguajes
// Implementa análisis léxico, sintáctico y semántico

export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
  position: number;
}

export interface CompilerError {
  type: 'lexico' | 'sintactico' | 'semantico';
  message: string;
  line: number;
  column: number;
  position: number;
  severity: 'error' | 'warning' | 'info';
}

export interface CompilerAnalysisResult {
  language: string;
  tokens: Token[];
  errors: CompilerError[];
  symbolTable: SymbolTableEntry[];
  canExecute: boolean;
  executionResult?: string;
}

export interface SymbolTableEntry {
  name: string;
  type: 'variable' | 'function' | 'class' | 'constant' | 'keyword';
  dataType?: string;
  scope: string;
  line: number;
  value?: any;
}

// Palabras reservadas por lenguaje
const RESERVED_WORDS = {
  javascript: [
    'var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 
    'do', 'switch', 'case', 'default', 'break', 'continue', 'return',
    'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
    'class', 'extends', 'import', 'export', 'from', 'as', 'default'
  ],
  python: [
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del',
    'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
    'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or',
    'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
  ],
  'C++': [
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default',
    'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto',
    'if', 'inline', 'int', 'long', 'register', 'restrict', 'return',
    'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
    'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
    'class', 'namespace', 'using', 'public', 'private', 'protected'
  ],
  html: [
    'html', 'head', 'title', 'body', 'div', 'span', 'p', 'a', 'img',
    'table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'form', 'input',
    'button', 'script', 'style', 'link', 'meta'
  ],
  pascal: [
    'program', 'var', 'const', 'type', 'procedure', 'function', 'begin',
    'end', 'if', 'then', 'else', 'while', 'do', 'for', 'to', 'downto',
    'repeat', 'until', 'case', 'of', 'array', 'record', 'string'
  ],
  'PL/SQL': [
    'select', 'from', 'where', 'insert', 'update', 'delete', 'create',
    'table', 'alter', 'drop', 'declare', 'begin', 'end', 'if', 'then',
    'else', 'elsif', 'while', 'loop', 'for', 'cursor', 'procedure',
    'function', 'package', 'trigger'
  ],
  'T-SQL': [
    'select', 'from', 'where', 'insert', 'update', 'delete', 'create',
    'table', 'alter', 'drop', 'declare', 'begin', 'end', 'if', 'else',
    'while', 'break', 'continue', 'goto', 'return', 'procedure',
    'function', 'trigger', 'view', 'index'
  ]
};

// Patrones de expresiones regulares para tokens
const TOKEN_PATTERNS = {
  // Números enteros y decimales
  NUMBER: /^\d+(\.\d+)?$/,
  
  // Identificadores (variables, funciones)
  IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  
  // Cadenas de texto
  STRING: /^["'].*["']$/,
  
  // Operadores matemáticos
  MATH_OPERATOR: /^[+\-*/%=]$/,
  
  // Operadores lógicos
  LOGICAL_OPERATOR: /^(&&|\|\||!|==|!=|<=|>=|<|>)$/,
  
  // Delimitadores
  DELIMITER: /^[{}()\[\];,.]$/,
  
  // Comentarios
  COMMENT: /^(\/\/.*|\/\*[\s\S]*?\*\/)$/,
};

export class CompilerAnalyzer {
  private language: string;
  private code: string;
  private tokens: Token[] = [];
  private errors: CompilerError[] = [];
  private symbolTable: SymbolTableEntry[] = [];
  private currentLine = 1;
  private currentColumn = 1;
  private currentPosition = 0;

  constructor(code: string, language: string) {
    this.code = code;
    this.language = language.toLowerCase();
  }

  public analyze(): CompilerAnalysisResult {
    this.resetAnalysis();
    
    // 1. Análisis Léxico
    this.lexicalAnalysis();
    
    // 2. Análisis Sintáctico
    this.syntacticAnalysis();
    
    // 3. Análisis Semántico
    this.semanticAnalysis();
    
    // 4. Determinar si se puede ejecutar
    const canExecute = this.errors.filter(e => e.severity === 'error').length === 0;
    
    // 5. Simular ejecución si no hay errores
    let executionResult;
    if (canExecute) {
      executionResult = this.simulateExecution();
    }

    return {
      language: this.language,
      tokens: this.tokens,
      errors: this.errors,
      symbolTable: this.symbolTable,
      canExecute,
      executionResult
    };
  }

  private resetAnalysis(): void {
    this.tokens = [];
    this.errors = [];
    this.symbolTable = [];
    this.currentLine = 1;
    this.currentColumn = 1;
    this.currentPosition = 0;
  }

  private lexicalAnalysis(): void {
    const lines = this.code.split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      this.currentLine = lineIndex + 1;
      this.currentColumn = 1;
      
      // Tokenizar línea por línea
      this.tokenizeLine(line);
    }
  }

  private tokenizeLine(line: string): void {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Dividir en tokens básicos (simplificado)
    const words = line.split(/(\s+|[{}()\[\];,.]|[+\-*/%=]|[<>!=]=?|&&|\|\||["'].*?["'])/);
    
    for (const word of words) {
      if (word.trim()) {
        this.classifyToken(word.trim());
      }
      this.currentColumn += word.length;
    }
  }

  private classifyToken(token: string): void {
    const reservedWords = RESERVED_WORDS[this.language as keyof typeof RESERVED_WORDS] || [];
    
    let tokenType: string;
    
    if (reservedWords.includes(token.toLowerCase())) {
      tokenType = 'PALABRA_RESERVADA';
      this.addToSymbolTable(token, 'keyword');
    } else if (TOKEN_PATTERNS.NUMBER.test(token)) {
      tokenType = 'NUMERO';
      this.addToSymbolTable(token, 'constant');
    } else if (TOKEN_PATTERNS.STRING.test(token)) {
      tokenType = 'CADENA';
      this.addToSymbolTable(token, 'constant');
    } else if (TOKEN_PATTERNS.IDENTIFIER.test(token)) {
      tokenType = 'IDENTIFICADOR';
      this.addToSymbolTable(token, 'variable');
    } else if (TOKEN_PATTERNS.MATH_OPERATOR.test(token)) {
      tokenType = 'OPERADOR_MATEMATICO';
    } else if (TOKEN_PATTERNS.LOGICAL_OPERATOR.test(token)) {
      tokenType = 'OPERADOR_LOGICO';
    } else if (TOKEN_PATTERNS.DELIMITER.test(token)) {
      tokenType = 'DELIMITADOR';
    } else if (TOKEN_PATTERNS.COMMENT.test(token)) {
      tokenType = 'COMENTARIO';
    } else {
      tokenType = 'DESCONOCIDO';
      this.addError('lexico', `Token no reconocido: ${token}`, 'error');
    }

    this.tokens.push({
      type: tokenType,
      value: token,
      line: this.currentLine,
      column: this.currentColumn,
      position: this.currentPosition
    });

    this.currentPosition += token.length;
  }

  private syntacticAnalysis(): void {
    // Análisis sintáctico simplificado
    // Verificar estructura básica según el lenguaje
    
    switch (this.language) {
      case 'javascript':
        this.analyzeJavaScriptSyntax();
        break;
      case 'python':
        this.analyzePythonSyntax();
        break;
      case 'c++':
        this.analyzeCppSyntax();
        break;
      case 'html':
        this.analyzeHtmlSyntax();
        break;
      case 'pl/sql':
      case 't-sql':
        this.analyzeSqlSyntax();
        break;
      case 'pascal':
        this.analyzePascalSyntax();
        break;
    }
  }

  private analyzeJavaScriptSyntax(): void {
    // Verificar balanceado de paréntesis, llaves, corchetes
    this.checkBalancedSymbols();
    
    // Verificar declaraciones de funciones
    this.checkFunctionDeclarations();
    
    // Verificar uso de punto y coma
    this.checkSemicolons();
  }

  private analyzePythonSyntax(): void {
    // Verificar indentación
    this.checkPythonIndentation();
    
    // Verificar dos puntos en estructuras de control
    this.checkColonUsage();
  }

  private analyzeCppSyntax(): void {
    // Verificar includes
    this.checkIncludes();
    
    // Verificar función main
    this.checkMainFunction();
    
    // Verificar balanceado de símbolos
    this.checkBalancedSymbols();
  }

  private analyzeHtmlSyntax(): void {
    // Verificar etiquetas balanceadas
    this.checkHtmlTags();
  }

  private analyzeSqlSyntax(): void {
    // Verificar comandos SQL válidos
    this.checkSqlCommands();
  }

  private analyzePascalSyntax(): void {
    // Verificar begin/end
    this.checkBeginEnd();
  }

  private semanticAnalysis(): void {
    // Análisis semántico: verificar tipos, alcance de variables, etc.
    this.checkVariableDeclarations();
    this.checkFunctionCalls();
    this.checkTypeCompatibility();
  }

  private simulateExecution(): string {
    // Simular la ejecución del código según el lenguaje
    const lines = this.code.split('\n');
    let output = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Simular CREATE TABLE para SQL
      if (trimmedLine.toLowerCase().startsWith('create table')) {
        const tableMatch = trimmedLine.match(/create\s+table\s+(\w+)/i);
        if (tableMatch) {
          output += `✅ Tabla '${tableMatch[1]}' creada exitosamente\n`;
        }
      }
      
      // Simular console.log para JavaScript
      if (trimmedLine.includes('console.log')) {
        output += `📄 Salida de consola detectada\n`;
      }
      
      // Simular print para Python
      if (trimmedLine.startsWith('print(')) {
        output += `🐍 Función print ejecutada\n`;
      }
    }

    return output || '✅ Código analizado y listo para ejecución';
  }

  // Métodos auxiliares para análisis específicos
  private checkBalancedSymbols(): void {
    const opens = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    
    for (const token of this.tokens) {
      if (Object.keys(opens).includes(token.value)) {
        stack.push(token.value);
      } else if (Object.values(opens).includes(token.value)) {
        const last = stack.pop();
        if (!last || opens[last as keyof typeof opens] !== token.value) {
          this.addError('sintactico', `Símbolo no balanceado: ${token.value}`, 'error', token.line);
        }
      }
    }
    
    if (stack.length > 0) {
      this.addError('sintactico', 'Símbolos sin cerrar detectados', 'error');
    }
  }

  private checkFunctionDeclarations(): void {
    // Implementar verificación de declaraciones de funciones
    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i].value === 'function') {
        // Verificar que sigue un identificador
        if (i + 1 >= this.tokens.length || this.tokens[i + 1].type !== 'IDENTIFICADOR') {
          this.addError('sintactico', 'Se esperaba nombre de función después de "function"', 'error', this.tokens[i].line);
        }
      }
    }
  }

  private checkSemicolons(): void {
    // Verificar uso correcto de punto y coma en JavaScript
    const lines = this.code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && !line.startsWith('//')) {
        this.addError('sintactico', 'Falta punto y coma al final de la declaración', 'warning', i + 1);
      }
    }
  }

  private checkPythonIndentation(): void {
    // Verificar indentación en Python
    const lines = this.code.split('\n');
    let expectedIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        const currentIndent = line.length - line.trimStart().length;
        if (line.trim().endsWith(':')) {
          expectedIndent += 4;
        } else if (currentIndent !== expectedIndent && currentIndent !== 0) {
          this.addError('sintactico', 'Indentación incorrecta', 'error', i + 1);
        }
      }
    }
  }

  private checkColonUsage(): void {
    // Verificar uso de dos puntos en estructuras de control de Python
    const controlKeywords = ['if', 'else', 'elif', 'for', 'while', 'def', 'class', 'try', 'except', 'finally'];
    
    for (let i = 0; i < this.tokens.length; i++) {
      if (controlKeywords.includes(this.tokens[i].value)) {
        // Buscar el final de la línea para verificar los dos puntos
        let foundColon = false;
        for (let j = i; j < this.tokens.length && this.tokens[j].line === this.tokens[i].line; j++) {
          if (this.tokens[j].value === ':') {
            foundColon = true;
            break;
          }
        }
        if (!foundColon) {
          this.addError('sintactico', `Faltan dos puntos después de "${this.tokens[i].value}"`, 'error', this.tokens[i].line);
        }
      }
    }
  }

  private checkIncludes(): void {
    // Verificar includes en C++
    const hasInclude = this.code.includes('#include');
    if (!hasInclude) {
      this.addError('sintactico', 'Falta directiva #include', 'warning', 1);
    }
  }

  private checkMainFunction(): void {
    // Verificar función main en C++
    const hasMain = this.code.includes('int main');
    if (!hasMain) {
      this.addError('sintactico', 'Falta función main', 'error', 1);
    }
  }

  private checkHtmlTags(): void {
    // Verificar etiquetas HTML balanceadas (simplificado)
    const openTags: string[] = [];
    const selfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    
    const tagRegex = /<\/?(\w+)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(this.code)) !== null) {
      const tagName = match[1].toLowerCase();
      const isClosing = match[0].startsWith('</');
      
      if (isClosing) {
        const lastOpen = openTags.pop();
        if (lastOpen !== tagName) {
          this.addError('sintactico', `Etiqueta no balanceada: </${tagName}>`, 'error');
        }
      } else if (!selfClosing.includes(tagName)) {
        openTags.push(tagName);
      }
    }
    
    if (openTags.length > 0) {
      this.addError('sintactico', `Etiquetas sin cerrar: ${openTags.join(', ')}`, 'error');
    }
  }

  private checkSqlCommands(): void {
    // Verificar comandos SQL válidos
    const validCommands = ['select', 'insert', 'update', 'delete', 'create', 'alter', 'drop'];
    const firstWord = this.code.trim().split(/\s+/)[0]?.toLowerCase();
    
    if (firstWord && !validCommands.includes(firstWord)) {
      this.addError('sintactico', `Comando SQL no reconocido: ${firstWord}`, 'error', 1);
    }
  }

  private checkBeginEnd(): void {
    // Verificar begin/end en Pascal
    const beginCount = (this.code.match(/\bbegin\b/gi) || []).length;
    const endCount = (this.code.match(/\bend\b/gi) || []).length;
    
    if (beginCount !== endCount) {
      this.addError('sintactico', 'Número desbalanceado de BEGIN/END', 'error');
    }
  }

  private checkVariableDeclarations(): void {
    // Verificar que las variables estén declaradas antes de usarse
    const declaredVars = new Set<string>();
    const usedVars = new Set<string>();
    
    for (const entry of this.symbolTable) {
      if (entry.type === 'variable') {
        // Verificar si la variable se declara con una palabra reservada de declaración
        const prevToken = this.tokens.find(t => 
          t.line === entry.line && 
          ['var', 'let', 'const', 'int', 'float', 'double', 'string'].includes(t.value)
        );
        
        if (prevToken) {
          declaredVars.add(entry.name);
        } else {
          usedVars.add(entry.name);
        }
      }
    }
    
    // Reportar variables usadas pero no declaradas
    for (const varName of usedVars) {
      if (!declaredVars.has(varName)) {
        this.addError('semantico', `Variable '${varName}' usada sin declarar`, 'error');
      }
    }
  }

  private checkFunctionCalls(): void {
    // Verificar que las funciones llamadas estén definidas
    const definedFunctions = new Set<string>();
    const calledFunctions = new Set<string>();
    
    for (const entry of this.symbolTable) {
      if (entry.type === 'function') {
        definedFunctions.add(entry.name);
      }
    }
    
    // Buscar llamadas a funciones (simplificado)
    for (let i = 0; i < this.tokens.length - 1; i++) {
      if (this.tokens[i].type === 'IDENTIFICADOR' && this.tokens[i + 1].value === '(') {
        calledFunctions.add(this.tokens[i].value);
      }
    }
    
    // Reportar funciones llamadas pero no definidas
    for (const funcName of calledFunctions) {
      if (!definedFunctions.has(funcName) && !this.isBuiltInFunction(funcName)) {
        this.addError('semantico', `Función '${funcName}' no está definida`, 'error');
      }
    }
  }

  private checkTypeCompatibility(): void {
    // Verificar compatibilidad de tipos (análisis básico)
    // Este es un análisis muy simplificado
    for (let i = 0; i < this.tokens.length - 2; i++) {
      if (this.tokens[i].type === 'IDENTIFICADOR' && 
          this.tokens[i + 1].value === '=' && 
          this.tokens[i + 2].type === 'CADENA') {
        // Variable = String assignment detected
        this.updateSymbolTableType(this.tokens[i].value, 'string');
      } else if (this.tokens[i].type === 'IDENTIFICADOR' && 
                 this.tokens[i + 1].value === '=' && 
                 this.tokens[i + 2].type === 'NUMERO') {
        // Variable = Number assignment detected
        this.updateSymbolTableType(this.tokens[i].value, 'number');
      }
    }
  }

  private isBuiltInFunction(funcName: string): boolean {
    const builtIns = {
      javascript: ['console.log', 'alert', 'prompt', 'parseInt', 'parseFloat'],
      python: ['print', 'input', 'len', 'range', 'str', 'int', 'float'],
      'c++': ['printf', 'scanf', 'cout', 'cin', 'strlen'],
    };
    
    const languageBuiltIns = builtIns[this.language as keyof typeof builtIns] || [];
    return languageBuiltIns.some(builtin => builtin.includes(funcName));
  }

  private updateSymbolTableType(varName: string, dataType: string): void {
    const entry = this.symbolTable.find(e => e.name === varName);
    if (entry) {
      entry.dataType = dataType;
    }
  }

  private addToSymbolTable(name: string, type: SymbolTableEntry['type']): void {
    // Evitar duplicados en la misma línea
    const exists = this.symbolTable.some(entry => 
      entry.name === name && entry.line === this.currentLine
    );
    
    if (!exists) {
      this.symbolTable.push({
        name,
        type,
        scope: 'global', // Simplificado
        line: this.currentLine
      });
    }
  }

  private addError(type: CompilerError['type'], message: string, severity: CompilerError['severity'], line?: number): void {
    this.errors.push({
      type,
      message,
      line: line || this.currentLine,
      column: this.currentColumn,
      position: this.currentPosition,
      severity
    });
  }
}

// Función principal para analizar código
export function analyzeCode(code: string, language: string): CompilerAnalysisResult {
  const analyzer = new CompilerAnalyzer(code, language);
  return analyzer.analyze();
} 