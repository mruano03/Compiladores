// Ejemplo de JavaScript para Node.js

function saludar(nombre) {
    console.log(`¡Hola ${nombre} desde JavaScript!`);
    return `Saludo para ${nombre}`;
}

function calcularSuma(a, b) {
    const resultado = a + b;
    console.log(`La suma de ${a} + ${b} = ${resultado}`);
    return resultado;
}

// Función asíncrona de ejemplo
async function procesoAsincrono() {
    console.log("Iniciando proceso asíncrono...");
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("Proceso completado");
        }, 100);
    });
}

// Programa principal
async function main() {
    console.log("🟨 Ejecutando código JavaScript...");
    
    // Saludar
    const mensaje = saludar("Compilador");
    console.log(`Mensaje devuelto: ${mensaje}`);
    
    // Calcular
    const suma = calcularSuma(30, 40);
    
    // Array de números
    const numeros = [1, 2, 3, 4, 5];
    console.log(`Array de números: ${JSON.stringify(numeros)}`);
    
    const sumaArray = numeros.reduce((acc, num) => acc + num, 0);
    console.log(`Suma del array: ${sumaArray}`);
    
    // Proceso asíncrono
    const resultado = await procesoAsincrono();
    console.log(`Resultado asíncrono: ${resultado}`);
    
    console.log("✅ Ejecución completada exitosamente");
}

// Ejecutar programa principal
main().catch(console.error); 