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
	r := mux.NewRouter()

	// Rutas de la API
	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/analyze", analyzeCodeHandler).Methods("POST")
	api.HandleFunc("/health", healthHandler).Methods("GET")

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
		"status": "ok",
		"service": "compiler-backend",
	})
}

func analyzeCodeHandler(w http.ResponseWriter, r *http.Request) {
	var request AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Realizar el análisis del código
	result := AnalyzeCode(request.Code, request.Language)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
} 