# 📚 Inyector de Ejemplos de Código

## 🎯 **¿Qué es?**

El **Inyector de Ejemplos** es una funcionalidad integrada en el header que permite cargar código predefinido para cada lenguaje soportado. Facilita el aprendizaje y las pruebas rápidas del compilador.

## 🚀 **Cómo Usar**

1. **Ubicación:** Botón "📚 Ejemplos" en el header
2. **Selección:** Escoge el lenguaje y ejemplo deseado
3. **Carga Automática:** El código se inyecta automáticamente en el editor
4. **Detección:** El lenguaje se cambia automáticamente

## 📑 **Ejemplos Disponibles**

### 🟨 **JavaScript (3 ejemplos)**

#### 1. **Hola Mundo**
```javascript
// Hola Mundo en JavaScript
console.log("¡Hola Mundo desde JavaScript!");

// Variables y funciones
const nombre = "Estudiante";
let edad = 20;

function saludar(nombre, edad) {
    return `Hola ${nombre}, tienes ${edad} años`;
}

console.log(saludar(nombre, edad));
```

#### 2. **Algoritmos Básicos**
- Factorial recursivo
- Fibonacci recursivo  
- Ordenamiento burbuja
- Ejemplos de uso con arrays

#### 3. **Programación Orientada a Objetos**
- Clases y constructores
- Herencia con `extends`
- Métodos y propiedades
- Instanciación y uso

### 🐍 **Python (3 ejemplos)**

#### 1. **Hola Mundo**
```python
# Hola Mundo en Python
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
    print(f"El cuadrado de {num} es {num**2}")
```

#### 2. **Algoritmos Básicos**
- Factorial recursivo e iterativo
- Fibonacci con análisis de complejidad
- Ordenamiento burbuja
- Medición de tiempo de ejecución

#### 3. **Programación Orientada a Objetos**
- Clases con `__init__`
- Herencia y `super()`
- Métodos especiales (`__str__`)
- Listas de objetos

### ⚡ **C++ (3 ejemplos)**

#### 1. **Hola Mundo**
```cpp
#include <iostream>
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
    
    return 0;
}
```

#### 2. **Algoritmos Básicos**
- Factorial y Fibonacci
- STL con vectores y algoritmos
- Medición de tiempo con `chrono`
- Funciones de utilidad

#### 3. **Programación Orientada a Objetos**
- Herencia y polimorfismo
- Métodos virtuales puros
- Smart pointers (`unique_ptr`)
- Destructores virtuales

## 🔥 **Características Técnicas**

### **Funcionalidad del Componente**
- **Cambio Automático de Lenguaje:** Al seleccionar un ejemplo, el lenguaje se actualiza automáticamente
- **Inyección de Código:** El código se carga directamente en el editor
- **Nombre de Archivo:** Se simula un nombre de archivo apropiado
- **Interfaz Intuitiva:** Dropdown organizado por lenguaje

### **Código del Componente**
```typescript
// Estructura del ejemplo
interface CodeExample {
  name: string;        // Nombre descriptivo
  fileName: string;    // Nombre de archivo simulado
  code: string;        // Código fuente
}

// Función de manejo
const handleExampleSelect = (language: string, example: CodeExample) => {
  onLanguageChange(language);  // Cambiar lenguaje
  onCodeLoad(example.code, example.fileName);  // Cargar código
};
```

## 🎓 **Uso Educativo**

### **Para Estudiantes**
1. **Aprendizaje:** Ejemplos progresivos desde básico hasta avanzado
2. **Comparación:** Ver la misma funcionalidad en diferentes lenguajes
3. **Experimentación:** Modificar y ejecutar código inmediatamente

### **Para Profesores**
1. **Demostraciones:** Ejemplos listos para clase
2. **Ejercicios:** Base para asignaciones y tareas
3. **Evaluación:** Código de referencia para comparar

## 🔧 **Integración con el Compilador**

Los ejemplos están diseñados para funcionar perfectamente con el compilador Go backend:

- **✅ Sintaxis Válida:** Todo el código compila y ejecuta correctamente
- **✅ Resultados Visibles:** Cada ejemplo produce salida observable
- **✅ Progressión Lógica:** De conceptos simples a avanzados
- **✅ Buenas Prácticas:** Código bien comentado y estructurado

## 🚀 **Ejecución Inmediata**

