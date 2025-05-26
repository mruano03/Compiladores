// Analizador Semántico Avanzado para Compiladores
// Implementa análisis semántico con verificación de tipos, alcance y compatibilidad

import { LexicalToken } from './lexical-analyzer';
import { ParseNode } from './syntax-analyzer';

export interface SemanticError {
  type: 'semantico';
  message: string;
  line: number;
  column: number;
  position: number;
  severity: 'error' | 'warning' | 'info';
  context?: string;
}

export interface SymbolTableEntry {
  name: string;
  type: 'variable' | 'function' | 'class' | 'constant' | 'keyword' | 'parameter' | 'method';
  dataType?: string;
  scope: string;
  line: number;
  column: number;
  value?: any;
  parameters?: ParameterInfo[];
  returnType?: string;
  isInitialized?: boolean;
  isUsed?: boolean;
  isConstant?: boolean;
}

export interface ParameterInfo {
  name: string;
  dataType: string;
  isOptional?: boolean;
}

export interface Scope {
  name: string;
  parent?: Scope;
  symbols: Map<string, SymbolTableEntry>;
  functions: Map<string, SymbolTableEntry>;
  level: number;
}

export interface TypeInfo {
  baseType: string;
  isArray?: boolean;
  arrayDimensions?: number;
  genericTypes?: string[];
}

// Definiciones de tipos por lenguaje
export const TYPE_DEFINITIONS = {
  javascript: {
    primitives: ['number', 'string', 'boolean', 'undefined', 'null', 'symbol', 'bigint'],
    objects: ['Object', 'Array', 'Function', 'Date', 'RegExp', 'Error'],
    autoConversions: {
      'string + number': 'string',
      'number + string': 'string',
      'boolean + number': 'number',
      'number + boolean': 'number'
    }
  },
  python: {
    primitives: ['int', 'float', 'str', 'bool', 'NoneType'],
    objects: ['list', 'dict', 'tuple', 'set', 'frozenset'],
    autoConversions: {
      'int + float': 'float',
      'float + int': 'float'
    }
  },
  'c++': {
    primitives: ['int', 'float', 'double', 'char', 'bool', 'void'],
    modifiers: ['signed', 'unsigned', 'short', 'long'],
    pointers: true,
    references: true,
    autoConversions: {
      'int + float': 'float',
      'char + int': 'int',
      'short + int': 'int'
    }
  },
  pascal: {
    primitives: ['integer', 'real', 'boolean', 'char', 'string'],
    structured: ['array', 'record', 'set', 'file'],
    autoConversions: {
      'integer + real': 'real'
    }
  },
  'pl/sql': {
    primitives: ['number', 'varchar2', 'char', 'date', 'timestamp', 'boolean'],
    lobs: ['clob', 'blob', 'nclob'],
    autoConversions: {
      'number + varchar2': 'varchar2',
      'date + number': 'date'
    }
  },
  't-sql': {
    primitives: ['int', 'bigint', 'smallint', 'tinyint', 'bit', 'decimal', 'numeric', 'float', 'real'],
    strings: ['varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext'],
    temporal: ['datetime', 'datetime2', 'date', 'time'],
    autoConversions: {
      'int + decimal': 'decimal',
      'varchar + int': 'varchar'
    }
  }
};

export class SemanticAnalyzer {
  private tokens: LexicalToken[];
  private parseTree: ParseNode[];
  private language: string;
  private errors: SemanticError[] = [];
  private currentScope: Scope;
  private globalScope: Scope;
  private scopeStack: Scope[] = [];
  private symbolTable: SymbolTableEntry[] = [];

  constructor(tokens: LexicalToken[], parseTree: ParseNode[], language: string) {
    this.tokens = tokens;
    this.parseTree = parseTree;
    this.language = language.toLowerCase();
    
    // Inicializar scope global
    this.globalScope = {
      name: 'global',
      symbols: new Map(),
      functions: new Map(),
      level: 0
    };
    this.currentScope = this.globalScope;
  }

