export const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'html', label: 'HTML' },
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'pascal', label: 'Pascal' },
    { value: 'plsql', label: 'PL/SQL' },
    { value: 'tsql', label: 'T-SQL' },
] as const;
  
export const editorThemes = [
    { value: 'vs-dark', label: 'Dark' },
    { value: 'vs-light', label: 'Light' },
    { value: 'hc-black', label: 'High Contrast Dark' },
] as const;
  
export const defaultCode = `
console.log("Hola mundo desde JavaScript!");

function suma(a, b) {
  return a + b;
}

`;
