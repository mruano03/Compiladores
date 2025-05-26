// Detector inteligente de lenguajes de programación
// Analiza el contenido del código para determinar el lenguaje

interface LanguageSignature {
  keywords: string[];
  patterns: RegExp[];
  fileExtensions: string[];
  weight: number;
  exclusivePatterns?: RegExp[]; // Patrones que son únicos de este lenguaje
}

const LANGUAGE_SIGNATURES: { [key: string]: LanguageSignature } = {
  javascript: {
    keywords: ['function', 'var', 'let', 'const', 'console', 'document', 'window', '=>', 'import', 'export', 'require'],
    patterns: [
      /console\.log\s*\(/i,
      /function\s+\w+\s*\(/,
      /=>\s*{?/,
      /require\s*\(/,
      /import\s+.*from/,
      /export\s+(default|const|function)/,
      /document\./,
      /window\./,
      /\$\(/  // jQuery
    ],
    fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    weight: 1,
    exclusivePatterns: [
      /console\.(log|error|warn|info)\s*\(/,
      /document\.getElementById/,
      /window\.location/
    ]
  },
  
  python: {
    keywords: ['def', 'import', 'from', 'print', 'if', 'elif', 'else', 'for', 'while', 'class', 'self', 'pass', 'lambda'],
    patterns: [
      /def\s+\w+\s*\(/,
      /print\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /#.*$/m,
      /if\s+__name__\s*==\s*['""]__main__['""]:/,
      /:\s*$/m, // Importante en Python
      /^\s{4}|\t/m // Indentación
    ],
    fileExtensions: ['py', 'pyw'],
    weight: 1,
    exclusivePatterns: [
      /def\s+\w+\s*\([^)]*\)\s*:/,
      /if\s+__name__\s*==\s*['"]__main__['"]:/,
      /print\s*\(/
    ]
  },
  
  'C++': {
    keywords: ['#include', 'int', 'main', 'cout', 'cin', 'std', 'namespace', 'class', 'public', 'private', 'using'],
    patterns: [
      /#include\s*<.*>/,
      /int\s+main\s*\(/,
      /std::/,
      /cout\s*<<|cin\s*>>/,
      /namespace\s+\w+/,
      /class\s+\w+/,
      /using\s+namespace/,
      /#include\s*[<"]/
    ],
    fileExtensions: ['cpp', 'cxx', 'cc', 'c', 'h', 'hpp'],
    weight: 1,
    exclusivePatterns: [
      /#include\s*<iostream>/,
      /std::cout\s*<</,
      /std::cin\s*>>/
    ]
  },
  
  html: {
    keywords: ['<html>', '<head>', '<body>', '<div>', '<p>', '<a>', '<img>', '<!DOCTYPE', '<script>', '<style>'],
    patterns: [
      /<!\s*DOCTYPE\s+html>/i,
      /<html[^>]*>/i,
      /<head[^>]*>/i,
      /<body[^>]*>/i,
      /<\/\w+>/,
      /<\w+[^>]*>/,
      /<script[^>]*>/i,
      /<style[^>]*>/i
    ],
    fileExtensions: ['html', 'htm'],
    weight: 1,
    exclusivePatterns: [
      /<!DOCTYPE\s+html>/i,
      /<html[^>]*>/i,
      /<\/html>/i
    ]
  },
  
  pascal: {
    keywords: ['program', 'begin', 'end', 'var', 'const', 'procedure', 'function', 'if', 'then', 'else', 'while', 'do'],
    patterns: [
      /program\s+\w+\s*;/i,
      /begin\s*$/mi,
      /end\s*[;.]/i,
      /procedure\s+\w+/i,
      /function\s+\w+.*:/i,
      /if\s+.*\s+then/i,
      /var\s*$/mi,
      /writeln\s*\(/i
    ],
    fileExtensions: ['pas', 'pascal'],
    weight: 1,
    exclusivePatterns: [
      /program\s+\w+\s*;/i,
      /writeln\s*\(/i,
      /begin\s*$/mi
    ]
  },
  
  'PL/SQL': {
    keywords: ['DECLARE', 'BEGIN', 'END', 'PROCEDURE', 'FUNCTION', 'CURSOR', 'EXCEPTION', 'IS', 'AS', 'DBMS_OUTPUT'],
    patterns: [
      /DECLARE\s*$/mi,
      /BEGIN\s*$/mi,
      /END\s*[;\/]/i,
      /PROCEDURE\s+\w+/i,
      /FUNCTION\s+\w+/i,
      /CURSOR\s+\w+/i,
      /EXCEPTION\s*$/mi,
      /DBMS_OUTPUT\.PUT_LINE/i,
      /\w+%ROWTYPE/i,
      /\w+%TYPE/i
    ],
    fileExtensions: ['plsql', 'pls'],
    weight: 1,
    exclusivePatterns: [
      /DBMS_OUTPUT\.PUT_LINE/i,
      /\w+%ROWTYPE/i,
      /\w+%TYPE/i,
      /DECLARE\s*$/mi
    ]
  },
  
  'T-SQL': {
    keywords: ['GO', 'PRINT', 'TRY', 'CATCH', 'TRAN', 'IDENTITY', 'NVARCHAR', 'EXEC', 'SP_', 'RAISERROR'],
    patterns: [
      /GO\s*$/mi,
      /PRINT\s+/i,
      /BEGIN\s+TRY/i,
      /BEGIN\s+CATCH/i,
      /IDENTITY\s*\(/i,
      /NVARCHAR\s*\(/i,
      /EXEC\s+/i,
      /SP_\w+/i,
      /RAISERROR\s*\(/i,
      /@@\w+/i
    ],
    fileExtensions: ['tsql', 'sql'],
    weight: 1,
    exclusivePatterns: [
      /GO\s*$/mi,
      /@@\w+/i,
      /RAISERROR\s*\(/i,
      /BEGIN\s+TRY/i
    ]
  },
  
  sql: {
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'JOIN', 'ORDER', 'BY'],
    patterns: [
      /SELECT\s+.*\s+FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*\s+SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i,
      /ALTER\s+TABLE/i,
      /DROP\s+TABLE/i,
      /JOIN\s+/i,
      /ORDER\s+BY/i,
      /GROUP\s+BY/i
    ],
    fileExtensions: ['sql'],
    weight: 0.8, // Menor peso porque es más genérico
    exclusivePatterns: [
      /SELECT\s+.*\s+FROM/i,
      /CREATE\s+TABLE/i
    ]
  }
};

export class LanguageDetector {
  
  /**
   * Detecta el lenguaje basándose en el contenido del código
   */
  static detectByContent(code: string): string {
    const scores: { [key: string]: number } = {};
    
    // Inicializar scores
    Object.keys(LANGUAGE_SIGNATURES).forEach(lang => {
      scores[lang] = 0;
    });
    
    // Limpiar el código para mejor análisis
    const cleanCode = code.trim();
    if (!cleanCode) return 'javascript';
    
    // Verificar si el código parece ser simplemente texto sin estructura
    const isPlainText = /^[a-zA-Z\s]+$/.test(cleanCode) && 
                       !cleanCode.includes('(') && 
                       !cleanCode.includes('{') && 
                       !cleanCode.includes(';') && 
                       !cleanCode.includes('=') &&
                       !cleanCode.includes(':') &&
                       cleanCode.split(/\s+/).every(word => word.length < 20);
    
    if (isPlainText) {
      // Si parece texto plano, no detectar ningún lenguaje específico
      return 'unknown';
    }
    
    // Analizar cada lenguaje
    Object.entries(LANGUAGE_SIGNATURES).forEach(([language, signature]) => {
      let score = 0;
      
      // Verificar patrones exclusivos primero (mayor peso)
      if (signature.exclusivePatterns) {
        signature.exclusivePatterns.forEach(pattern => {
          const matches = cleanCode.match(pattern);
          if (matches) {
            score += matches.length * 10; // Muy alto peso para patrones exclusivos
          }
        });
      }
      
      // Verificar palabras clave
      signature.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = cleanCode.match(regex);
        if (matches) {
          score += matches.length * 3; // Peso medio para palabras clave
        }
      });
      
      // Verificar patrones generales
      signature.patterns.forEach(pattern => {
        const matches = cleanCode.match(pattern);
        if (matches) {
          score += matches.length * 2; // Peso menor para patrones generales
        }
      });
      
      scores[language] = score * signature.weight;
    });
    
    // Encontrar el lenguaje con mayor score
    const sortedLanguages = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    // Requerir un score mínimo para considerar la detección válida
    if (sortedLanguages.length === 0 || sortedLanguages[0][1] < 2) {
      return 'unknown'; // En lugar de 'javascript' por defecto
    }
    
    // Si hay empate entre SQL, PL/SQL y T-SQL, usar criterios específicos
    const topScore = sortedLanguages[0][1];
    const topLanguages = sortedLanguages.filter(([,score]) => score === topScore);
    
    if (topLanguages.length > 1) {
      const sqlLanguages = topLanguages.filter(([lang]) => 
        lang.toLowerCase().includes('sql'));
      
      if (sqlLanguages.length > 0) {
        // Preferir el más específico
        if (sqlLanguages.find(([lang]) => lang === 'PL/SQL')) return 'PL/SQL';
        if (sqlLanguages.find(([lang]) => lang === 'T-SQL')) return 'T-SQL';
        return 'sql';
      }
    }
    
    return sortedLanguages[0][0];
  }
  
  /**
   * Detecta el lenguaje basándose en la extensión del archivo
   */
  static detectByExtension(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    for (const [language, signature] of Object.entries(LANGUAGE_SIGNATURES)) {
      if (signature.fileExtensions.includes(extension)) {
        return language;
      }
    }
    
    return 'javascript'; // Por defecto
  }
  
  /**
   * Detecta el lenguaje combinando contenido y extensión
   */
  static detect(code: string, fileName?: string): string {
    let contentLanguage = this.detectByContent(code);
    
    if (fileName) {
      const extensionLanguage = this.detectByExtension(fileName);
      
      // Si el contenido es desconocido, usar la extensión si es específica
      if (contentLanguage === 'unknown' && extensionLanguage !== 'javascript') {
        return extensionLanguage;
      }
      
      // Si la extensión es específica y el contenido no es muy claro, usar la extensión
      const contentScore = this.getConfidenceScore(code, contentLanguage);
      if (contentScore < 15 && extensionLanguage !== 'javascript') {
        return extensionLanguage;
      }
      
      // Si hay conflicto entre sql/plsql/tsql, usar la extensión
      if (['sql', 'PL/SQL', 'T-SQL'].includes(contentLanguage) && 
          ['sql', 'PL/SQL', 'T-SQL'].includes(extensionLanguage)) {
        return extensionLanguage;
      }
    }
    
    // Si no se pudo detectar un lenguaje válido, devolver 'unknown'
    if (contentLanguage === 'unknown') {
      return 'unknown';
    }
    
    return contentLanguage;
  }
  
  /**
   * Obtiene un score de confianza para la detección
   */
  private static getConfidenceScore(code: string, language: string): number {
    const signature = LANGUAGE_SIGNATURES[language];
    if (!signature) return 0;
    
    let score = 0;
    
    signature.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = code.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    signature.patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        score += matches.length * 2;
      }
    });
    
    return score;
  }
  
  /**
   * Obtiene información detallada sobre la detección
   */
  static getDetectionInfo(code: string, fileName?: string): {
    detectedLanguage: string;
    confidence: number;
    alternatives: Array<{ language: string; score: number }>;
  } {
    const scores: { [key: string]: number } = {};
    
    // Calcular scores para todos los lenguajes
    Object.entries(LANGUAGE_SIGNATURES).forEach(([language, signature]) => {
      scores[language] = this.getConfidenceScore(code, language);
    });
    
    const detectedLanguage = this.detect(code, fileName);
    const confidence = scores[detectedLanguage] || 0;
    
    const alternatives = Object.entries(scores)
      .filter(([lang]) => lang !== detectedLanguage)
      .map(([language, score]) => ({ language, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    return {
      detectedLanguage,
      confidence,
      alternatives
    };
  }
}

// Función de conveniencia
export function detectLanguage(code: string, fileName?: string): string {
  return LanguageDetector.detect(code, fileName);
}

export function getLanguageInfo(code: string, fileName?: string) {
  return LanguageDetector.getDetectionInfo(code, fileName);
}