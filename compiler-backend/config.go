package main

import (
	"os"
	"strconv"
	"strings"
)

// CompilerConfig contiene la configuración del compilador
type CompilerConfig struct {
	EnableRealExecution bool
	ExecutionTimeout    int // en segundos
	MaxFileSize         int // en bytes
	AllowedLanguages    []string
	TempDirectory       string
}

// DefaultConfig devuelve la configuración por defecto
func DefaultConfig() *CompilerConfig {
	return &CompilerConfig{
		EnableRealExecution: true,
		ExecutionTimeout:    5,
		MaxFileSize:         1024 * 1024, // 1MB
		AllowedLanguages:    []string{"cpp", "python", "javascript", "pascal", "html", "tsql", "plsql"},
		TempDirectory:       os.TempDir(),
	}
}

// LoadConfigFromEnv carga la configuración desde variables de entorno
func LoadConfigFromEnv() *CompilerConfig {
	config := DefaultConfig()

	// Habilitar/deshabilitar ejecución real
	if realExec := os.Getenv("ENABLE_REAL_EXECUTION"); realExec != "" {
		if enabled, err := strconv.ParseBool(realExec); err == nil {
			config.EnableRealExecution = enabled
		}
	}

	// Timeout de ejecución
	if timeout := os.Getenv("EXECUTION_TIMEOUT"); timeout != "" {
		if t, err := strconv.Atoi(timeout); err == nil && t > 0 {
			config.ExecutionTimeout = t
		}
	}

	// Tamaño máximo de archivo
	if maxSize := os.Getenv("MAX_FILE_SIZE"); maxSize != "" {
		if size, err := strconv.Atoi(maxSize); err == nil && size > 0 {
			config.MaxFileSize = size
		}
	}

	// Lenguajes permitidos
	if languages := os.Getenv("ALLOWED_LANGUAGES"); languages != "" {
		config.AllowedLanguages = strings.Split(languages, ",")
		for i, lang := range config.AllowedLanguages {
			config.AllowedLanguages[i] = strings.TrimSpace(strings.ToLower(lang))
		}
	}

	// Directorio temporal
	if tempDir := os.Getenv("TEMP_DIRECTORY"); tempDir != "" {
		config.TempDirectory = tempDir
	}

	return config
}

// IsLanguageAllowed verifica si un lenguaje está permitido
func (c *CompilerConfig) IsLanguageAllowed(language string) bool {
	lang := strings.ToLower(language)
	for _, allowed := range c.AllowedLanguages {
		if allowed == lang {
			return true
		}
	}
	return false
}

// ValidateCodeSize verifica si el código no excede el tamaño máximo
func (c *CompilerConfig) ValidateCodeSize(code string) bool {
	return len(code) <= c.MaxFileSize
}

// Global config instance
var GlobalConfig *CompilerConfig

// InitConfig inicializa la configuración global
func InitConfig() {
	GlobalConfig = LoadConfigFromEnv()
}