  public analyze(): { errors: SemanticError[], symbolTable: SymbolTableEntry[] } {
    this.reset();
    
    // Si no hay tokens o nodos para analizar, retornar resultado básico
    if (this.tokens.length === 0 && this.parseTree.length === 0) {
      return {
        errors: [],
        symbolTable: []
      };
    }
    
    try {
      // 1. Primera pasada: construir tabla de símbolos
      this.buildSymbolTable();
      
      // 2. Segunda pasada: verificación semántica (solo si hay suficientes símbolos)
      if (this.symbolTable.length > 0) {
        this.performSemanticChecks();
      }
      
      // 3. Verificaciones específicas del lenguaje (solo si hay pocos errores)
      if (this.errors.length <= 3) {
        this.performLanguageSpecificChecks();
      }
      
    } catch (error) {
      // Manejar errores de manera más suave - solo agregar si no hay otros errores
      if (this.errors.length === 0) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.addError(`Error en análisis semántico: ${errorMessage}`, 'warning');
      }
    }
    
    return {
      errors: this.errors,
      symbolTable: this.symbolTable
    };
  }

  private reset(): void {
    this.errors = [];
    this.symbolTable = [];
    this.scopeStack = [this.globalScope];
    this.currentScope = this.globalScope;
  }

  private buildSymbolTable(): void {
    // Agregar símbolos built-in del lenguaje
    this.addBuiltInSymbols();
    
    // Procesar tokens para encontrar declaraciones (con manejo de errores)
    try {
      this.processTokensForDeclarations();
    } catch (error) {
      this.addError('Error procesando declaraciones de tokens', 'warning');
    }
    
    // Procesar árbol de parsing para declaraciones complejas
    try {
      for (const node of this.parseTree) {
        this.processNodeForDeclarations(node);
      }
    } catch (error) {
      this.addError('Error procesando declaraciones del árbol sintáctico', 'warning');
    }
  }

  private addBuiltInSymbols(): void {
    const builtIns = this.getBuiltInSymbols();
    
    for (const symbol of builtIns) {
      this.addSymbol(symbol);
    }
  }

  private getBuiltInSymbols(): SymbolTableEntry[] {
    switch (this.language) {
      case 'javascript':
        return [
          { name: 'console', type: 'variable', dataType: 'Console', scope: 'global', line: 0, column: 0 },
          { name: 'window', type: 'variable', dataType: 'Window', scope: 'global', line: 0, column: 0 },
          { name: 'document', type: 'variable', dataType: 'Document', scope: 'global', line: 0, column: 0 },
          { name: 'parseInt', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'number' },
          { name: 'parseFloat', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'number' }
        ];
      case 'python':
        return [
          { name: 'print', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'None' },
          { name: 'input', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'str' },
          { name: 'len', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'int' },
          { name: 'range', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'range' },
          { name: 'str', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'str' },
          { name: 'int', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'int' },
          { name: 'float', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'float' }
        ];
      case 'c++':
        return [
          { name: 'cout', type: 'variable', dataType: 'ostream', scope: 'std', line: 0, column: 0 },
          { name: 'cin', type: 'variable', dataType: 'istream', scope: 'std', line: 0, column: 0 },
          { name: 'endl', type: 'variable', dataType: 'manipulator', scope: 'std', line: 0, column: 0 },
          { name: 'printf', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'int' },
          { name: 'scanf', type: 'function', dataType: 'function', scope: 'global', line: 0, column: 0, returnType: 'int' }
        ];
      default:
        return [];
    }
  }

  private processTokensForDeclarations(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      try {
        // Verificar si es una declaración de variable
        if (this.isVariableDeclarationKeyword(token.value)) {
          this.processVariableDeclaration(i);
        }
        
        // Verificar si es una declaración de función
        else if (this.isFunctionDeclarationKeyword(token.value)) {
          this.processFunctionDeclaration(i);
        }
        
        // Verificar si es una declaración de clase
        else if (token.value === 'class' && token.category === 'PALABRA_RESERVADA') {
          this.processClassDeclaration(i);
        }
        
        // Agregar identificadores como símbolos potenciales
        else if (token.category === 'IDENTIFICADOR' && !this.isKeyword(token.value)) {
          this.addPotentialSymbol(token);
        }
      } catch (error) {
        // Continuar procesando otros tokens aunque uno falle
        continue;
      }
    }
  }

  private processNodeForDeclarations(node: ParseNode): void {
    switch (node.type) {
      case 'VariableDeclaration':
        this.processVariableDeclarationNode(node);
        break;
      case 'FunctionDeclaration':
      case 'FunctionDefinition':
        this.processFunctionDeclarationNode(node);
        break;
      case 'ClassDefinition':
        this.processClassDeclarationNode(node);
        break;
    }
    
    // Procesar hijos recursivamente
    for (const child of node.children) {
      this.processNodeForDeclarations(child);
    }
  }

  private performSemanticChecks(): void {
    // Realizar verificaciones semánticas básicas con manejo de errores
    try {
      this.checkUndeclaredVariables();
    } catch (error) {
      this.addError('Error verificando variables no declaradas', 'info');
    }
    
    try {
      this.checkFunctionCalls();
    } catch (error) {
      this.addError('Error verificando llamadas a funciones', 'info');
    }
    
    try {
      this.checkTypeCompatibility();
    } catch (error) {
      this.addError('Error verificando compatibilidad de tipos', 'info');
    }
    
    // Verificaciones de advertencia (no críticas)
    try {
      this.checkUnusedVariables();
      this.checkUninitializedVariables();
    } catch (error) {
      // Estas son verificaciones de calidad, no críticas
    }
  }

  private performLanguageSpecificChecks(): void {
    try {
      switch (this.language) {
        case 'javascript':
          this.checkJavaScriptSpecific();
          break;
        case 'python':
          this.checkPythonSpecific();
          break;
        case 'c++':
        case 'cpp':
          this.checkCppSpecific();
          break;
        case 'pascal':
          this.checkPascalSpecific();
          break;
        case 'pl/sql':
        case 't-sql':
        case 'sql':
          this.checkSqlSpecific();
          break;
      }
    } catch (error) {
      this.addError(`Error en verificaciones específicas de ${this.language}`, 'info');
    }
  }

  private checkUndeclaredVariables(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      if (token.category === 'IDENTIFICADOR' && !this.isKeyword(token.value)) {
        const symbol = this.findSymbol(token.value);
        
        if (!symbol && !this.isBuiltInFunction(token.value)) {
          // Verificar si no es parte de una declaración
          const prevToken = this.tokens[i - 1];
          const nextToken = this.tokens[i + 1];
          
          const isDeclaration = prevToken && this.isVariableDeclarationKeyword(prevToken.value);
          const isFunctionDecl = prevToken && this.isFunctionDeclarationKeyword(prevToken.value);
          const isObjectProperty = nextToken && nextToken.value === '.';
          
          if (!isDeclaration && !isFunctionDecl && !isObjectProperty) {
            this.addError(
              `Variable '${token.value}' no ha sido declarada`,
              'warning',
              token.line,
              token.column,
              token.position
            );
          }
        } else if (symbol) {
          // Marcar como usado
          symbol.isUsed = true;
        }
      }
    }
  }

  private checkFunctionCalls(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      const nextToken = this.tokens[i + 1];
      
      // Identificar llamadas a función (identificador seguido de paréntesis)
      if (token.category === 'IDENTIFICADOR' && 
          nextToken && nextToken.value === '(') {
        
        const functionSymbol = this.findFunction(token.value);
        
        if (!functionSymbol && !this.isBuiltInFunction(token.value)) {
          this.addError(
            `Función '${token.value}' no ha sido declarada`,
            'error',
            token.line,
            token.column,
            token.position
          );
        } else {
          // Verificar parámetros básicamente
          try {
            const params = this.extractFunctionCallParameters(i + 1);
            // Aquí se podrían hacer más verificaciones de parámetros
          } catch (error) {
            // Error en extracción de parámetros, pero no es crítico
          }
        }
      }
    }
  }

  private checkTypeCompatibility(): void {
    // Verificar asignaciones de tipos
    for (let i = 0; i < this.tokens.length - 2; i++) {
      const varToken = this.tokens[i];
      const opToken = this.tokens[i + 1];
      const valueToken = this.tokens[i + 2];
      
      if (varToken.category === 'IDENTIFICADOR' && 
          opToken.type === 'OPERADOR_ASIGNACION' && 
          opToken.value === '=') {
        
        const varSymbol = this.findSymbol(varToken.value);
        if (varSymbol && varSymbol.dataType) {
          const valueType = this.inferTokenType(valueToken);
          
          if (!this.areTypesCompatible(varSymbol.dataType, valueType)) {
            this.addError(
              `Incompatibilidad de tipos: no se puede asignar '${valueType}' a '${varSymbol.dataType}'`,
              'error',
              varToken.line,
              varToken.column,
              varToken.position
            );
          }
          
          // Marcar variable como inicializada
          varSymbol.isInitialized = true;
        }
      }
    }
  }

  private checkUnusedVariables(): void {
    for (const symbol of this.symbolTable) {
      if (symbol.type === 'variable' && !symbol.isUsed && symbol.scope !== 'global') {
        this.addError(
          `Variable '${symbol.name}' declarada pero no utilizada`,
          'warning',
          symbol.line,
          symbol.column
        );
      }
    }
  }

  private checkUninitializedVariables(): void {
    for (const symbol of this.symbolTable) {
      if (symbol.type === 'variable' && 
          symbol.isUsed && 
          !symbol.isInitialized && 
          this.language !== 'javascript') { // JavaScript permite variables undefined
        this.addError(
          `Variable '${symbol.name}' usada sin inicializar`,
          'warning',
          symbol.line,
          symbol.column
        );
      }
    }
  }

  private checkConstantAssignments(): void {
    for (let i = 0; i < this.tokens.length - 2; i++) {
      const varToken = this.tokens[i];
      const opToken = this.tokens[i + 1];
      
      if (varToken.category === 'IDENTIFICADOR' && 
          opToken.type === 'OPERADOR_ASIGNACION' && 
          opToken.value === '=') {
        
        const symbol = this.findSymbol(varToken.value);
        if (symbol && symbol.isConstant) {
          this.addError(
            `No se puede reasignar la constante '${symbol.name}'`,
            'error',
            varToken.line,
            varToken.column,
            varToken.position
          );
        }
      }
    }
  }

  private checkVariableScope(): void {
    // Verificar que las variables se usen en el ámbito correcto
    // Esta es una verificación simplificada
    for (const token of this.tokens) {
      if (token.category === 'IDENTIFICADOR') {
        const symbol = this.findSymbol(token.value);
        if (symbol && this.isOutOfScope(symbol, token)) {
          this.addError(
            `Variable '${token.value}' fuera de ámbito`,
            'error',
            token.line,
            token.column,
            token.position
          );
        }
      }
    }
  }

  // Verificaciones específicas por lenguaje

  private checkJavaScriptSpecific(): void {
    // Verificar uso de 'var' vs 'let'/'const'
    for (const token of this.tokens) {
      if (token.value === 'var') {
        this.addError(
          "Se recomienda usar 'let' o 'const' en lugar de 'var'",
          'info',
          token.line,
          token.column,
          token.position
        );
      }
    }
    
    // Verificar comparaciones con === vs ==
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.value === '==' || token.value === '!=') {
        this.addError(
          `Se recomienda usar '${token.value}=' para comparación estricta`,
          'info',
          token.line,
          token.column,
          token.position
        );
      }
    }
  }

  private checkPythonSpecific(): void {
    // Verificar convenciones de nombres
    for (const symbol of this.symbolTable) {
      if (symbol.type === 'variable' && !this.isPythonNamingConvention(symbol.name)) {
        this.addError(
          `El nombre '${symbol.name}' no sigue las convenciones de Python (snake_case)`,
          'info',
          symbol.line,
          symbol.column
        );
      }
      
      if (symbol.type === 'function' && !this.isPythonNamingConvention(symbol.name)) {
        this.addError(
          `El nombre de función '${symbol.name}' no sigue las convenciones de Python (snake_case)`,
          'info',
          symbol.line,
          symbol.column
        );
      }
      
      if (symbol.type === 'class' && !this.isPythonClassNamingConvention(symbol.name)) {
        this.addError(
          `El nombre de clase '${symbol.name}' no sigue las convenciones de Python (PascalCase)`,
          'info',
          symbol.line,
          symbol.column
        );
      }
    }
  }

  private checkCppSpecific(): void {
    // Verificar uso de punteros y referencias
    this.checkCppPointers();
    
    // Verificar función main
    const mainFunction = this.findFunction('main');
    if (!mainFunction) {
      this.addError(
        'Programa C++ debe tener una función main',
        'error',
        1,
        1
      );
    }
    
    // Verificar includes
    const hasInclude = this.tokens.some(token => 
      token.type === 'DIRECTIVA_PREPROCESADOR' && token.value.includes('#include')
    );
    
    if (!hasInclude) {
      this.addError(
        'Programa C++ debería incluir al menos una directiva #include',
        'warning',
        1,
        1
      );
    }
  }

  private checkPascalSpecific(): void {
    // Verificar estructura de programa
    const hasProgram = this.tokens.some(token => token.value.toLowerCase() === 'program');
    if (!hasProgram) {
      this.addError(
        'Programa Pascal debe comenzar con la palabra clave PROGRAM',
        'error',
        1,
        1
      );
    }
    
    // Verificar BEGIN/END balanceados
    const beginCount = this.tokens.filter(token => token.value.toLowerCase() === 'begin').length;
    const endCount = this.tokens.filter(token => token.value.toLowerCase() === 'end').length;
    
    if (beginCount !== endCount) {
      this.addError(
        `BEGIN/END no balanceados: ${beginCount} BEGIN, ${endCount} END`,
        'error',
        1,
        1
      );
    }
  }

  private checkSqlSpecific(): void {
    // Verificar comandos SQL válidos
    const sqlCommands = ['select', 'insert', 'update', 'delete', 'create', 'alter', 'drop'];
    let hasValidCommand = false;
    
    for (const token of this.tokens) {
      if (sqlCommands.includes(token.value.toLowerCase())) {
        hasValidCommand = true;
        break;
      }
    }
    
    if (!hasValidCommand) {
      this.addError(
        'No se encontró ningún comando SQL válido',
        'warning',
        1,
        1
      );
    }
    
    // Verificar sintaxis de CREATE TABLE
    this.checkCreateTableSyntax();
  }

  private checkCppPointers(): void {
    for (let i = 0; i < this.tokens.length - 1; i++) {
      const token = this.tokens[i];
      const nextToken = this.tokens[i + 1];
      
      if (token.value === '*' && nextToken.category === 'IDENTIFICADOR') {
        // Posible declaración de puntero
        const symbol = this.findSymbol(nextToken.value);
        if (symbol) {
          symbol.dataType = `${symbol.dataType}*`;
        }
      }
    }
  }

  private checkCreateTableSyntax(): void {
    for (let i = 0; i < this.tokens.length - 2; i++) {
      const token1 = this.tokens[i];
      const token2 = this.tokens[i + 1];
      const token3 = this.tokens[i + 2];
      
      if (token1.value.toLowerCase() === 'create' && 
          token2.value.toLowerCase() === 'table' && 
          token3.category === 'IDENTIFICADOR') {
        // Verificar que existe la estructura completa
        let hasParentheses = false;
        for (let j = i + 3; j < this.tokens.length; j++) {
          if (this.tokens[j].value === '(') {
            hasParentheses = true;
            break;
          }
        }
        
        if (!hasParentheses) {
          this.addError(
            `CREATE TABLE '${token3.value}' debe incluir definición de columnas entre paréntesis`,
            'error',
            token3.line,
            token3.column,
            token3.position
          );
        }
      }
    }
  }

  // Métodos auxiliares

  private isVariableDeclarationKeyword(value: string): boolean {
    const keywords = ['var', 'let', 'const', 'int', 'float', 'double', 'char', 'bool', 'string', 'declare'];
    return keywords.includes(value.toLowerCase());
  }

  private isFunctionDeclarationKeyword(value: string): boolean {
    const keywords = ['function', 'def', 'procedure', 'func'];
    return keywords.includes(value.toLowerCase());
  }

  private processVariableDeclaration(index: number): void {
    try {
      const keyword = this.tokens[index];
      const nameToken = this.tokens[index + 1];
      
      if (!nameToken || nameToken.category !== 'IDENTIFICADOR') {
        return; // Declaración incompleta, pero no es error crítico
      }
      
      const dataType = this.inferDataTypeFromDeclaration(keyword.value, index);
      
      const symbol: SymbolTableEntry = {
        name: nameToken.value,
        type: 'variable',
        dataType: dataType,
        scope: this.currentScope.name,
        line: nameToken.line,
        column: nameToken.column,
        isInitialized: this.hasInitializer(index),
        isUsed: false,
        isConstant: keyword.value === 'const'
      };
      
      this.addSymbol(symbol);
    } catch (error) {
      // Fallo procesando esta declaración, pero continuamos
    }
  }

  private processFunctionDeclaration(index: number): void {
    const functionToken = this.tokens[index];
    const nameToken = this.tokens[index + 1];
    
    if (nameToken && nameToken.category === 'IDENTIFICADOR') {
      const parameters = this.extractFunctionParameters(index);
      const returnType = this.inferReturnType(index);
      
      const symbol: SymbolTableEntry = {
        name: nameToken.value,
        type: 'function',
        dataType: 'function',
        scope: this.currentScope.name,
        line: nameToken.line,
        column: nameToken.column,
        parameters,
        returnType,
        isUsed: false
      };
      
      this.addFunction(symbol);
    }
  }

  private processClassDeclaration(index: number): void {
    const classToken = this.tokens[index];
    const nameToken = this.tokens[index + 1];
    
    if (nameToken && nameToken.category === 'IDENTIFICADOR') {
      const symbol: SymbolTableEntry = {
        name: nameToken.value,
        type: 'class',
        dataType: 'class',
        scope: this.currentScope.name,
        line: nameToken.line,
        column: nameToken.column,
        isUsed: false
      };
      
      this.addSymbol(symbol);
    }
  }

  private processVariableDeclarationNode(node: ParseNode): void {
    // Implementación para procesar nodos del árbol de parsing
    // Esta sería más robusta que el procesamiento de tokens
  }

  private processFunctionDeclarationNode(node: ParseNode): void {
    // Implementación para procesar declaraciones de función del árbol
  }

  private processClassDeclarationNode(node: ParseNode): void {
    // Implementación para procesar declaraciones de clase del árbol
  }

  private extractFunctionCallParameters(startIndex: number): string[] {
    const params: string[] = [];
    let depth = 0;
    let current = '';
    
    for (let i = startIndex; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      
      if (token.value === '(') depth++;
      else if (token.value === ')') {
        depth--;
        if (depth === 0) break;
      } else if (token.value === ',' && depth === 1) {
        if (current.trim()) params.push(current.trim());
        current = '';
        continue;
      }
      
      if (depth > 0 && token.value !== '(') {
        current += token.value;
      }
    }
    
    if (current.trim()) params.push(current.trim());
    return params;
  }

  private extractFunctionParameters(index: number): ParameterInfo[] {
    // Implementación simplificada
    return [];
  }

  private inferDataTypeFromDeclaration(keyword: string, index: number): string {
    switch (keyword.toLowerCase()) {
      case 'var': return 'any';
      case 'let': return 'any';
      case 'const': return 'any';
      case 'int': return 'int';
      case 'float': return 'float';
      case 'double': return 'double';
      case 'char': return 'char';
      case 'bool': return 'bool';
      case 'string': return 'string';
      default: return 'unknown';
    }
  }

  private inferReturnType(index: number): string {
    // Implementación simplificada
    return 'unknown';
  }

  private inferTokenType(token: LexicalToken): string {
    switch (token.category) {
      case 'NUMERO':
        if (token.type === 'NUMERO_ENTERO') return 'int';
        if (token.type === 'NUMERO_DECIMAL') return 'float';
        return 'number';
      case 'CADENA':
        return 'string';
      case 'IDENTIFICADOR':
        const symbol = this.findSymbol(token.value);
        return symbol?.dataType || 'unknown';
      default:
        return 'unknown';
    }
  }

  private areTypesCompatible(type1: string, type2: string): boolean {
    if (type1 === type2) return true;
    if (type1 === 'any' || type2 === 'any') return true;
    
    // Verificar conversiones automáticas por lenguaje
    const conversions = TYPE_DEFINITIONS[this.language as keyof typeof TYPE_DEFINITIONS]?.autoConversions;
    if (conversions) {
      const key1 = `${type1} + ${type2}`;
      const key2 = `${type2} + ${type1}`;
      if (conversions[key1 as keyof typeof conversions] || conversions[key2 as keyof typeof conversions]) {
        return true;
      }
    }
    
    return false;
  }

  private isKeyword(value: string): boolean {
    const keywords = ['var', 'let', 'const', 'function', 'if', 'else', 'for', 'while', 'return', 'class'];
    return keywords.includes(value.toLowerCase());
  }

  private isBuiltInFunction(name: string): boolean {
    const builtIns = this.getBuiltInSymbols();
    return builtIns.some(symbol => symbol.name === name && symbol.type === 'function');
  }

  private isPythonNamingConvention(name: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(name);
  }

  private isPythonClassNamingConvention(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  private isOutOfScope(symbol: SymbolTableEntry, token: LexicalToken): boolean {
    // Implementación simplificada de verificación de ámbito
    return false;
  }

  private addSymbol(symbol: SymbolTableEntry): void {
    // Verificar si ya existe en el ámbito actual
    const existing = this.currentScope.symbols.get(symbol.name);
    if (existing) {
      this.addError(
        `Variable '${symbol.name}' ya está declarada en línea ${existing.line}`,
        'error',
        symbol.line,
        symbol.column
      );
      return;
    }
    
    this.currentScope.symbols.set(symbol.name, symbol);
    this.symbolTable.push(symbol);
  }

  private addFunction(symbol: SymbolTableEntry): void {
    // Verificar si ya existe en el ámbito actual
    const existing = this.currentScope.functions.get(symbol.name);
    if (existing) {
      this.addError(
        `Función '${symbol.name}' ya está declarada en línea ${existing.line}`,
        'error',
        symbol.line,
        symbol.column
      );
      return;
    }
    
    this.currentScope.functions.set(symbol.name, symbol);
    this.symbolTable.push(symbol);
  }

  private findSymbol(name: string): SymbolTableEntry | undefined {
    // Buscar en el ámbito actual y ancestros
    let current: Scope | undefined = this.currentScope;
    
    while (current) {
      const symbol = current.symbols.get(name);
      if (symbol) return symbol;
      current = current.parent;
    }
    
    return undefined;
  }

  private findFunction(name: string): SymbolTableEntry | undefined {
    // Buscar en el ámbito actual y ancestros
    let current: Scope | undefined = this.currentScope;
    
    while (current) {
      const func = current.functions.get(name);
      if (func) return func;
      current = current.parent;
    }
    
    return undefined;
  }

  private addError(
    message: string, 
    severity: SemanticError['severity'], 
    line?: number, 
    column?: number, 
    position?: number
  ): void {
    this.errors.push({
      type: 'semantico',
      message,
      line: line || 0,
      column: column || 0,
      position: position || 0,
      severity
    });
  }

  findSymbolInScope(name: string, scope: Scope): SymbolTableEntry | undefined {
    let symbol = scope.symbols.get(name);
    if (symbol) return symbol;
    if (scope.parent) {
      return this.findSymbolInScope(name, scope.parent);
    }
    return undefined;
  }

  analyzePythonExpression(node: ParseNode, scope: Scope): TypeInfo {
    switch (node.type) {
      case 'NUMERO':
        return { baseType: 'number' };
      case 'IDENTIFICADOR': {
        let symbol = this.findSymbolInScope(node.value!, scope);
        if (!symbol) {
          // En Python, crear variable al primer uso
          symbol = {
            name: node.value!,
            type: 'variable',
            dataType: 'dynamic',
            scope: scope.name,
            line: node.line,
            column: node.column,
            isInitialized: true,
            isUsed: true
          };
          scope.symbols.set(node.value!, symbol);
        }
        return { baseType: symbol.dataType || 'dynamic' };
      }
      case 'functionCall':
        return this.analyzePythonFunctionCall(node, scope);
      default:
        return { baseType: 'dynamic' };
    }
  }

  analyzePythonFunctionCall(node: ParseNode, scope: Scope): TypeInfo {
    const funcName = node.children[0].value;
    let func = this.findSymbolInScope(funcName!, scope);
    if (!func) {
      // Permitir llamadas a funciones al primer uso (recursividad o built-in)
      func = {
        name: funcName!,
        type: 'function',
        scope: scope.name,
        line: node.line,
        column: node.column,
        parameters: [],
        returnType: 'dynamic'
      };
      scope.symbols.set(funcName!, func);
    }
    return { baseType: func.returnType || 'dynamic' };
  }
  
  analyzePythonStatement(node: ParseNode, scope: Scope): void {
    switch (node.type) {
      case 'assignmentStatement':
        this.analyzePythonAssignment(node, scope);
        break;
      case 'ifStatement':
        this.analyzePythonIfStatement(node, scope);
        break;
      case 'functionCall':
        this.analyzePythonFunctionCall(node, scope);
        break;
      default:
        // Analizar otros tipos de declaraciones
        this.analyzePythonExpression(node, scope);
    }
  }
  
  analyzePythonAssignment(node: ParseNode, scope: Scope): void {
    const targetName = node.children[0].value;
    const valueType = this.analyzePythonExpression(node.children[1], scope);
    
    // En Python, las variables se crean al asignarles un valor
    let symbol = this.findSymbolInScope(targetName!, scope);
    if (!symbol) {
      symbol = {
        name: targetName!,
        type: 'variable',
        dataType: valueType.baseType,
        scope: scope.name,
        line: node.line,
        column: node.column,
        isInitialized: true,
        isUsed: false
      };
      scope.symbols.set(targetName!, symbol);
    } else {
      // Actualizar el tipo si es necesario (tipado dinámico)
      symbol.dataType = valueType.baseType;
      symbol.isInitialized = true;
    }
  }
  
  analyzePythonIfStatement(node: ParseNode, scope: Scope): void {
    // Analizar la condición
    this.analyzePythonExpression(node.children[0], scope);
    
    // Analizar el bloque then
    const thenScope: Scope = {
      name: scope.name + '_if',
      parent: scope,
      symbols: new Map(),
      functions: new Map(),
      level: scope.level + 1
    };
    this.analyzePythonBlock(node.children[1], thenScope);
    
    // Analizar el bloque else si existe
    if (node.children[2]) {
      const elseScope: Scope = {
        name: scope.name + '_else',
        parent: scope,
        symbols: new Map(),
        functions: new Map(),
        level: scope.level + 1
      };
      this.analyzePythonBlock(node.children[2], elseScope);
    }
  }
  
  analyzePythonBlock(node: ParseNode, scope: Scope): void {
    node.children.forEach(child => {
      this.analyzePythonStatement(child, scope);
    });
  }

  private addPotentialSymbol(token: LexicalToken): void {
    // Solo agregar si no existe ya
    if (!this.findSymbol(token.value)) {
      const symbol: SymbolTableEntry = {
        name: token.value,
        type: 'variable',
        dataType: 'unknown',
        scope: this.currentScope.name,
        line: token.line,
        column: token.column,
        isInitialized: false,
        isUsed: false
      };
      
      this.addSymbol(symbol);
    }
  }

  private hasInitializer(index: number): boolean {
    // Buscar operador de asignación después de la declaración
    for (let i = index + 1; i < Math.min(index + 5, this.tokens.length); i++) {
      const token = this.tokens[i];
      if (token.value === '=' || token.type === 'OPERADOR_ASIGNACION') {
        return true;
      }
      if (token.value === ';' || token.value === '\n') {
        break;
      }
    }
    return false;
  }
}