Tras cargar un ejemplo:

1. **Presiona "▶️ Compilar"** en la interfaz
2. **Observa el análisis** léxico, sintáctico y semántico
3. **Ve la ejecución real** del código
4. **Analiza los resultados** en el panel de salida

---

**¡Explora, aprende y experimenta con el inyector de ejemplos!** 🎉 

## 🔍 Sistema de Detección de Errores por Fases

### Análisis por Tabs Especializados

El compilador ahora incluye un sistema avanzado de categorización de errores dividido en tabs especializados para cada fase del proceso de compilación:

#### 📋 Tab de Errores Léxicos
**Función:** Detecta errores en la fase de análisis léxico (tokenización)
- **Caracteres no válidos:** `@`, `$` en C++, etc.
- **Strings mal cerrados:** `"Hola mundo` (sin comillas de cierre)
- **Números malformados:** `123abc`, `3.14.15` (múltiples puntos decimales)
- **Comentarios mal formados:** `/* comentario` sin cierre en C++

**Ejemplo de error léxico:**
```cpp
int main() {
    int x = 123abc;  // ❌ Error léxico: número mal formado
    string msg = "Hola;  // ❌ Error léxico: string no cerrado
    return 0;
}
```

#### 🔧 Tab de Errores Sintácticos
**Función:** Detecta errores en la estructura del código (gramática)
- **Paréntesis no balanceados:** `if (x > 0 {` 
- **Llaves no cerradas:** función sin `}`
- **Corchetes mal balanceados:** `arr[5` sin cerrar
- **Puntos y comas duplicados:** `;;`

**Ejemplo de error sintáctico:**
```cpp
int main() {
    int x = 5;
    if (x > 0 {  // ❌ Error sintáctico: paréntesis sin cerrar
        cout << "OK";;  // ❌ Error sintáctico: punto y coma duplicado
    }
    return 0;
// ❌ Error sintáctico: llave sin cerrar
```

#### 🧠 Tab de Errores Semánticos
**Función:** Detecta errores de significado y contexto
- **Variables no declaradas:** uso de variables antes de declararlas
- **Redefinición de variables:** declarar la misma variable dos veces
- **Variables no utilizadas:** declarar pero nunca usar
- **Palabras reservadas como identificadores:** `int if = 10;`

**Ejemplo de error semántico:**
```cpp
int main() {
    int edad = 25;
    
    cout << nombre << endl;  // ❌ Error semántico: 'nombre' no declarada
    
    int edad = 30;  // ❌ Error semántico: redefinición de 'edad'
    
    string mensaje = "Hola";  // ❌ Warning: variable no utilizada
    
    int if = 10;  // ❌ Error semántico: 'if' es palabra reservada
    
    return 0;
}
```

### 📊 Características del Sistema

1. **Visualización Clara:** Cada tipo de error tiene su propio color y iconografía
2. **Información Detallada:** Muestra línea, columna y posición exacta del error
3. **Contexto Educativo:** Explica qué significa cada tipo de error
4. **Severidades:** Distingue entre errores críticos y advertencias
5. **Estados Visuales:** Indica cuando no hay errores de un tipo específico

### 🎯 Ejemplos de Prueba

Para probar el sistema, puedes usar los ejemplos incluidos en el dropdown "Ejemplos":

- **🚨 Errores Léxicos (C++):** Demuestra caracteres inválidos y tokens malformados
- **🚨 Errores Sintácticos (C++):** Muestra problemas de estructura y gramática  
- **🚨 Errores Semánticos (C++):** Ilustra problemas de significado y contexto
- **🚨 Errores Mixtos (JavaScript):** Combina los tres tipos de errores
- **✅ Código Sin Errores (C++):** Para verificar el funcionamiento correcto

### 💡 Casos de Uso Educativos

Este sistema es ideal para:
- **Estudiantes de compiladores:** Entender las fases de análisis
- **Aprendizaje de programación:** Identificar tipos específicos de errores
- **Debugging educativo:** Comprender la naturaleza de los errores
- **Análisis de código:** Mejorar la calidad del código paso a paso

### 🔗 Integración con el Editor

Los errores se muestran tanto en los tabs como directamente en el editor Monaco con:
- Subrayado rojo para errores críticos
- Subrayado amarillo para advertencias  
- Tooltips informativos al hacer hover
- Marcadores de línea para localización rápida 