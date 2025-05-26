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
  
  export const defaultCode = `// Ejemplo de análisis multi-lenguaje
  // Cambia el lenguaje desde el menú superior para probar diferentes sintaxis
  
  console.log("Hola mundo desde JavaScript!");
  
  function suma(a, b) {
    return a + b;
  }
  
  let resultado = suma(5, 3);
  console.log("El resultado es:", resultado);
  
  /* 
  Para probar otros lenguajes, aquí tienes ejemplos:
  
  Python:
  def saludar(nombre):
      print(f"Hola {nombre}!")
  
  saludar("Mundo")
  
  C++:
  #include <iostream>
  using namespace std;
  
  int main() {
      cout << "Hola Mundo!" << endl;
      return 0;
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
  