// Analizador Sintáctico Avanzado para Compiladores
// Implementa análisis sintáctico con gramáticas específicas por lenguaje

import { LexicalToken } from './lexical-analyzer';

export interface SyntaxError {
  type: 'sintactico';
  message: string;
  line: number;
  column: number;
  position: number;
  severity: 'error' | 'warning' | 'info';
  expected?: string;
  found?: string;
}

export interface SyntaxRule {
  name: string;
  pattern: string[];
  action?: (tokens: LexicalToken[]) => boolean;
}

export interface ParseNode {
  type: string;
  value?: string;
  children: ParseNode[];
  line: number;
  column: number;
}

// Gramáticas específicas por lenguaje
export const SYNTAX_RULES = {
  javascript: {
    // Declaraciones de variables
    variableDeclaration: [
      ['PALABRA_RESERVADA:var', 'IDENTIFICADOR', 'OPERADOR_ASIGNACION', 'expression', 'PUNTO_COMA'],
      ['PALABRA_RESERVADA:let', 'IDENTIFICADOR', 'OPERADOR_ASIGNACION', 'expression', 'PUNTO_COMA'],
      ['PALABRA_RESERVADA:const', 'IDENTIFICADOR', 'OPERADOR_ASIGNACION', 'expression', 'PUNTO_COMA'],
      ['PALABRA_RESERVADA:var', 'IDENTIFICADOR', 'PUNTO_COMA'],
      ['PALABRA_RESERVADA:let', 'IDENTIFICADOR', 'PUNTO_COMA']
    ],
    // Declaraciones de funciones
    functionDeclaration: [
      ['PALABRA_RESERVADA:function', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'parameterList?', 'PARENTESIS_CERRADO', 'LLAVE_ABIERTA', 'statements', 'LLAVE_CERRADA'],
      ['PALABRA_RESERVADA:async', 'PALABRA_RESERVADA:function', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'parameterList?', 'PARENTESIS_CERRADO', 'LLAVE_ABIERTA', 'statements', 'LLAVE_CERRADA']
    ],
    // Estructuras de control
    ifStatement: [
      ['PALABRA_RESERVADA:if', 'PARENTESIS_ABIERTO', 'expression', 'PARENTESIS_CERRADO', 'statement'],
      ['PALABRA_RESERVADA:if', 'PARENTESIS_ABIERTO', 'expression', 'PARENTESIS_CERRADO', 'statement', 'PALABRA_RESERVADA:else', 'statement']
    ],
    forStatement: [
      ['PALABRA_RESERVADA:for', 'PARENTESIS_ABIERTO', 'forInit', 'PUNTO_COMA', 'expression?', 'PUNTO_COMA', 'expression?', 'PARENTESIS_CERRADO', 'statement']
    ],
    whileStatement: [
      ['PALABRA_RESERVADA:while', 'PARENTESIS_ABIERTO', 'expression', 'PARENTESIS_CERRADO', 'statement']
    ]
  },
  python: {
    // Declaración de funciones
    functionDefinition: [
      ['PALABRA_RESERVADA:def', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'parameterList?', 'PARENTESIS_CERRADO', 'DOS_PUNTOS', 'NUEVA_LINEA', 'INDENTACION', 'statements', 'DEDENTACION']
    ],
    // Estructuras de control
    ifStatement: [
      ['PALABRA_RESERVADA:if', 'expression', 'DOS_PUNTOS', 'NUEVA_LINEA', 'INDENTACION', 'statements', 'DEDENTACION'],
      ['PALABRA_RESERVADA:if', 'expression', 'DOS_PUNTOS', 'NUEVA_LINEA', 'INDENTACION', 'statements', 'DEDENTACION', 'PALABRA_RESERVADA:else', 'DOS_PUNTOS', 'NUEVA_LINEA', 'INDENTACION', 'statements', 'DEDENTACION']
    ],
    // Expresiones de retorno
    returnStatement: [
      ['PALABRA_RESERVADA:return', 'expression'],
      ['PALABRA_RESERVADA:return']
    ],
    // Expresiones de impresión
    printStatement: [
      ['PALABRA_RESERVADA:print', 'PARENTESIS_ABIERTO', 'expression', 'PARENTESIS_CERRADO']
    ],
    // Expresiones numéricas y operadores
    expression: [
      ['term'],
      ['expression', 'OPERADOR_ARITMETICO', 'term'],
      ['expression', 'OPERADOR_COMPARACION', 'term']
    ],
    term: [
      ['factor'],
      ['term', 'OPERADOR_MULTIPLICATIVO', 'factor']
    ],
    factor: [
      ['NUMERO'],
      ['IDENTIFICADOR'],
      ['PARENTESIS_ABIERTO', 'expression', 'PARENTESIS_CERRADO'],
      ['IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'argumentList?', 'PARENTESIS_CERRADO']
    ],
    // Llamadas a funciones
    functionCall: [
      ['IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'argumentList?', 'PARENTESIS_CERRADO']
    ],
    argumentList: [
      ['expression'],
      ['argumentList', 'COMA', 'expression']
    ]
  },
  'c++': {
    // Directivas de preprocesador
    preprocessorDirective: [
      ['DIRECTIVA_PREPROCESADOR']
    ],
    // Declaraciones de variables
    variableDeclaration: [
      ['dataType', 'IDENTIFICADOR', 'PUNTO_COMA'],
      ['dataType', 'IDENTIFICADOR', 'OPERADOR_ASIGNACION', 'expression', 'PUNTO_COMA']
    ],
    // Declaraciones de funciones
    functionDeclaration: [
      ['dataType', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'parameterList?', 'PARENTESIS_CERRADO', 'LLAVE_ABIERTA', 'statements', 'LLAVE_CERRADA']
    ],
    // Función main
    mainFunction: [
      ['PALABRA_RESERVADA:int', 'PALABRA_RESERVADA:main', 'PARENTESIS_ABIERTO', 'PARENTESIS_CERRADO', 'LLAVE_ABIERTA', 'statements', 'LLAVE_CERRADA']
    ]
  },
  html: {
    // Etiquetas HTML
    htmlElement: [
      ['<', 'IDENTIFICADOR', 'attributes?', '>', 'content?', '</', 'IDENTIFICADOR', '>'],
      ['<', 'IDENTIFICADOR', 'attributes?', '/>']
    ],
    attribute: [
      ['IDENTIFICADOR', '=', 'CADENA_DOBLE'],
      ['IDENTIFICADOR', '=', 'CADENA_SIMPLE']
    ]
  },
  pascal: {
    // Programa Pascal
    program: [
      ['PALABRA_RESERVADA:program', 'IDENTIFICADOR', 'PUNTO_COMA', 'declarations?', 'PALABRA_RESERVADA:begin', 'statements', 'PALABRA_RESERVADA:end', 'PUNTO']
    ],
    // Declaraciones de variables
    variableDeclaration: [
      ['PALABRA_RESERVADA:var', 'IDENTIFICADOR', 'DOS_PUNTOS', 'dataType', 'PUNTO_COMA']
    ],
    // Declaraciones de procedimientos
    procedureDeclaration: [
      ['PALABRA_RESERVADA:procedure', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'parameterList?', 'PARENTESIS_CERRADO', 'PUNTO_COMA', 'declarations?', 'PALABRA_RESERVADA:begin', 'statements', 'PALABRA_RESERVADA:end', 'PUNTO_COMA']
    ]
  },
  'pl/sql': {
    // Bloque PL/SQL
    plsqlBlock: [
      ['PALABRA_RESERVADA:declare', 'declarations', 'PALABRA_RESERVADA:begin', 'statements', 'PALABRA_RESERVADA:end', 'PUNTO_COMA'],
      ['PALABRA_RESERVADA:begin', 'statements', 'PALABRA_RESERVADA:end', 'PUNTO_COMA']
    ],
    // Comandos SQL
    selectStatement: [
      ['PALABRA_RESERVADA:select', 'columnList', 'PALABRA_RESERVADA:from', 'IDENTIFICADOR', 'whereClause?', 'PUNTO_COMA']
    ],
    createTableStatement: [
      ['PALABRA_RESERVADA:create', 'PALABRA_RESERVADA:table', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'columnDefinitions', 'PARENTESIS_CERRADO', 'PUNTO_COMA']
    ]
  },
  't-sql': {
    // Declaraciones
    declareStatement: [
      ['PALABRA_RESERVADA:declare', 'IDENTIFICADOR', 'dataType', 'PUNTO_COMA']
    ],
    // Comandos SQL
    selectStatement: [
      ['PALABRA_RESERVADA:select', 'columnList', 'PALABRA_RESERVADA:from', 'IDENTIFICADOR', 'whereClause?']
    ],
    createTableStatement: [
      ['PALABRA_RESERVADA:create', 'PALABRA_RESERVADA:table', 'IDENTIFICADOR', 'PARENTESIS_ABIERTO', 'columnDefinitions', 'PARENTESIS_CERRADO']
    ]
  }
};

export class SyntaxAnalyzer {
  private tokens: LexicalToken[];
  private language: string;
  private position: number = 0;
  private errors: SyntaxError[] = [];
  private parseTree: ParseNode[] = [];

  constructor(tokens: LexicalToken[], language: string) {
    // Filtrar solo comentarios y tokens verdaderamente vacíos
    // Mantener los caracteres especiales que pueden ser sintácticamente relevantes
    this.tokens = tokens.filter(token => {
      // Mantener todo excepto comentarios y strings completamente vacíos
      if (token.category === 'COMENTARIO') return false;
      if (token.value.trim() === '' && token.type !== 'NUEVA_LINEA') return false;
      return true;
    });
    this.language = language.toLowerCase();
  }

  public analyze(): { errors: SyntaxError[], parseTree: ParseNode[] } {
    this.reset();
    
    // Si no hay tokens válidos, retornar resultado básico pero sin errores
    if (this.tokens.length === 0) {
      return {
        errors: [],
        parseTree: []
      };
    }
    
    try {
      this.parseProgram();
    } catch (error) {
      // Manejar errores de parsing de manera más suave
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Solo reportar errores realmente críticos como errores
      // Otros como advertencias
      if (errorMessage.includes('infinito') || errorMessage.includes('crítico')) {
        this.addError(`Error de análisis sintáctico: ${errorMessage}`, 'error');
      } else {
        this.addError(`Advertencia de análisis sintáctico: ${errorMessage}`, 'warning');
      }
      
      // Intentar recuperación de errores
      this.attemptErrorRecovery();
    }
    
    // Solo realizar verificaciones post-análisis si hay pocos errores críticos
    const criticalErrors = this.errors.filter(e => e.severity === 'error').length;
    if (criticalErrors <= 1) {
      try {
        this.performPostAnalysisChecks();
      } catch (error) {
        // Si las verificaciones post-análisis fallan, solo agregar una advertencia
        this.addError('Algunas verificaciones adicionales no se pudieron completar', 'warning');
      }
    }
    
    // Filtrar errores menos importantes para códigos simples
    if (this.tokens.length < 10) {
      this.errors = this.errors.filter(error => 
        error.severity === 'error' || 
        !error.message.includes('balance') &&
        !error.message.includes('estructura') &&
        !error.message.includes('indentación')
      );
    }
    
    return {
      errors: this.errors,
      parseTree: this.parseTree
    };
  }

  private reset(): void {
    this.position = 0;
    this.errors = [];
    this.parseTree = [];
  }

  private parseProgram(): void {
    switch (this.language) {
      case 'javascript':
        this.parseJavaScriptProgram();
        break;
      case 'python':
        this.parsePythonProgram();
        break;
      case 'c++':
        this.parseCppProgram();
        break;
      case 'html':
        this.parseHtmlDocument();
        break;
      case 'pascal':
        this.parsePascalProgram();
        break;
      case 'pl/sql':
      case 't-sql':
        this.parseSqlProgram();
        break;
      default:
        this.parseGenericProgram();
    }
  }

  private parseJavaScriptProgram(): void {
    let iterations = 0;
    const maxIterations = this.tokens.length * 2; // Safety limit
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const previousPosition = this.position;
      const statement = this.parseJavaScriptStatement();
      
      if (statement) {
        this.parseTree.push(statement);
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.position++; // Force advancement to prevent infinite loop
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis sintáctico detenido por seguridad (posible bucle infinito)', 'warning');
    }
  }

  private parseJavaScriptStatement(): ParseNode | null {
    const currentToken = this.getCurrentToken();
    if (!currentToken) return null;

    switch (currentToken.value) {
      case 'var':
      case 'let':
      case 'const':
        return this.parseVariableDeclaration();
      case 'function':
        return this.parseFunctionDeclaration();
      case 'if':
        return this.parseIfStatement();
      case 'for':
        return this.parseForStatement();
      case 'while':
        return this.parseWhileStatement();
      case 'return':
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parsePythonProgram(): void {
    // Verificar indentación correcta
    this.checkPythonIndentation();
    
    let iterations = 0;
    const maxIterations = this.tokens.length * 2; // Safety limit
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const previousPosition = this.position;
      const statement = this.parsePythonStatement();
      
      if (statement) {
        this.parseTree.push(statement);
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.position++; // Force advancement to prevent infinite loop
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis sintáctico detenido por seguridad (posible bucle infinito)', 'warning');
    }
  }

  private parsePythonStatement(): ParseNode | null {
    const currentToken = this.getCurrentToken();
    if (!currentToken) return null;

    switch (currentToken.value) {
      case 'def':
        return this.parseFunctionDefinition();
      case 'class':
        return this.parseClassDefinition();
      case 'if':
        return this.parseIfStatement();
      case 'for':
        return this.parseForStatement();
      case 'while':
        return this.parseWhileStatement();
      case 'import':
      case 'from':
        return this.parseImportStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseCppProgram(): void {
    // Verificar directivas de preprocesador
    this.checkCppIncludes();
    
    let iterations = 0;
    const maxIterations = this.tokens.length * 2; // Safety limit
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const previousPosition = this.position;
      const statement = this.parseCppStatement();
      
      if (statement) {
        this.parseTree.push(statement);
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.position++; // Force advancement to prevent infinite loop
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis sintáctico detenido por seguridad (posible bucle infinito)', 'warning');
    }
    
    // Verificar que existe función main
    this.checkMainFunction();
  }

  private parseCppStatement(): ParseNode | null {
    const currentToken = this.getCurrentToken();
    if (!currentToken) return null;

    if (currentToken.category === 'SIMBOLO' && currentToken.value.startsWith('#')) {
      return this.parsePreprocessorDirective();
    }

    if (this.isCppDataType(currentToken.value)) {
      return this.parseVariableOrFunctionDeclaration();
    }

    switch (currentToken.value) {
      case 'if':
        return this.parseIfStatement();
      case 'for':
        return this.parseForStatement();
      case 'while':
        return this.parseWhileStatement();
      case 'return':
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseHtmlDocument(): void {
    let iterations = 0;
    const maxIterations = this.tokens.length * 2; // Safety limit
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const previousPosition = this.position;
      const element = this.parseHtmlElement();
      
      if (element) {
        this.parseTree.push(element);
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.position++; // Force advancement to prevent infinite loop
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis HTML detenido por seguridad (posible bucle infinito)', 'warning');
    }
    
    // Verificar estructura básica de HTML
    this.checkHtmlStructure();
  }

  private parsePascalProgram(): void {
    // Verificar estructura de programa Pascal
    if (!this.expectToken('program')) {
      this.addError('Se esperaba palabra clave "program"', 'error');
      return;
    }
    
    if (!this.expectToken('IDENTIFICADOR')) {
      this.addError('Se esperaba nombre del programa', 'error');
      return;
    }
    
    if (!this.expectToken(';')) {
      this.addError('Se esperaba punto y coma después del nombre del programa', 'error');
    }
    
    // Continuar con el resto del programa
    let iterations = 0;
    const maxIterations = this.tokens.length * 2; // Safety limit
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const previousPosition = this.position;
      const statement = this.parsePascalStatement();
      
      if (statement) {
        this.parseTree.push(statement);
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.position++; // Force advancement to prevent infinite loop
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis Pascal detenido por seguridad (posible bucle infinito)', 'warning');
    }
    
    // Verificar BEGIN/END balanceados
    this.checkBeginEndBalance();
  }

  private parsePascalStatement(): ParseNode | null {
    const currentToken = this.getCurrentToken();
    if (!currentToken) return null;

    switch (currentToken.value.toLowerCase()) {
      case 'var':
        return this.parseVariableDeclaration();
      case 'procedure':
        return this.parseProcedureDeclaration();
      case 'function':
        return this.parseFunctionDeclaration();
      case 'begin':
        return this.parseBeginBlock();
      case 'if':
        return this.parseIfStatement();
      case 'while':
        return this.parseWhileStatement();
      case 'for':
        return this.parseForStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseSqlProgram(): void {
    let iterations = 0;
    const maxIterations = this.tokens.length * 2; // Safety limit
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const previousPosition = this.position;
      const statement = this.parseSqlStatement();
      
      if (statement) {
        this.parseTree.push(statement);
      }
      
      // Safety check: ensure position is advancing
      if (this.position === previousPosition) {
        this.position++; // Force advancement to prevent infinite loop
      }
      
      iterations++;
    }
    
    if (iterations >= maxIterations) {
      this.addError('Análisis SQL detenido por seguridad (posible bucle infinito)', 'warning');
    }
  }

  private parseSqlStatement(): ParseNode | null {
    const currentToken = this.getCurrentToken();
    if (!currentToken) return null;

    switch (currentToken.value.toLowerCase()) {
      case 'select':
        return this.parseSelectStatement();
      case 'insert':
        return this.parseInsertStatement();
      case 'update':
        return this.parseUpdateStatement();
      case 'delete':
        return this.parseDeleteStatement();
      case 'create':
        return this.parseCreateStatement();
      case 'alter':
        return this.parseAlterStatement();
      case 'drop':
        return this.parseDropStatement();
      case 'declare':
        return this.parseDeclareStatement();
      case 'begin':
        return this.parseBeginBlock();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseGenericProgram(): void {
    // Análisis sintáctico genérico
    this.checkBalancedSymbols();
    
    let iterations = 0;
    const maxIterations = this.tokens.length;
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      this.position++;
      iterations++;
    }
  }

  // Métodos auxiliares de parsing específicos

  private parseVariableDeclaration(): ParseNode | null {
    const node = this.createNode('VariableDeclaration');
    
    // Consumir palabra clave de declaración
    if (this.consumeToken(['var', 'let', 'const'])) {
      const prevToken = this.getPreviousToken();
      if (prevToken) {
        node.children.push(this.createLeafNode(prevToken));
      }
    }
    
    // Identificador
    if (this.expectToken('IDENTIFICADOR')) {
      const prevToken = this.getPreviousToken();
      if (prevToken) {
        node.children.push(this.createLeafNode(prevToken));
      }
    } else {
      this.addError('Se esperaba nombre de variable', 'error');
      return null;
    }
    
    // Opcional: inicialización
    if (this.consumeToken(['='])) {
      const prevToken = this.getPreviousToken();
      if (prevToken) {
        node.children.push(this.createLeafNode(prevToken));
      }
      const expression = this.parseExpression();
      if (expression) {
        node.children.push(expression);
      }
    }
    
    // Punto y coma (dependiendo del lenguaje)
    if (this.language === 'javascript' || this.language === 'c++') {
      if (!this.expectToken(';')) {
        this.addError('Se esperaba punto y coma', 'warning');
      }
    }
    
    return node;
  }

  private parseFunctionDeclaration(): ParseNode | null {
    const node = this.createNode('FunctionDeclaration');
    
    // Palabra clave 'function'
    if (this.consumeToken(['function'])) {
      const prevToken = this.getPreviousToken();
      if (prevToken) {
        node.children.push(this.createLeafNode(prevToken));
      }
    }
    
    // Nombre de función
    if (this.expectToken('IDENTIFICADOR')) {
      const prevToken = this.getPreviousToken();
      if (prevToken) {
        node.children.push(this.createLeafNode(prevToken));
      }
    } else {
      this.addError('Se esperaba nombre de función', 'error');
      return null;
    }
    
    // Parámetros
    if (this.expectToken('(')) {
      const params = this.parseParameterList();
      node.children.push(params);
      
      if (!this.expectToken(')')) {
        this.addError('Se esperaba paréntesis de cierre', 'error');
      }
    }
    
    // Cuerpo de función
    if (this.expectToken('{')) {
      const body = this.parseBlockStatement();
      node.children.push(body);
      
      if (!this.expectToken('}')) {
        this.addError('Se esperaba llave de cierre', 'error');
      }
    }
    
    return node;
  }

  private parseIfStatement(): ParseNode | null {
    const node = this.createNode('IfStatement');
    
    // Palabra clave 'if'
    if (this.consumeToken(['if'])) {
      const prevToken = this.getPreviousToken();
      if (prevToken) {
        node.children.push(this.createLeafNode(prevToken));
      }
    }
    
    // Condición
    if (this.language === 'python') {
      const condition = this.parseExpression();
      if (condition) node.children.push(condition);
      
      if (!this.expectToken(':')) {
        this.addError('Se esperaba dos puntos después de la condición if', 'error');
      }
    } else {
      if (this.expectToken('(')) {
        const condition = this.parseExpression();
        if (condition) node.children.push(condition);
        
        if (!this.expectToken(')')) {
          this.addError('Se esperaba paréntesis de cierre', 'error');
        }
      }
    }
    
    // Cuerpo del if
    const thenBody = this.parseStatement();
    if (thenBody) node.children.push(thenBody);
    
    // Opcional: else
    if (this.getCurrentToken()?.value === 'else') {
      this.consumeToken(['else']);
      if (this.language === 'python' && !this.expectToken(':')) {
        this.addError('Se esperaba dos puntos después de else', 'error');
      }
      const elseBody = this.parseStatement();
      if (elseBody) node.children.push(elseBody);
    }
    
    return node;
  }

  private parseExpression(): ParseNode | null {
    // Implementación simplificada de expresiones
    const node = this.createNode('Expression');
    
    let iterations = 0;
    const maxIterations = this.tokens.length;
    
    while (this.position < this.tokens.length && iterations < maxIterations) {
      const token = this.getCurrentToken();
      if (!token) break;
      
      // Terminar expresión en ciertos delimitadores
      if ([';', ')', '}', ',', ':'].includes(token.value)) {
        break;
      }
      
      node.children.push(this.createLeafNode(token));
      this.position++;
      iterations++;
    }
    
    return node.children.length > 0 ? node : null;
  }

  private parseStatement(): ParseNode | null {
    switch (this.language) {
      case 'javascript':
        return this.parseJavaScriptStatement();
      case 'python':
        return this.parsePythonStatement();
      case 'c++':
        return this.parseCppStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseExpressionStatement(): ParseNode | null {
    const expression = this.parseExpression();
    
    // Verificar punto y coma si es necesario
    if (this.language === 'javascript' || this.language === 'c++') {
      if (!this.expectToken(';')) {
        this.addError('Se esperaba punto y coma', 'warning');
      }
    }
    
    return expression;
  }

  // Métodos de verificación específicos

  private checkPythonIndentation(): void {
    let expectedIndent = false;
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.value === ':') {
        expectedIndent = true;
      } else if (expectedIndent && token.line > (this.tokens[i-1]?.line || 0)) {
        // Nueva línea después de ':'
        expectedIndent = false;
        // Aquí podríamos verificar indentación real
      }
    }
  }

  private checkCppIncludes(): void {
    const hasInclude = this.tokens.some(token => 
      token.value.startsWith('#include'));
    
    if (!hasInclude && this.tokens.length > 5) {
      this.addError('Programa C++ debería incluir al menos una directiva #include', 'warning');
    }
    
    // Verificar función main
    const hasMain = this.tokens.some(token => 
      token.value === 'main' && token.category === 'IDENTIFICADOR');
    
    if (!hasMain && this.tokens.length > 10) {
      this.addError('Programa C++ debería tener una función main', 'warning');
    }
  }

  private checkMainFunction(): void {
    const hasMain = this.tokens.some((token, index) => 
      token.value === 'main' && 
      index > 0 && 
      this.tokens[index - 1].value === 'int'
    );
    
    if (!hasMain) {
      this.addError('Falta función main en programa C++', 'error');
    }
  }

  private checkHtmlStructure(): void {
    const hasHtml = this.tokens.some(token => token.value.toLowerCase() === 'html');
    const hasHead = this.tokens.some(token => token.value.toLowerCase() === 'head');
    const hasBody = this.tokens.some(token => token.value.toLowerCase() === 'body');
    
    if (!hasHtml) {
      this.addError('Falta etiqueta <html> en documento', 'warning');
    }
    if (!hasHead) {
      this.addError('Falta etiqueta <head> en documento', 'warning');
    }
    if (!hasBody) {
      this.addError('Falta etiqueta <body> en documento', 'warning');
    }
  }

  private checkBeginEndBalance(): void {
    let beginCount = 0;
    let endCount = 0;
    
    for (const token of this.tokens) {
      if (token.value.toLowerCase() === 'begin') {
        beginCount++;
      } else if (token.value.toLowerCase() === 'end') {
        endCount++;
      }
    }
    
    if (beginCount !== endCount) {
      this.addError(`Desbalance de begin/end: ${beginCount} begin, ${endCount} end`, 'error');
    }
  }

  private checkBalancedSymbols(): void {
    const stack: { symbol: string, line: number, column: number }[] = [];
    const pairs: { [key: string]: string } = {
      '(': ')',
      '[': ']',
      '{': '}'
    };
    
    for (const token of this.tokens) {
      if (['(', '[', '{'].includes(token.value)) {
        stack.push({ symbol: token.value, line: token.line, column: token.column });
      } else if ([')', ']', '}'].includes(token.value)) {
        const last = stack.pop();
        if (!last || pairs[last.symbol] !== token.value) {
          this.addError(`Símbolo no balanceado: ${token.value}`, 'error', token.line);
        }
      }
    }
    
    for (const unclosed of stack) {
      this.addError(`Símbolo sin cerrar: ${unclosed.symbol}`, 'error', unclosed.line);
    }
  }

  // Métodos utilitarios

  private getCurrentToken(): LexicalToken | null {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }

  private getPreviousToken(): LexicalToken | null {
    return this.position > 0 ? this.tokens[this.position - 1] : null;
  }

  private consumeToken(expectedValues: string[]): boolean {
    const token = this.getCurrentToken();
    if (token && expectedValues.includes(token.value)) {
      this.position++;
      return true;
    }
    return false;
  }

  private expectToken(expected: string): boolean {
    const token = this.getCurrentToken();
    if (!token) {
      this.addError(`Se esperaba '${expected}' pero se encontró fin de archivo`, 'error');
      return false;
    }
    
    const matches = expected === 'IDENTIFICADOR' ? 
      token.category === 'IDENTIFICADOR' : 
      token.value === expected;
    
    if (matches) {
      this.position++;
      return true;
    } else {
      this.addError(`Se esperaba '${expected}' pero se encontró '${token.value}'`, 'error', token.line);
      return false;
    }
  }

  private isCppDataType(value: string): boolean {
    const cppTypes = ['int', 'float', 'double', 'char', 'bool', 'void', 'string'];
    return cppTypes.includes(value);
  }

  private createNode(type: string): ParseNode {
    const token = this.getCurrentToken();
    return {
      type,
      children: [],
      line: token?.line || 0,
      column: token?.column || 0
    };
  }

  private createLeafNode(token: LexicalToken): ParseNode {
    return {
      type: token.type,
      value: token.value,
      children: [],
      line: token.line,
      column: token.column
    };
  }

  private addError(message: string, severity: SyntaxError['severity'], line?: number): void {
    const currentToken = this.getCurrentToken();
    this.errors.push({
      type: 'sintactico',
      message,
      line: line || currentToken?.line || 0,
      column: currentToken?.column || 0,
      position: currentToken?.position || 0,
      severity
    });
  }

  // Métodos de parsing adicionales que faltan implementar

  private parseParameterList(): ParseNode {
    return this.createNode('ParameterList');
  }

  private parseBlockStatement(): ParseNode {
    return this.createNode('BlockStatement');
  }

  private parseReturnStatement(): ParseNode | null {
    return this.createNode('ReturnStatement');
  }

  private parseForStatement(): ParseNode | null {
    return this.createNode('ForStatement');
  }

  private parseWhileStatement(): ParseNode | null {
    return this.createNode('WhileStatement');
  }

  private parseFunctionDefinition(): ParseNode | null {
    return this.createNode('FunctionDefinition');
  }

  private parseClassDefinition(): ParseNode | null {
    return this.createNode('ClassDefinition');
  }

  private parseImportStatement(): ParseNode | null {
    return this.createNode('ImportStatement');
  }

  private parsePreprocessorDirective(): ParseNode | null {
    return this.createNode('PreprocessorDirective');
  }

  private parseVariableOrFunctionDeclaration(): ParseNode | null {
    return this.createNode('Declaration');
  }

  private parseHtmlElement(): ParseNode | null {
    return this.createNode('HtmlElement');
  }

  private parseProcedureDeclaration(): ParseNode | null {
    return this.createNode('ProcedureDeclaration');
  }

  private parseBeginBlock(): ParseNode | null {
    return this.createNode('BeginBlock');
  }

  private parseSelectStatement(): ParseNode | null {
    return this.createNode('SelectStatement');
  }

  private parseInsertStatement(): ParseNode | null {
    return this.createNode('InsertStatement');
  }

  private parseUpdateStatement(): ParseNode | null {
    return this.createNode('UpdateStatement');
  }

  private parseDeleteStatement(): ParseNode | null {
    return this.createNode('DeleteStatement');
  }

  private parseCreateStatement(): ParseNode | null {
    return this.createNode('CreateStatement');
  }

  private parseAlterStatement(): ParseNode | null {
    return this.createNode('AlterStatement');
  }

  private parseDropStatement(): ParseNode | null {
    return this.createNode('DropStatement');
  }

  private parseDeclareStatement(): ParseNode | null {
    return this.createNode('DeclareStatement');
  }

  private attemptErrorRecovery(): void {
    // Intentar avanzar hasta el siguiente token reconocible
    while (this.position < this.tokens.length) {
      const token = this.getCurrentToken();
      if (!token) break;
      
      // Buscar tokens que pueden indicar inicio de nueva declaración
      if (this.isRecoveryToken(token)) {
        break;
      }
      
      this.position++;
      
      // Evitar bucle infinito
      if (this.position > this.tokens.length + 10) {
        break;
      }
    }
  }

  private isRecoveryToken(token: LexicalToken): boolean {
    const recoveryKeywords = [
      'function', 'var', 'let', 'const', 'class', 'if', 'for', 'while',
      'def', 'import', 'from', 'return',
      'int', 'void', 'char', 'float', 'double', '#include',
      'program', 'procedure', 'begin', 'var',
      'select', 'insert', 'update', 'delete', 'create', 'alter', 'drop',
      'declare'
    ];
    
    return recoveryKeywords.includes(token.value.toLowerCase()) ||
           token.category === 'PALABRA_RESERVADA';
  }

  private performPostAnalysisChecks(): void {
    // Verificaciones específicas por lenguaje
    switch (this.language) {
      case 'python':
        this.checkPythonSpecific();
        break;
      case 'c++':
      case 'cpp':
        this.checkCppSpecific();
        break;
      case 'html':
        this.checkHtmlSpecific();
        break;
      case 'pascal':
        this.checkPascalSpecific();
        break;
      case 'pl/sql':
      case 't-sql':
      case 'sql':
        this.checkSqlSpecific();
        break;
      case 'javascript':
        this.checkJavaScriptSpecific();
        break;
    }
    
    // Verificaciones generales
    this.checkBalancedSymbols();
  }

  private checkPythonSpecific(): void {
    // Verificar indentación básica
    let expectingIndent = false;
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.value === ':') {
        expectingIndent = true;
      } else if (expectingIndent && token.line > (this.tokens[i-1]?.line || 0)) {
        // Nueva línea después de ':'
        expectingIndent = false;
        // Aquí podríamos verificar indentación real
      }
    }
  }

  private checkCppSpecific(): void {
    // Verificar que hay al menos un #include
    const hasInclude = this.tokens.some(token => 
      token.value.startsWith('#include'));
    
    if (!hasInclude && this.tokens.length > 5) {
      this.addError('Programa C++ debería incluir al menos una directiva #include', 'warning');
    }
    
    // Verificar función main
    const hasMain = this.tokens.some(token => 
      token.value === 'main' && token.category === 'IDENTIFICADOR');
    
    if (!hasMain && this.tokens.length > 10) {
      this.addError('Programa C++ debería tener una función main', 'warning');
    }
  }

  private checkHtmlSpecific(): void {
    // Verificar etiquetas básicas de HTML
    const hasHtmlTag = this.tokens.some(token => 
      token.value.toLowerCase().includes('html'));
    
    if (!hasHtmlTag && this.tokens.length > 3) {
      this.addError('Documento HTML debería contener etiqueta <html>', 'info');
    }
  }

  private checkPascalSpecific(): void {
    // Verificar estructura básica de Pascal
    const hasProgram = this.tokens.some(token => 
      token.value.toLowerCase() === 'program');
    
    if (!hasProgram && this.tokens.length > 5) {
      this.addError('Programa Pascal debería comenzar con "program"', 'warning');
    }
    
    // Verificar begin/end balance
    this.checkBeginEndBalance();
  }

  private checkSqlSpecific(): void {
    // Verificar comandos SQL válidos
    const sqlKeywords = ['select', 'insert', 'update', 'delete', 'create', 'alter', 'drop'];
    const hasSqlKeyword = this.tokens.some(token => 
      sqlKeywords.includes(token.value.toLowerCase()));
    
    if (!hasSqlKeyword && this.tokens.length > 2) {
      this.addError('Código SQL debería contener al menos un comando válido', 'info');
    }
  }

  private checkJavaScriptSpecific(): void {
    // Verificaciones específicas de JavaScript
    // (Por ahora básicas, se pueden expandir)
  }
}