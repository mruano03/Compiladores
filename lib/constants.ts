export const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'html', label: 'HTML' },
    { value: 'python', label: 'Python' },
    { value: 'C++', label: 'C++' },
    { value: 'Pascal', label: 'Pascal' },
    { value: 'PL/SQL', label: 'PL/SQL' },
    { value: 'T-SQL', label: 'T-SQL' },
  ];
  
  export const editorThemes = [
    
    { value: 'hc-black', label: 'High Contrast Dark' },
  ];
  
  export const defaultCode = `// Bienvenido al editor de codigo
  // Intenta escribir o pegar tu codigo aqui para ver el analisis
  
  function calcularFactorial(n) {
    // TODO: Agregar validacion para numeros negativos
    if (n === 0 || n === 1) {
      return 1;
    }
    
    return n * calcularFactorial(n - 1);
  }
  
  // Ejemplo de uso
  console.log(calcularFactorial(5)); // Deberia imprimir: 120
  `;
  