package main

import (
	"fmt"
)

func debugTokenization() {
	code := `#include <iostream>
using namespace std;

int main() {
    int x = 123abc;  // Error léxico: número mal formado
    string mensaje = "Hola mundo;  // Error léxico: string no cerrado
    char c = 'ab';  // Error léxico: caracter literal inválido
    return 0;
}`

	fmt.Println("=== DEBUGGING TOKENIZATION ===")
	
	// Tokenizar
	tokens := Tokenize(code, "cpp")
	
	fmt.Printf("Tokens encontrados: %d\n", len(tokens))
	for i, token := range tokens {
		if token.Type == UNKNOWN || token.Lexeme == "123abc" || token.Lexeme == "ab" {
			fmt.Printf("Token %d: Type=%s, Lexeme='%s', Start=%d, End=%d\n", 
				i, token.Type.String(), token.Lexeme, token.Start, token.End)
		}
	}
	
	fmt.Println("\n=== RUNNING FULL ANALYSIS ===")
	
	// Análisis completo
	result := AnalyzeCode(code, "cpp")
	
	fmt.Printf("Total errors: %d\n", len(result.Errors))
	
	lexicalCount := 0
	syntacticCount := 0
	semanticCount := 0
	
	for _, err := range result.Errors {
		fmt.Printf("Error: Type=%s, Message=%s, Pos=%d\n", err.Type, err.Message, err.Pos)
		switch err.Type {
		case "lexico":
			lexicalCount++
		case "sintactico":
			syntacticCount++
		case "semantico":
			semanticCount++
		}
	}
	
	fmt.Printf("\nConteo por tipo:\n")
	fmt.Printf("- Léxicos: %d\n", lexicalCount)
	fmt.Printf("- Sintácticos: %d\n", syntacticCount)
	fmt.Printf("- Semánticos: %d\n", semanticCount)
}

func main() {
	debugTokenization()
} 