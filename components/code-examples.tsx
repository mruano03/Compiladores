'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, Code2 } from 'lucide-react';

interface CodeExamplesProps {
  onCodeLoad: (code: string, fileName?: string) => void;
  onLanguageChange: (language: string) => void;
}

// Ejemplos de código para cada lenguaje
const codeExamples = {
  javascript: [
    {
      name: 'Hola Mundo',
      fileName: 'hola-mundo.js',
      code: `// Hola Mundo en JavaScript
console.log("¡Hola Mundo desde JavaScript!");

// Variables y funciones
const nombre = "Estudiante";
let edad = 20;

function saludar(nombre, edad) {
    return \`Hola \${nombre}, tienes \${edad} años\`;
}

console.log(saludar(nombre, edad));`
    },
    {
      name: 'Algoritmos Básicos',
      fileName: 'algoritmos.js',
      code: `// Algoritmos básicos en JavaScript

// 1. Factorial
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// 2. Fibonacci
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 3. Ordenamiento burbuja
function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return arr;
}

// Ejemplos de uso
console.log("Factorial de 5:", factorial(5));
console.log("Fibonacci(10):", fibonacci(10));

const numeros = [64, 34, 25, 12, 22, 11, 90];
console.log("Array original:", numeros);
console.log("Array ordenado:", bubbleSort([...numeros]));`
    },
    {
      name: 'Programación Orientada a Objetos',
      fileName: 'poo.js',
      code: `// Programación Orientada a Objetos en JavaScript

class Persona {
    constructor(nombre, edad) {
        this.nombre = nombre;
        this.edad = edad;
    }
    
    saludar() {
        return \`Hola, soy \${this.nombre} y tengo \${this.edad} años\`;
    }
    
    cumplirAnios() {
        this.edad++;
        console.log(\`¡Feliz cumpleaños! Ahora tengo \${this.edad} años\`);
    }
}

class Estudiante extends Persona {
    constructor(nombre, edad, carrera) {
        super(nombre, edad);
        this.carrera = carrera;
        this.materias = [];
    }
    
    agregarMateria(materia) {
        this.materias.push(materia);
        console.log(\`Materia \${materia} agregada\`);
    }
    
    presentarse() {
        return \`\${this.saludar()}, estudio \${this.carrera}\`;
    }
}

// Crear instancias
const estudiante = new Estudiante("Juan", 20, "Ingeniería en Sistemas");
console.log(estudiante.presentarse());

estudiante.agregarMateria("Compiladores");
estudiante.agregarMateria("Algoritmos");
estudiante.cumplirAnios();

console.log("Materias:", estudiante.materias);`
    }
  ],
  python: [
    {
      name: 'Hola Mundo',
      fileName: 'hola_mundo.py',
      code: `# Hola Mundo en Python
print("¡Hola Mundo desde Python!")

# Variables y funciones
nombre = "Estudiante"
edad = 20

def saludar(nombre, edad):
    return f"Hola {nombre}, tienes {edad} años"

print(saludar(nombre, edad))

# Listas y ciclos
numeros = [1, 2, 3, 4, 5]
print("Números:", numeros)

for num in numeros:
    print(f"El cuadrado de {num} es {num**2}")`
    },
    {
      name: 'Algoritmos Básicos',
      fileName: 'algoritmos.py',
      code: `# Algoritmos básicos en Python

def factorial(n):
    """Calcula el factorial de n de forma recursiva"""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def fibonacci(n):
    """Calcula el n-ésimo número de Fibonacci"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def fibonacci_iterativo(n):
    """Versión iterativa más eficiente"""
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def ordenamiento_burbuja(arr):
    """Implementación del algoritmo de ordenamiento burbuja"""
    arr = arr.copy()  # No modificar el original
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

# Ejemplos de uso
print(f"Factorial de 5: {factorial(5)}")
print(f"Fibonacci(10): {fibonacci(10)}")
print(f"Fibonacci iterativo(10): {fibonacci_iterativo(10)}")

numeros = [64, 34, 25, 12, 22, 11, 90]
print(f"Array original: {numeros}")
print(f"Array ordenado: {ordenamiento_burbuja(numeros)}")

# Análisis de complejidad
import time

start = time.time()
resultado = fibonacci(30)
end = time.time()
print(f"Fibonacci(30) = {resultado}")
print(f"Tiempo transcurrido: {end - start:.4f} segundos")`
    },
    {
      name: 'Programación Orientada a Objetos',
      fileName: 'poo.py',
      code: `# Programación Orientada a Objetos en Python

class Persona:
    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad
    
    def saludar(self):
        return f"Hola, soy {self.nombre} y tengo {self.edad} años"
    
    def cumplir_anios(self):
        self.edad += 1
        print(f"¡Feliz cumpleaños! Ahora tengo {self.edad} años")
    
    def __str__(self):
        return f"Persona(nombre='{self.nombre}', edad={self.edad})"

class Estudiante(Persona):
    def __init__(self, nombre, edad, carrera):
        super().__init__(nombre, edad)
        self.carrera = carrera
        self.materias = []
    
    def agregar_materia(self, materia):
        self.materias.append(materia)
        print(f"Materia '{materia}' agregada")
    
    def presentarse(self):
        return f"{self.saludar()}, estudio {self.carrera}"
    
    def __str__(self):
        return f"Estudiante(nombre='{self.nombre}', edad={self.edad}, carrera='{self.carrera}')"

# Crear instancias
estudiante = Estudiante("Ana", 19, "Ingeniería en Sistemas")
print(estudiante.presentarse())

estudiante.agregar_materia("Compiladores")
estudiante.agregar_materia("Algoritmos")
estudiante.agregar_materia("Bases de Datos")

print(f"Materias de {estudiante.nombre}: {estudiante.materias}")
estudiante.cumplir_anios()

# Uso de propiedades y métodos especiales
print(f"Representación: {estudiante}")

# Lista de estudiantes
estudiantes = [
    Estudiante("Carlos", 20, "Ingeniería Civil"),
    Estudiante("María", 21, "Medicina"),
    estudiante
]

print("\\nTodos los estudiantes:")
for est in estudiantes:
    print(f"- {est.presentarse()}")`
    }
  ],
  cpp: [
    {
      name: 'Hola Mundo',
      fileName: 'hola_mundo.cpp',
      code: `#include <iostream>
#include <string>

using namespace std;

int main() {
    // Hola Mundo en C++
    cout << "¡Hola Mundo desde C++!" << endl;
    
    // Variables y tipos
    string nombre = "Estudiante";
    int edad = 20;
    double promedio = 85.5;
    
    cout << "Nombre: " << nombre << endl;
    cout << "Edad: " << edad << " años" << endl;
    cout << "Promedio: " << promedio << endl;
    
    // Entrada de usuario
    string nuevoNombre;
    cout << "\\nIngresa tu nombre: ";
    getline(cin, nuevoNombre);
    cout << "Hola " << nuevoNombre << "!" << endl;
    
    return 0;
}`
    },
    {
      name: 'Algoritmos Básicos',
      fileName: 'algoritmos.cpp',
      code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <chrono>

using namespace std;
using namespace std::chrono;

// Función para calcular factorial
long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Función para calcular Fibonacci
long long fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Versión iterativa de Fibonacci (más eficiente)
long long fibonacciIterativo(int n) {
    if (n <= 1) return n;
    long long a = 0, b = 1, temp;
    for (int i = 2; i <= n; i++) {
        temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

// Algoritmo de ordenamiento burbuja
void ordenamientoBurbuja(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

// Función para imprimir vector
void imprimirVector(const vector<int>& arr) {
    for (int i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i < arr.size() - 1) cout << ", ";
    }
    cout << endl;
}

int main() {
    // Ejemplos de algoritmos
    cout << "=== ALGORITMOS BÁSICOS EN C++ ===" << endl;
    
    // Factorial
    int n = 5;
    cout << "Factorial de " << n << ": " << factorial(n) << endl;
    
    // Fibonacci
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    cout << "Fibonacci iterativo(10): " << fibonacciIterativo(10) << endl;
    
    // Ordenamiento
    vector<int> numeros = {64, 34, 25, 12, 22, 11, 90};
    cout << "\\nArray original: ";
    imprimirVector(numeros);
    
    // Medir tiempo de ordenamiento
    auto inicio = high_resolution_clock::now();
    ordenamientoBurbuja(numeros);
    auto fin = high_resolution_clock::now();
    
    cout << "Array ordenado: ";
    imprimirVector(numeros);
    
    auto duracion = duration_cast<microseconds>(fin - inicio);
    cout << "Tiempo de ordenamiento: " << duracion.count() << " microsegundos" << endl;
    
    return 0;
}`
    },
    {
      name: 'Programación Orientada a Objetos',
      fileName: 'poo.cpp',
      code: `#include <iostream>
#include <string>
#include <vector>
#include <memory>

using namespace std;

class Persona {
protected:
    string nombre;
    int edad;

public:
    // Constructor
    Persona(const string& nombre, int edad) : nombre(nombre), edad(edad) {}
    
    // Destructor virtual para herencia
    virtual ~Persona() = default;
    
    // Métodos virtuales
    virtual string saludar() const {
        return "Hola, soy " + nombre + " y tengo " + to_string(edad) + " años";
    }
    
    virtual void cumplirAnios() {
        edad++;
        cout << "¡Feliz cumpleaños! Ahora tengo " << edad << " años" << endl;
    }
    
    // Getters
    string getNombre() const { return nombre; }
    int getEdad() const { return edad; }
    
    // Método virtual puro para polimorfismo
    virtual void presentarse() const = 0;
};

class Estudiante : public Persona {
private:
    string carrera;
    vector<string> materias;

public:
    // Constructor
    Estudiante(const string& nombre, int edad, const string& carrera)
        : Persona(nombre, edad), carrera(carrera) {}
    
    // Implementación del método virtual puro
    void presentarse() const override {
        cout << saludar() << ", estudio " << carrera << endl;
    }
    
    // Métodos específicos
    void agregarMateria(const string& materia) {
        materias.push_back(materia);
        cout << "Materia '" << materia << "' agregada" << endl;
    }
    
    void mostrarMaterias() const {
        cout << "Materias de " << nombre << ": ";
        for (size_t i = 0; i < materias.size(); i++) {
            cout << materias[i];
            if (i < materias.size() - 1) cout << ", ";
        }
        cout << endl;
    }
    
    string getCarrera() const { return carrera; }
    size_t getNumMaterias() const { return materias.size(); }
};

class Profesor : public Persona {
private:
    string departamento;
    double salario;

public:
    Profesor(const string& nombre, int edad, const string& departamento, double salario)
        : Persona(nombre, edad), departamento(departamento), salario(salario) {}
    
    void presentarse() const override {
        cout << saludar() << ", soy profesor del departamento de " << departamento << endl;
    }
    
    string getDepartamento() const { return departamento; }
    double getSalario() const { return salario; }
};

int main() {
    cout << "=== PROGRAMACIÓN ORIENTADA A OBJETOS EN C++ ===" << endl;
    
    // Crear objetos
    Estudiante estudiante("Juan", 20, "Ingeniería en Sistemas");
    Profesor profesor("Dr. García", 45, "Ciencias de la Computación", 5000.0);
    
    // Polimorfismo con punteros
    vector<unique_ptr<Persona>> personas;
    personas.push_back(make_unique<Estudiante>("Ana", 19, "Medicina"));
    personas.push_back(make_unique<Profesor>("Dra. López", 38, "Matemáticas", 4500.0));
    
    // Usar métodos
    estudiante.presentarse();
    estudiante.agregarMateria("Compiladores");
    estudiante.agregarMateria("Algoritmos");
    estudiante.agregarMateria("Bases de Datos");
    estudiante.mostrarMaterias();
    estudiante.cumplirAnios();
    
    cout << "\\n--- Profesor ---" << endl;
    profesor.presentarse();
    
    cout << "\\n--- Polimorfismo ---" << endl;
    for (const auto& persona : personas) {
        persona->presentarse();
    }
    
    return 0;
}`
    }
  ]
};

export const errorExamples = {
  "Errores Léxicos (C++)": {
    code: `#include <iostream>
using namespace std;

int main() {
    int x = 123abc;  // Error léxico: número mal formado
    string mensaje = "Hola mundo;  // Error léxico: string no cerrado
    char c = 'ab';  // Error léxico: caracter literal inválido
    return 0;
}`,
    language: "C++",
    description: "Ejemplos de errores en la fase de análisis léxico"
  },
  
  "Errores Sintácticos (C++)": {
    code: `#include <iostream>
using namespace std;

int main() {
    int x = 5;
    if (x > 0 {  // Error sintáctico: paréntesis sin cerrar
        cout << "Positivo" << endl;;  // Error sintáctico: punto y coma duplicado
    }
    
    int arr[5] = {1, 2, 3, 4, 5;  // Error sintáctico: corchete sin cerrar
    
    return 0;
// Error sintáctico: llave sin cerrar`,
    language: "C++",
    description: "Ejemplos de errores en la fase de análisis sintáctico"
  },
  
  "Errores Semánticos (C++)": {
    code: `#include <iostream>
using namespace std;

int main() {
    int edad = 25;
    
    // Error semántico: variable no declarada
    cout << nombre << endl;
    
    // Error semántico: redefinición de variable
    int edad = 30;
    
    // Error semántico: variable declarada pero no utilizada
    string mensaje = "Hola";
    
    // Error semántico: uso de palabra reservada como identificador
    int if = 10;
    
    return 0;
}`,
    language: "C++",
    description: "Ejemplos de errores en la fase de análisis semántico"
  },
  
  "Código Sin Errores (C++)": {
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string nombre = "Estudiante";
    int edad = 20;
    double promedio = 8.5;
    
    cout << "Nombre: " << nombre << endl;
    cout << "Edad: " << edad << " años" << endl;
    cout << "Promedio: " << promedio << endl;
    
    if (promedio >= 8.0) {
        cout << "¡Excelente calificación!" << endl;
    } else {
        cout << "Sigue esforzándote" << endl;
    }
    
    return 0;
}`,
    language: "C++",
    description: "Código sin errores que pasa todas las fases de análisis"
  },

  "Errores Mixtos (JavaScript)": {
    code: `// Ejemplo con errores léxicos, sintácticos y semánticos
function calcular() {
    let numero = 123abc;  // Error léxico: número mal formado
    let texto = "Hola mundo;  // Error léxico: string no cerrado
    let template = \`Plantilla sin cerrar;  // Error léxico: template literal
    let # = "error";  // Error léxico: caracter # no válido
    
    if (numero > 0 {  // Error sintáctico: paréntesis sin cerrar
        console.log(resultado);  // Error semántico: variable no declarada
    }
    
    let numero = 456;  // Error semántico: redefinición
    let mensaje = "No usado";  // Error semántico: variable no utilizada
    
    return numero * 2;
}

calcular(;  // Error sintáctico: paréntesis mal balanceados`,
    language: "javascript",
    description: "Ejemplo que demuestra los tres tipos de errores en JavaScript"
  },

  "Errores Léxicos (Python)": {
    code: `# Ejemplos de errores léxicos en Python

# Error léxico: número mal formado
numero_malo = 123abc

# Error léxico: string no cerrado
mensaje = "Hola mundo

# Error léxico: caracter no válido
variable$ = "error"

# Error léxico: indentación mixta (tabs y espacios)
def funcion_test():
    print("con espacios")
	print("con tab")  # Esta línea usa tab

# Error léxico: string multilínea no cerrado
texto = """
Este es un texto
de múltiples líneas
sin cerrar correctamente`,
    language: "python",
    description: "Ejemplos de errores en la fase de análisis léxico en Python"
  },

  "Errores Sintácticos (Python)": {
    code: `# Ejemplos de errores sintácticos en Python

# Error sintáctico: paréntesis no balanceados
print("Hola"
print("Mundo")

# Error sintáctico: dos puntos faltantes
if True
    print("Error")

# Error sintáctico: indentación incorrecta
def mi_funcion():
print("Sin indentación")

# Error sintáctico: paréntesis mal cerrados
resultado = max(1, 2, 3
print(resultado)`,
    language: "python",
    description: "Ejemplos de errores en la fase de análisis sintáctico en Python"
  },

  "Errores Semánticos (Python)": {
    code: `# Ejemplos de errores semánticos en Python

def mi_funcion():
    edad = 25
    
    # Error semántico: variable no declarada
    print(nombre)
    
    # Error semántico: variable declarada pero no utilizada
    mensaje_no_usado = "Hola"
    
    # Error semántico: usar palabra reservada como variable
    def = "esto es incorrecto"
    
    # Error semántico: variable no definida
    resultado = variable_inexistente * 2
    
    return edad

# Error semántico: función definida pero no utilizada
def funcion_sin_usar():
    pass`,
    language: "python",
    description: "Ejemplos de errores en la fase de análisis semántico en Python"
  },

  "Errores Léxicos (JavaScript)": {
    code: `// Ejemplos de errores léxicos en JavaScript

// Error léxico: número mal formado
let numero = 123abc;

// Error léxico: string no cerrado
let texto = "Hola mundo;

// Error léxico: template literal no cerrado
let plantilla = \`Template sin cerrar;

// Error léxico: caracter # no válido
let # = "error";

// Error léxico: comentario de bloque no cerrado
/* Este comentario
   no se cierra correctamente

let variable = "valor";`,
    language: "javascript",
    description: "Ejemplos de errores en la fase de análisis léxico en JavaScript"
  },

  "Errores Sintácticos (JavaScript)": {
    code: `// Ejemplos de errores sintácticos en JavaScript

// Error sintáctico: paréntesis no balanceados
console.log("Hola";
console.log("Mundo");

// Error sintáctico: llaves no balanceadas
function test() {
    console.log("test");
// Falta cerrar llave

// Error sintáctico: punto y coma mal ubicado
if (true;) {
    console.log("Error");
}

// Error sintáctico: corchetes no balanceados
let array = [1, 2, 3;
console.log(array);`,
    language: "javascript",
    description: "Ejemplos de errores en la fase de análisis sintáctico en JavaScript"
  },

  "Errores Semánticos (JavaScript)": {
    code: `// Ejemplos de errores semánticos en JavaScript

function calcular() {
    let edad = 25;
    
    // Error semántico: variable no declarada
    console.log(nombre);
    
    // Error semántico: variable declarada pero no utilizada
    let mensajeNoUsado = "Hola";
    
    // Error semántico: redefinición de variable
    let edad = 30;
    
    // Error semántico: usar palabra reservada como variable
    let var = "incorrecto";
    
    return edad;
}

// Error semántico: función definida pero no utilizada
function funcionSinUsar() {
    return "sin usar";
}`,
    language: "javascript",
    description: "Ejemplos de errores en la fase de análisis semántico en JavaScript"
  },
};

const CodeExamples: React.FC<CodeExamplesProps> = ({ onCodeLoad, onLanguageChange }) => {
  const handleExampleSelect = (language: string, example: { name: string; fileName: string; code: string }) => {
    // Cambiar el lenguaje primero
    onLanguageChange(language);
    // Luego cargar el código
    onCodeLoad(example.code, example.fileName);
  };

  const handleErrorExampleSelect = (exampleKey: string) => {
    const example = errorExamples[exampleKey as keyof typeof errorExamples];
    if (example) {
      onLanguageChange(example.language);
      onCodeLoad(example.code, `${exampleKey.replace(/\s+/g, '_').toLowerCase()}.${example.language === 'C++' ? 'cpp' : example.language === 'javascript' ? 'js' : 'py'}`);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Ejemplos
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cargar ejemplos de código</p>
        </TooltipContent>
      </Tooltip>
      
      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel>📚 Ejemplos de Código</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Ejemplos de Errores */}
        <DropdownMenuLabel className="text-xs text-red-600 font-semibold">
          🚨 Ejemplos con Errores (Para Probar el Compilador)
        </DropdownMenuLabel>
        {Object.keys(errorExamples).map((exampleKey) => (
          <DropdownMenuItem
            key={`error-${exampleKey}`}
            onClick={() => handleErrorExampleSelect(exampleKey)}
            className="cursor-pointer"
          >
            <Code2 className="h-3 w-3 mr-2" />
            {exampleKey}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* JavaScript */}
        <DropdownMenuLabel className="text-xs text-yellow-600 font-semibold">
          🟨 JavaScript
        </DropdownMenuLabel>
        {codeExamples.javascript.map((example, index) => (
          <DropdownMenuItem
            key={`js-${index}`}
            onClick={() => handleExampleSelect('javascript', example)}
            className="cursor-pointer"
          >
            <Code2 className="h-3 w-3 mr-2" />
            {example.name}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Python */}
        <DropdownMenuLabel className="text-xs text-blue-600 font-semibold">
          🐍 Python
        </DropdownMenuLabel>
        {codeExamples.python.map((example, index) => (
          <DropdownMenuItem
            key={`py-${index}`}
            onClick={() => handleExampleSelect('python', example)}
            className="cursor-pointer"
          >
            <Code2 className="h-3 w-3 mr-2" />
            {example.name}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* C++ */}
        <DropdownMenuLabel className="text-xs text-blue-800 font-semibold">
          ⚡ C++
        </DropdownMenuLabel>
        {codeExamples.cpp.map((example, index) => (
          <DropdownMenuItem
            key={`cpp-${index}`}
            onClick={() => handleExampleSelect('cpp', example)}
            className="cursor-pointer"
          >
            <Code2 className="h-3 w-3 mr-2" />
            {example.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CodeExamples; 