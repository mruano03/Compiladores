

import { LexicalAnalyzer, LexicalToken, LexicalError } from './lexical-analyzer';
import { SyntaxAnalyzer, SyntaxError, ParseNode } from './syntax-analyzer';
import { SemanticAnalyzer, SemanticError, SymbolTableEntry } from './semantic-analyzer';

export interface CompilerError {
  type: 'lexico' | 'sintactico' | 'semantico';
  message: string;
  line: number;
  column: number;
  position: number;
  severity: 'error' | 'warning' | 'info';
  context?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string[];
  executedCommands: string[];
}

export interface CompilerAnalysisResult {
  language: string;
  tokens: LexicalToken[];
  parseTree: ParseNode[];
  symbolTable: SymbolTableEntry[];
  errors: CompilerError[];
  canExecute: boolean;
  executionResult?: ExecutionResult;
  analysisPhases: {
    lexical: {
      completed: boolean;
      tokensFound: number;
      errorsFound: number;
    };
    syntax: {
      completed: boolean;
      nodesGenerated: number;
      errorsFound: number;
    };
    semantic: {
      completed: boolean;
      symbolsFound: number;
      errorsFound: number;
    };
  };
}

export class CompilerAnalyzer {
  private code: string;
  private language: string;
  private lexicalAnalyzer: LexicalAnalyzer;
  private syntaxAnalyzer: SyntaxAnalyzer | null = null;
  private semanticAnalyzer: SemanticAnalyzer | null = null;

  constructor(code: string, language: string) {
    this.code = code;
    this.language = language.toLowerCase();
    this.lexicalAnalyzer = new LexicalAnalyzer(code, language);
  }

  public analyze(): CompilerAnalysisResult {
    const result: CompilerAnalysisResult = {
      language: this.language,
      tokens: [],
      parseTree: [],
      symbolTable: [],
      errors: [],
      canExecute: false,
      analysisPhases: {
        lexical: { completed: false, tokensFound: 0, errorsFound: 0 },
        syntax: { completed: false, nodesGenerated: 0, errorsFound: 0 },
        semantic: { completed: false, symbolsFound: 0, errorsFound: 0 }
      }
    };

    try {
      // Fase 1: Análisis Léxico
      const lexicalResult = this.performLexicalAnalysis();
      result.tokens = lexicalResult.tokens;
      result.errors.push(...this.convertLexicalErrors(lexicalResult.errors));
      result.analysisPhases.lexical = {
        completed: true,
        tokensFound: lexicalResult.tokens.length,
        errorsFound: lexicalResult.errors.length
      };

      // Solo continuar si no hay errores léxicos graves
      const criticalLexicalErrors = lexicalResult.errors.length;
      if (criticalLexicalErrors === 0 || this.shouldContinueWithErrors(lexicalResult.errors)) {
        
        // Fase 2: Análisis Sintáctico
        const syntaxResult = this.performSyntaxAnalysis(lexicalResult.tokens);
        result.parseTree = syntaxResult.parseTree;
        result.errors.push(...this.convertSyntaxErrors(syntaxResult.errors));
        result.analysisPhases.syntax = {
          completed: true,
          nodesGenerated: syntaxResult.parseTree.length,
          errorsFound: syntaxResult.errors.length
        };

        // Solo continuar si no hay errores sintácticos graves
        const criticalSyntaxErrors = syntaxResult.errors.filter(e => e.severity === 'error').length;
        if (criticalSyntaxErrors === 0) {
          
          // Fase 3: Análisis Semántico
          const semanticResult = this.performSemanticAnalysis(lexicalResult.tokens, syntaxResult.parseTree);
          result.symbolTable = semanticResult.symbolTable;
          result.errors.push(...this.convertSemanticErrors(semanticResult.errors));
          result.analysisPhases.semantic = {
            completed: true,
            symbolsFound: semanticResult.symbolTable.length,
            errorsFound: semanticResult.errors.length
          };

          // Determinar si se puede ejecutar
          const criticalSemanticErrors = semanticResult.errors.filter(e => e.severity === 'error').length;
          result.canExecute = criticalSemanticErrors === 0 && criticalSyntaxErrors === 0 && criticalLexicalErrors === 0;

          // Fase 4: Simulación de Ejecución (si es posible)
          if (result.canExecute) {
            result.executionResult = this.simulateExecution(result);
          }
        }
      }

    } catch (error) {
      result.errors.push({
        type: 'semantico',
        message: `Error crítico del compilador: ${error}`,
        line: 1,
        column: 1,
        position: 0,
        severity: 'error'
      });
    }

    return result;
  }

