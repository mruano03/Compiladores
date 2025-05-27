package main

import (
	"fmt"
	"strings"
)

// TestRegexPatterns prueba los patrones de expresiones regulares
func TestRegexPatterns() {
	fmt.Println("🧪 Probando patrones de expresiones regulares...")

	// Casos de prueba por lenguaje
	testCases := map[string][]string{
		"cpp": {
			"int main() { return 0; }",
			"#include <iostream>",
			"std::cout << \"Hello World\" << std::endl;",
			"class MyClass { public: int value; };",
		},
		"javascript": {
			"function test() { console.log('hello'); }",
			"const myVar = 42;",
			"let array = [1, 2, 3];",
			"class Component extends React.Component {}",
		},
		"python": {
			"def hello_world():",
			"print('Hello, World!')",
			"class MyClass:",
			"import os",
		},
		"pascal": {
			"program HelloWorld;",
			"begin",
			"writeln('Hello World');",
			"end.",
		},
		"tsql": {
			"SELECT * FROM users;",
			"CREATE TABLE example (id INT);",
			"DECLARE @var INT;",
			"@@ROWCOUNT",
		},
		"plsql": {
			"DECLARE",
			"BEGIN",
			"DBMS_OUTPUT.PUT_LINE('Hello');",
			"END;",
		},
		"html": {
			"<html>",
			"<div class=\"container\">",
			"<!-- Comentario -->",
			"<script>alert('test');</script>",
		},
	}

	for language, codes := range testCases {
		fmt.Printf("\n📝 Probando %s:\n", strings.ToUpper(language))

		for _, code := range codes {
			fmt.Printf("  Código: %s\n", code)

			// Probar con analizador regex
			regexAnalyzer := NewRegexAnalyzer(code, language)
			tokens, errors := regexAnalyzer.TokenizeWithRegex()

			fmt.Printf("    Tokens encontrados: %d\n", len(tokens))
			for _, token := range tokens {
				if token.Type != "WHITESPACE" {
					fmt.Printf("      %s: '%s'\n", token.Type, token.Value)
				}
			}

			if len(errors) > 0 {
				fmt.Printf("    ⚠️  Errores: %d\n", len(errors))
				for _, err := range errors {
					fmt.Printf("      %s: %s\n", err.Type, err.Message)
				}
			} else {
				fmt.Printf("    ✅ Sin errores\n")
			}
			fmt.Println()
		}
	}
}

// TestSpecificPatterns prueba patrones específicos
func TestSpecificPatterns() {
	fmt.Println("\n🔍 Probando patrones específicos...")

	// Probar números
	numberTests := []string{"42", "3.14", "1.5e10", ".5", "123.456"}
	fmt.Println("\n📊 Números:")
	for _, test := range numberTests {
		if GeneralPatterns.Number.MatchString(test) {
			fmt.Printf("  ✅ '%s' es un número válido\n", test)
		} else {
			fmt.Printf("  ❌ '%s' NO es un número válido\n", test)
		}
	}

	// Probar strings
	stringTests := []string{`"hello"`, `'world'`, "`template`", `"escaped \"quote\""`}
	fmt.Println("\n📝 Strings:")
	for _, test := range stringTests {
		if GeneralPatterns.String.MatchString(test) {
			fmt.Printf("  ✅ '%s' es un string válido\n", test)
		} else {
			fmt.Printf("  ❌ '%s' NO es un string válido\n", test)
		}
	}

	// Probar identificadores
	identifierTests := []string{"variable", "_private", "myVar123", "123invalid", "valid_name"}
	fmt.Println("\n🏷️  Identificadores:")
	for _, test := range identifierTests {
		if GeneralPatterns.Identifier.MatchString(test) {
			fmt.Printf("  ✅ '%s' es un identificador válido\n", test)
		} else {
			fmt.Printf("  ❌ '%s' NO es un identificador válido\n", test)
		}
	}
}

// TestLanguageDetection prueba la detección de patrones por lenguaje
func TestLanguageDetection() {
	fmt.Println("\n🎯 Probando detección de patrones por lenguaje...")

	testCodes := map[string]string{
		"cpp":        "int main() { std::cout << \"Hello\"; }",
		"javascript": "function test() { console.log('hello'); }",
		"python":     "def hello(): print('world')",
		"pascal":     "program Test; begin writeln('hello'); end.",
		"tsql":       "SELECT * FROM users WHERE id = 1;",
		"html":       "<html><body><h1>Hello</h1></body></html>",
	}

	for expectedLang, code := range testCodes {
		fmt.Printf("\n🔍 Código: %s\n", code)
		fmt.Printf("   Lenguaje esperado: %s\n", expectedLang)

		// Probar con cada lenguaje
		for testLang := range LanguageSpecificPatterns {
			patterns, exists := GetLanguagePatterns(testLang)
			if !exists {
				continue
			}

			matches := 0
			if patterns.Keywords != nil {
				for _, pattern := range patterns.Keywords {
					if pattern.MatchString(code) {
						matches++
					}
				}
			}

			if patterns.Functions != nil && patterns.Functions.MatchString(code) {
				matches++
			}

			if patterns.Comments != nil && patterns.Comments.MatchString(code) {
				matches++
			}

			if matches > 0 {
				fmt.Printf("   %s: %d coincidencias\n", testLang, matches)
			}
		}
	}
}

// RunAllTests ejecuta todas las pruebas
func RunAllTests() {
	fmt.Println("🚀 Iniciando pruebas de expresiones regulares...")

	// Validar que los patrones estén bien compilados
	errors := ValidateRegexPatterns()
	if len(errors) > 0 {
		fmt.Printf("❌ Errores en patrones regex: %d\n", len(errors))
		for _, err := range errors {
			fmt.Printf("  - %s\n", err.Error())
		}
		return
	}
	fmt.Println("✅ Todos los patrones regex son válidos")

	TestSpecificPatterns()
	TestLanguageDetection()
	TestRegexPatterns()

	fmt.Println("\n🎉 Pruebas completadas!")
}
