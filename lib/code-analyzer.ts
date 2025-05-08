interface CodeStats {
    lines: number;
    chars: number;
    words: number;
    functions: number;
    complexity: number; // 0-100 score
    structure: Array<{
      type: string;
      name: string;
      line: number;
      params?: string;
      description?: string;
    }>;
  }
  
  export function getCodeStats(code: string): CodeStats {
    // This is a simplified version - in a real app, you'd use a proper parser
    const lines = code.split('\n').length;
    const chars = code.length;
    const words = code.split(/\s+/).filter(Boolean).length;
    
    // Count functions (simplified)
    const functionMatches = code.match(/function\s+(\w+)\s*\(([^)]*)\)/g) || [];
    const arrowFunctionMatches = code.match(/const\s+(\w+)\s*=\s*(\([^)]*\)|[^=]+)=>/g) || [];
    const functionCount = functionMatches.length + arrowFunctionMatches.length;
    
    // Calculate complexity (simplified)
    const ifStatements = (code.match(/if\s*\(/g) || []).length;
    const forLoops = (code.match(/for\s*\(/g) || []).length;
    const whileLoops = (code.match(/while\s*\(/g) || []).length;
    const ternaryOps = (code.match(/\?\s*[^:]+\s*:/g) || []).length;
    
    // Complexity formula - just an example
    const complexity = Math.min(
      100,
      10 * (ifStatements + forLoops * 1.5 + whileLoops * 1.5 + ternaryOps * 0.8)
    );
    
    // Structure analysis (simplified)
    const structure: CodeStats['structure'] = [];
    
    // Function detection
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    let funcMatch;
    let lineCount = 1;
    let codeLines = code.split('\n');
    
    for (let i = 0; i < codeLines.length; i++) {
      const line = codeLines[i];
      if ((funcMatch = /function\s+(\w+)\s*\(([^)]*)\)/.exec(line)) !== null) {
        structure.push({
          type: 'Function',
          name: funcMatch[1],
          params: funcMatch[2],
          line: i + 1,
        });
      }
      
      // Class detection
      const classMatch = /class\s+(\w+)/.exec(line);
      if (classMatch) {
        structure.push({
          type: 'Class',
          name: classMatch[1],
          line: i + 1,
        });
      }
      
      // Method detection (simplified)
      const methodMatch = /(\w+)\s*\(([^)]*)\)\s*{/.exec(line);
      if (methodMatch && !/function|if|for|while/.test(line)) {
        structure.push({
          type: 'Method',
          name: methodMatch[1],
          params: methodMatch[2],
          line: i + 1,
        });
      }
    }
    
    return {
      lines,
      chars,
      words,
      functions: functionCount,
      complexity,
      structure,
    };
  }