  private performLexicalAnalysis(): { tokens: LexicalToken[], errors: LexicalError[] } {
    return this.lexicalAnalyzer.analyze();
  }

  private performSyntaxAnalysis(tokens: LexicalToken[]): { errors: SyntaxError[], parseTree: ParseNode[] } {
    this.syntaxAnalyzer = new SyntaxAnalyzer(tokens, this.language);
    return this.syntaxAnalyzer.analyze();
  }

  private performSemanticAnalysis(
    tokens: LexicalToken[], 
    parseTree: ParseNode[]
  ): { errors: SemanticError[], symbolTable: SymbolTableEntry[] } {
    this.semanticAnalyzer = new SemanticAnalyzer(tokens, parseTree, this.language);
    return this.semanticAnalyzer.analyze();
  }

  private shouldContinueWithErrors(errors: LexicalError[]): boolean {
    // Continuar solo si no hay muchos errores críticos
    return errors.length < 5;
  }

  private convertLexicalErrors(errors: LexicalError[]): CompilerError[] {
    return errors.map(error => ({
      type: 'lexico' as const,
      message: error.message,
      line: error.line,
      column: error.column,
      position: error.position,
      severity: 'error' as const,
      context: `Token: ${error.token}`
    }));
  }

  private convertSyntaxErrors(errors: SyntaxError[]): CompilerError[] {
    return errors.map(error => ({
      type: 'sintactico' as const,
      message: error.message,
      line: error.line,
      column: error.column,
      position: error.position,
      severity: error.severity,
      context: error.expected ? `Esperado: ${error.expected}, Encontrado: ${error.found}` : undefined
    }));
  }

  private convertSemanticErrors(errors: SemanticError[]): CompilerError[] {
    return errors.map(error => ({
      type: 'semantico' as const,
      message: error.message,
      line: error.line,
      column: error.column,
      position: error.position,
      severity: error.severity,
      context: error.context
    }));
  }

  private simulateExecution(analysisResult: CompilerAnalysisResult): ExecutionResult {
    const executionResult: ExecutionResult = {
      success: true,
      output: '',
      errors: [],
      executedCommands: []
    };

    try {
      const output = this.executeByLanguage(analysisResult);
      executionResult.output = output;
      executionResult.success = true;
    } catch (error) {
      executionResult.success = false;
      executionResult.errors.push(`Error de ejecución: ${error}`);
    }

    return executionResult;
  }

  private executeByLanguage(analysisResult: CompilerAnalysisResult): string {
    switch (this.language) {
      case 'javascript':
        return this.executeJavaScript(analysisResult);
      case 'python':
        return this.executePython(analysisResult);
      case 'c++':
        return this.executeCpp(analysisResult);
      case 'html':
        return this.executeHtml(analysisResult);
      case 'pascal':
        return this.executePascal(analysisResult);
      case 'pl/sql':
      case 't-sql':
        return this.executeSql(analysisResult);
      default:
        return '✅ Código analizado correctamente - Ejecución simulada';
    }
  }

  private executeJavaScript(analysisResult: CompilerAnalysisResult): string {
    let output = '🟨 Ejecución de JavaScript:\n';
    const executedCommands: string[] = [];

    // Buscar console.log
    for (let i = 0; i < analysisResult.tokens.length - 1; i++) {
      const token = analysisResult.tokens[i];
      const nextToken = analysisResult.tokens[i + 1];
      
      if (token.value === 'console' && 
          i + 2 < analysisResult.tokens.length && 
          analysisResult.tokens[i + 1].value === '.' && 
          analysisResult.tokens[i + 2].value === 'log') {
        
        const logContent = this.extractFunctionCallContent(analysisResult.tokens, i + 3);
        output += `📄 Console: ${logContent}\n`;
        executedCommands.push(`console.log(${logContent})`);
      }
    }

    // Buscar declaraciones de variables
    const variables = analysisResult.symbolTable.filter(s => s.type === 'variable');
    if (variables.length > 0) {
      output += `📊 Variables declaradas: ${variables.map(v => `${v.name}: ${v.dataType}`).join(', ')}\n`;
    }

    // Buscar funciones
    const functions = analysisResult.symbolTable.filter(s => s.type === 'function');
    if (functions.length > 0) {
      output += `🔧 Funciones definidas: ${functions.map(f => f.name).join(', ')}\n`;
    }

    return output || '✅ Código JavaScript analizado - Sin salida de consola';
  }

