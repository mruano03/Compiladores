package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Inicializar configuración
	InitConfig()

	fmt.Printf("🔧 Configuración del compilador:\n")
	fmt.Printf("   - Ejecución real: %v\n", GlobalConfig.EnableRealExecution)

	fmt.Printf("   - Timeout: %d segundos\n", GlobalConfig.ExecutionTimeout)
	fmt.Printf("   - Tamaño máximo: %d bytes\n", GlobalConfig.MaxFileSize)
	fmt.Printf("   - Lenguajes: %v\n", GlobalConfig.AllowedLanguages)

	// Validar patrones regex
	regexErrors := ValidateRegexPatterns()
	if len(regexErrors) == 0 {
		fmt.Printf("   ✅ Patrones regex validados correctamente\n")
	} else {
		fmt.Printf("   ⚠️  Errores en patrones regex: %d\n", len(regexErrors))
	}
	fmt.Println()

	r := mux.NewRouter()

	// Rutas de la API
	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/analyze", analyzeCodeHandler).Methods("POST")
	api.HandleFunc("/health", healthHandler).Methods("GET")
	api.HandleFunc("/config", configHandler).Methods("GET")
	api.HandleFunc("/test-regex", testRegexHandler).Methods("GET")

	// Configurar CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Servidor del compilador iniciado en puerto %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "compiler-backend",
	})
}

func analyzeCodeHandler(w http.ResponseWriter, r *http.Request) {
	var request AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validar tamaño del código
	if !GlobalConfig.ValidateCodeSize(request.Code) {
		http.Error(w, "Código demasiado grande", http.StatusRequestEntityTooLarge)
		return
	}

	// Validar lenguaje permitido
	if !GlobalConfig.IsLanguageAllowed(request.Language) && request.Language != "" {
		http.Error(w, "Lenguaje no permitido", http.StatusBadRequest)
		return
	}

	// Realizar el análisis del código
	result := AnalyzeCode(request.Code, request.Language)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"realExecution":    GlobalConfig.EnableRealExecution,
		"timeout":          GlobalConfig.ExecutionTimeout,
		"maxFileSize":      GlobalConfig.MaxFileSize,
		"allowedLanguages": GlobalConfig.AllowedLanguages,
	})
}

func testRegexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Ejecutar pruebas de regex
	errors := ValidateRegexPatterns()

	response := map[string]interface{}{
		"status":            "success",
		"message":           "Pruebas de expresiones regulares completadas",
		"regexValid":        len(errors) == 0,
		"errors":            errors,
		"regexLexerEnabled": true,
	}

	if len(errors) > 0 {
		response["status"] = "warning"
		response["message"] = "Se encontraron errores en los patrones regex"
	}

	json.NewEncoder(w).Encode(response)
}
