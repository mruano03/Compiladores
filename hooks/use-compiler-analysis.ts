import { useState, useCallback, useEffect } from 'react';
import { analyzeCodeWithAPI, checkServerHealth, type AnalyzeResponse } from '@/lib/api-compiler-analyzer';

interface UseCompilerAnalysisOptions {
  autoAnalyze?: boolean;
  debounceMs?: number;
}

interface UseCompilerAnalysisReturn {
  result: AnalyzeResponse | null;
  isAnalyzing: boolean;
  isServerOnline: boolean;
  error: string | null;
  analyzeCode: (code: string, language?: string) => Promise<void>;
  checkServer: () => Promise<void>;
}

export function useCompilerAnalysis(options: UseCompilerAnalysisOptions = {}): UseCompilerAnalysisReturn {
  const { autoAnalyze = false, debounceMs = 500 } = options;
  
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar estado del servidor
  const checkServer = useCallback(async () => {
    try {
      const online = await checkServerHealth();
      setIsServerOnline(online);
      if (online) {
        setError(null);
      }
    } catch (err) {
      setIsServerOnline(false);
      setError('No se puede conectar con el servidor del compilador');
    }
  }, []);

  // Analizar código
  const analyzeCode = useCallback(async (code: string, language: string = 'auto') => {
    if (!code || code.length === 0) {
      setResult(null);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResult = await analyzeCodeWithAPI(code, language);
      setResult(analysisResult);
      
      // Si hay errores de conexión, marcar servidor como offline
      if (analysisResult.errors.some(e => e.message.includes('conexión'))) {
        setIsServerOnline(false);
      } else {
        setIsServerOnline(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsServerOnline(false);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Verificar servidor al montar el componente
  useEffect(() => {
    checkServer();
  }, [checkServer]);

  return {
    result,
    isAnalyzing,
    isServerOnline,
    error,
    analyzeCode,
    checkServer
  };
} 