  private executePython(analysisResult: CompilerAnalysisResult): string {
    let output = '🐍 Ejecución de Python:\n';
    const executedCommands: string[] = [];

    // Buscar print statements
    for (let i = 0; i < analysisResult.tokens.length; i++) {
      const token = analysisResult.tokens[i];
      
      if (token.value === 'print' && 
          i + 1 < analysisResult.tokens.length && 
          analysisResult.tokens[i + 1].value === '(') {
        
        const printContent = this.extractFunctionCallContent(analysisResult.tokens, i + 1);
        output += `📄 Print: ${printContent}\n`;
        executedCommands.push(`print(${printContent})`);
      }
    }

    // Buscar definiciones de funciones
    const functions = analysisResult.symbolTable.filter(s => s.type === 'function');
    if (functions.length > 0) {
      output += `🔧 Funciones definidas: ${functions.map(f => f.name).join(', ')}\n`;
    }

    // Buscar imports
    let hasImports = false;
    for (const token of analysisResult.tokens) {
      if (token.value === 'import' || token.value === 'from') {
        hasImports = true;
        break;
      }
    }
    
    if (hasImports) {
      output += '📦 Módulos importados detectados\n';
    }

    return output || '✅ Código Python analizado - Sin declaraciones print';
  }

  private executeCpp(analysisResult: CompilerAnalysisResult): string {
    let output = '⚙️ Ejecución de C++:\n';

    // Verificar función main
    const mainFunction = analysisResult.symbolTable.find(s => s.name === 'main');
    if (mainFunction) {
      output += '🎯 Función main encontrada\n';
    }

    // Buscar cout statements
    for (let i = 0; i < analysisResult.tokens.length - 1; i++) {
      const token = analysisResult.tokens[i];
      
      if (token.value === 'cout' && 
          i + 1 < analysisResult.tokens.length && 
          analysisResult.tokens[i + 1].value === '<<') {
        
        const coutContent = this.extractCoutContent(analysisResult.tokens, i + 2);
        output += `📄 Output: ${coutContent}\n`;
      }
    }

    // Buscar includes
    const includes = analysisResult.tokens.filter(t => 
      t.type === 'DIRECTIVA_PREPROCESADOR' && t.value.includes('#include')
    );
    
    if (includes.length > 0) {
      output += `📚 Includes: ${includes.length} archivos incluidos\n`;
    }

    // Buscar declaraciones de variables
    const variables = analysisResult.symbolTable.filter(s => s.type === 'variable');
    if (variables.length > 0) {
      output += `📊 Variables: ${variables.map(v => `${v.dataType} ${v.name}`).join(', ')}\n`;
    }

    return output || '✅ Programa C++ analizado - Compilación simulada exitosa';
  }

  private executeHtml(analysisResult: CompilerAnalysisResult): string {
    let output = '🌐 Procesamiento de HTML:\n';

    // Buscar etiquetas principales
    const htmlTags = ['html', 'head', 'body', 'title'];
    const foundTags: string[] = [];
    
    for (const tag of htmlTags) {
      if (analysisResult.tokens.some(t => t.value.toLowerCase() === tag)) {
        foundTags.push(tag);
      }
    }

    if (foundTags.length > 0) {
      output += `🏗️ Estructura HTML: <${foundTags.join('>, <')}>\n`;
    }

    // Contar elementos
    const divs = analysisResult.tokens.filter(t => t.value.toLowerCase() === 'div').length;
    const paragraphs = analysisResult.tokens.filter(t => t.value.toLowerCase() === 'p').length;
    const links = analysisResult.tokens.filter(t => t.value.toLowerCase() === 'a').length;

    if (divs > 0) output += `📦 Divisiones: ${divs}\n`;
    if (paragraphs > 0) output += `📝 Párrafos: ${paragraphs}\n`;
    if (links > 0) output += `🔗 Enlaces: ${links}\n`;

    return output || '✅ Documento HTML procesado - Estructura básica';
  }

  private executePascal(analysisResult: CompilerAnalysisResult): string {
    let output = '📐 Ejecución de Pascal:\n';

    // Verificar estructura de programa
    const hasProgram = analysisResult.tokens.some(t => t.value.toLowerCase() === 'program');
    if (hasProgram) {
      output += '🎯 Programa Pascal válido encontrado\n';
    }

    // Buscar procedimientos y funciones
    const procedures = analysisResult.symbolTable.filter(s => s.type === 'function');
    if (procedures.length > 0) {
      output += `🔧 Procedimientos/Funciones: ${procedures.map(p => p.name).join(', ')}\n`;
    }

    // Verificar BEGIN/END
    const beginCount = analysisResult.tokens.filter(t => t.value.toLowerCase() === 'begin').length;
    const endCount = analysisResult.tokens.filter(t => t.value.toLowerCase() === 'end').length;
    
    output += `📊 Bloques BEGIN/END: ${beginCount}/${endCount}\n`;

    // Buscar declaraciones de variables
    const variables = analysisResult.symbolTable.filter(s => s.type === 'variable');
    if (variables.length > 0) {
      output += `📊 Variables: ${variables.map(v => `${v.name}: ${v.dataType}`).join(', ')}\n`;
    }

    return output || '✅ Programa Pascal analizado - Estructura válida';
  }

