// Detector inteligente de lenguajes de programación
// Analiza el contenido del código para determinar el lenguaje

interface LanguageSignature {
  keywords: string[];
  patterns: RegExp[];
  fileExtensions: string[];
  weight: number;
}

const LANGUAGE_SIGNATURES: { [key: string]: LanguageSignature } = {
  javascript: {
    keywords: ['function', 'var', 'let', 'const', 'console', 'document', 'window', '=>', 'import', 'export'],
    patterns: [
      /console\.log\(/,
      /function\s+\w+\s*\(/,
      /=>\s*{/,
      /require\(/,
      /import\s+.*from/,
      /export\s+(default|const|function)/
    ],
    fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    weight: 1
  },
  
  python: {
    keywords: ['def', 'import', 'from', 'print', 'if', 'elif', 'else', 'for', 'while', 'class', 'self'],
    patterns: [
      /def\s+\w+\s*\(/,
      /print\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /#.*$/m,
      /if\s+__name__\s*==\s*['""]__main__['""]:/
    ],
    fileExtensions: ['py', 'pyw'],
    weight: 1
  },
  
  'C++': {
    keywords: ['#include', 'int', 'main', 'cout', 'cin', 'std', 'namespace', 'class', 'public', 'private'],
    patterns: [
      /#include\s*<.*>/,
      /int\s+main\s*\(/,
      /std::/,
      /cout\s*<<|cin\s*>>/,
      /namespace\s+\w+/,
      /class\s+\w+/
    ],
    fileExtensions: ['cpp', 'cxx', 'cc', 'c', 'h', 'hpp'],
    weight: 1
  },
  
  html: {
    keywords: ['<html>', '<head>', '<body>', '<div>', '<p>', '<a>', '<img>', '<!DOCTYPE'],
    patterns: [
      /<!\s*DOCTYPE\s+html>/i,
      /<html.*?>/i,
      /<head.*?>/i,
      /<body.*?>/i,
      /<\/\w+>/,
      /<\w+.*?>/
    ],
    fileExtensions: ['html', 'htm'],
    weight: 1
  },
  
  pascal: {
    keywords: ['program', 'begin', 'end', 'var', 'const', 'procedure', 'function', 'if', 'then', 'else'],
    patterns: [
      /program\s+\w+;/,
      /begin\s*$/m,
      /end\s*[;.]/,
      /procedure\s+\w+/,
      /function\s+\w+.*:/,
      /if\s+.*\s+then/
    ],
    fileExtensions: ['pas', 'pascal'],
    weight: 1
  },
  
  sql: {
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'JOIN'],
    patterns: [
      /SELECT\s+.*\s+FROM/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*\s+SET/i,
      /DELETE\s+FROM/i,
      /CREATE\s+TABLE/i,
      /ALTER\s+TABLE/i,
      /DROP\s+TABLE/i,
      /JOIN\s+/i
    ],
    fileExtensions: ['sql'],
    weight: 1
  },
  
  'PL/SQL': {
    keywords: ['DECLARE', 'BEGIN', 'END', 'PROCEDURE', 'FUNCTION', 'CURSOR', 'EXCEPTION'],
    patterns: [
      /DECLARE\s*$/m,
      /BEGIN\s*$/m,
      /END\s*[;/]/,
      /PROCEDURE\s+\w+/i,
      /FUNCTION\s+\w+/i
    ],
    fileExtensions: ['plsql'],
    weight: 1
  },
  
  'T-SQL': {
    keywords: ['GO', 'PRINT', 'TRY', 'CATCH', 'TRAN', 'IDENTITY', 'NVARCHAR'],
    patterns: [
      /GO\s*$/m,
      /PRINT\s+/i,
      /TRY\s*{/i,
      /CATCH\s*{/i,
      /IDENTITY\s*\(/i
    ],
    fileExtensions: ['tsql'],
    weight: 1
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
    
    // Analizar cada lenguaje
    Object.entries(LANGUAGE_SIGNATURES).forEach(([language, signature]) => {
      let score = 0;
      
      // Verificar palabras clave
      signature.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = code.match(regex);
        if (matches) {
          score += matches.length * 2; // Peso mayor para palabras clave
        }
      });
      
      // Verificar patrones
      signature.patterns.forEach(pattern => {
        const matches = code.match(pattern);
        if (matches) {
          score += matches.length * 3; // Peso mayor para patrones específicos
        }
      });
      
      scores[language] = score * signature.weight;
    });
    
    // Encontrar el lenguaje con mayor score
    const detectedLanguage = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];
    
    // Si no hay suficiente evidencia, devolver JavaScript por defecto
    return scores[detectedLanguage] > 0 ? detectedLanguage : 'javascript';
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
      
      // Si la extensión es específica y el contenido no es muy claro, usar la extensión
      const contentScore = this.getConfidenceScore(code, contentLanguage);
      if (contentScore < 10 && extensionLanguage !== 'javascript') {
        return extensionLanguage;
      }
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