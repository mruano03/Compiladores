#include <iostream>
using namespace std;

int main() {
    int x = 123abc;  // Error léxico: número mal formado
    string mensaje = "Hola mundo;  // Error léxico: string no cerrado
    char c = 'ab';  // Error léxico: caracter literal inválido
    return 0;
} 