  private executeSql(analysisResult: CompilerAnalysisResult): string {
    let output = '🗄️ Ejecución de SQL:\n';
    const executedCommands: string[] = [];

    // Buscar comandos SQL
    const sqlCommands = ['create', 'select', 'insert', 'update', 'delete', 'alter', 'drop'];
    
    for (let i = 0; i < analysisResult.tokens.length; i++) {
      const token = analysisResult.tokens[i];
      
      if (sqlCommands.includes(token.value.toLowerCase())) {
        const command = token.value.toUpperCase();
        
        switch (command) {
          case 'CREATE':
            const createResult = this.processCreateCommand(analysisResult.tokens, i);
            output += createResult.output;
            executedCommands.push(createResult.command);
            break;
          case 'SELECT':
            const selectResult = this.processSelectCommand(analysisResult.tokens, i);
            output += selectResult.output;
            executedCommands.push(selectResult.command);
            break;
          case 'INSERT':
            output += '📝 Comando INSERT ejecutado - Registro insertado\n';
            executedCommands.push('INSERT');
            break;
          case 'UPDATE':
            output += '✏️ Comando UPDATE ejecutado - Registros actualizados\n';
            executedCommands.push('UPDATE');
            break;
          case 'DELETE':
            output += '🗑️ Comando DELETE ejecutado - Registros eliminados\n';
            executedCommands.push('DELETE');
            break;
        }
      }
    }

    return output || '✅ Comandos SQL analizados - Sintaxis válida';
  }

  private processCreateCommand(tokens: LexicalToken[], startIndex: number): { output: string, command: string } {
    // Buscar CREATE TABLE
    if (startIndex + 2 < tokens.length && 
        tokens[startIndex + 1].value.toLowerCase() === 'table') {
      const tableName = tokens[startIndex + 2].value;
      return {
        output: `🆕 Tabla '${tableName}' creada exitosamente\n`,
        command: `CREATE TABLE ${tableName}`
      };
    }
    
    return {
      output: '🆕 Comando CREATE ejecutado\n',
      command: 'CREATE'
    };
  }

  private processSelectCommand(tokens: LexicalToken[], startIndex: number): { output: string, command: string } {
    // Buscar FROM para obtener tabla
    let tableName = '';
    for (let i = startIndex; i < tokens.length; i++) {
      if (tokens[i].value.toLowerCase() === 'from' && i + 1 < tokens.length) {
        tableName = tokens[i + 1].value;
        break;
      }
    }
    
    if (tableName) {
      return {
        output: `🔍 Consulta ejecutada en tabla '${tableName}' - Datos recuperados\n`,
        command: `SELECT FROM ${tableName}`
      };
    }
    
    return {
      output: '🔍 Consulta SELECT ejecutada - Datos recuperados\n',
      command: 'SELECT'
    };
  }

  private extractFunctionCallContent(tokens: LexicalToken[], startIndex: number): string {
    let content = '';
    let depth = 0;
    
    for (let i = startIndex; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.value === '(') {
        depth++;
        if (depth === 1) continue; // Skip opening parenthesis
      } else if (token.value === ')') {
        depth--;
        if (depth === 0) break; // End of function call
      }
      
      if (depth > 0) {
        if (token.category === 'CADENA') {
          content += token.value.replace(/['"]/g, ''); // Remove quotes
        } else {
          content += token.value;
        }
      }
    }
    
    return content || '[contenido no determinado]';
  }

  private extractCoutContent(tokens: LexicalToken[], startIndex: number): string {
    let content = '';
    
    for (let i = startIndex; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.value === ';') break; // End of statement
      if (token.value === '<<') continue; // Skip stream operator
      
      if (token.category === 'CADENA') {
        content += token.value.replace(/['"]/g, ''); // Remove quotes
      } else if (token.value === 'endl') {
        content += '\\n';
      } else {
        content += token.value;
      }
    }
    
    return content || '[contenido no determinado]';
  }
}

// Función de conveniencia para analizar código
export function analyzeCodeEnhanced(code: string, language: string): CompilerAnalysisResult {
  const analyzer = new CompilerAnalyzer(code, language);
  return analyzer.analyze();
} 