// API Compiler Analyzer - Conecta con el backend en Go
export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
  position: number;
}

export interface ParseNode {
  type: string;
  value: string;
  children: ParseNode[];
  line: number;
  column: number;
}

export interface Symbol {
  name: string;
  type: string;
  value: string;
  scope: string;
  line: number;
  column: number;
  category: string;
}

export interface CompilerError {
  type: 'lexico' | 'sintactico' | 'semantico';
  message: string;
  line: number;
  column: number;
  position: number;
  severity: 'error' | 'warning' | 'info';
}

export interface AnalysisPhase {
  completed: boolean;
  tokensFound?: number;
  nodesGenerated?: number;
  symbolsFound?: number;
  errorsFound: number;
}

export interface AnalysisPhases {
  lexical: AnalysisPhase;
  syntax: AnalysisPhase;
  semantic: AnalysisPhase;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface AnalyzeResponse {
  language: string;
  tokens: Token[];
  parseTree: ParseNode[];
  symbolTable: Symbol[];
  errors: CompilerError[];
  canExecute: boolean;
  analysisPhases: AnalysisPhases;
  executionResult?: ExecutionResult;
  processingTime: string;
}

export interface AnalyzeRequest {
  code: string;
  language: string;
}

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Mapeo de nombres de lenguajes del frontend al backend
function mapLanguageToBackend(frontendLanguage: string): string {
  const languageMap: { [key: string]: string } = {
    'C++': 'cpp',
    'c++': 'cpp',
    'cpp': 'cpp',
    'javascript': 'javascript',
    'js': 'javascript',
    'python': 'python',
    'py': 'python',
    'html': 'html',
    'pascal': 'pascal',
    'PL/SQL': 'plsql',
    'plsql': 'plsql',
    'T-SQL': 'tsql',
    'tsql': 'tsql',
    'sql': 'tsql', // Por defecto usar T-SQL para SQL genérico
    'auto': '',
    '': ''
  };

  return languageMap[frontendLanguage] || frontendLanguage.toLowerCase();
}

export class APICompilerAnalyzer {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  async analyzeCode(code: string, language: string = 'auto'): Promise<AnalyzeResponse> {
    try {
      // Mapear el lenguaje del frontend al formato del backend
      const backendLanguage = mapLanguageToBackend(language);
      
      const request: AnalyzeRequest = {
        code: code, // No usar trim() para preservar indentación
        language: backendLanguage
      };

      const response = await fetch(`${this.baseUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const result: AnalyzeResponse = await response.json();
      return result;

    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      
      // Retornar un resultado de error en caso de fallo de conexión
      return {
        language: language || 'unknown',
        tokens: [],
        parseTree: [],
        symbolTable: [],
        errors: [{
          type: 'semantico',
          message: `Error de conexión con el servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          line: 1,
          column: 1,
          position: 0,
          severity: 'error'
        }],
        canExecute: false,
        analysisPhases: {
          lexical: { completed: false, errorsFound: 1 },
          syntax: { completed: false, errorsFound: 0 },
          semantic: { completed: false, errorsFound: 1 }
        },
        processingTime: '0ms'
      };
    }
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`);
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`No se puede conectar con el servidor: ${error}`);
    }
  }
}

// Instancia global del analizador
const apiAnalyzer = new APICompilerAnalyzer();

// Función de conveniencia para mantener compatibilidad con el código existente
export async function analyzeCodeWithAPI(code: string, language: string = 'auto'): Promise<AnalyzeResponse> {
  return apiAnalyzer.analyzeCode(code, language);
}

// Función para verificar el estado del servidor
export async function checkServerHealth(): Promise<boolean> {
  try {
    await apiAnalyzer.checkHealth();
    return true;
  } catch {
    return false;
  }
}

export default apiAnalyzer; 