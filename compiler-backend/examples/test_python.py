#!/usr/bin/env python3

def saludar(nombre):
    print(f"¡Hola {nombre} desde Python!")
    return f"Saludo para {nombre}"

def calcular_suma(a, b):
    resultado = a + b
    print(f"La suma de {a} + {b} = {resultado}")
    return resultado

# Programa principal
if __name__ == "__main__":
    print("🐍 Ejecutando código Python...")
    
    # Saludar
    mensaje = saludar("Compilador")
    print(f"Mensaje devuelto: {mensaje}")
    
    # Calcular
    suma = calcular_suma(15, 25)
    
    # Lista de números
    numeros = [1, 2, 3, 4, 5]
    print(f"Lista de números: {numeros}")
    print(f"Suma de la lista: {sum(numeros)}")
    
    print("✅ Ejecución completada exitosamente") 