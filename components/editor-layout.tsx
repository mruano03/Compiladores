'use client';

import { useState } from 'react';
import CodeEditor from '@/components/code-editor';
import CodeAnalysisAPI from '@/components/code-analysis-api';
import Header from '@/components/headert';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { defaultCode } from '@/lib/constants';
import { detectLanguage, getLanguageInfo } from '@/lib/language-detector';
import { Play, Square } from 'lucide-react';

interface MarkerInfo {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
  source: string;
}

interface LanguageDetectionInfo {
  detectedLanguage: string;
  confidence: number;
}

export default function EditorLayout() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [currentFile, setCurrentFile] = useState<string | undefined>(undefined);
  const [languageDetectionInfo, setLanguageDetectionInfo] = useState<LanguageDetectionInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shouldAnalyze, setShouldAnalyze] = useState(false);

  // Función para detectar el lenguaje automáticamente basado en el nombre del archivo
  const detectLanguageFromFile = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'javascript',
      'tsx': 'javascript',
      'py': 'python',
      'cpp': 'cpp',
      'cxx': 'cpp',
      'cc': 'cpp',
      'c': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'html': 'html',
      'htm': 'html',
      'sql': 'tsql',
      'pas': 'pascal',
      'pascal': 'pascal',
      'txt': language // Mantener el lenguaje actual para archivos .txt
    };

    return languageMap[extension || ''] || 'javascript';
  };

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    
    // Solo detectar lenguaje automáticamente basado en el contenido
    if (value && value.trim()) {
      const detectionInfo = getLanguageInfo(value, currentFile);
      setLanguageDetectionInfo(detectionInfo);
      
      // Mejorar la lógica de detección automática
      const detectedLanguage = detectionInfo.detectedLanguage;
      
      if (
        (detectionInfo.confidence > 5) ||
        (detectionInfo.confidence > 3 && detectedLanguage !== language && detectedLanguage !== 'javascript') ||
        (detectionInfo.confidence > 2 && ['html', 'sql', 'tsql', 'plsql', 'pascal'].includes(detectedLanguage))
      ) {
        setLanguage(detectedLanguage);
      }
    } else {
      // Limpiar información de detección si no hay código
      setLanguageDetectionInfo(null);
    }
    
    // NO ejecutar análisis automático - solo limpiar marcadores previos
    setMarkers([]);
    setShouldAnalyze(false); // Resetear flag de análisis
  };

  // Función para manejar actualizaciones de marcadores desde el análisis
  const handleMarkersUpdate = (newMarkers: MarkerInfo[]) => {
    setMarkers(newMarkers);
  };

  // Nueva función para ejecutar el compilador manualmente
  const handleRunCompiler = async () => {
    if (!code || code.length === 0) return;
    
    setIsAnalyzing(true);
    setShouldAnalyze(true);
    
    // Simular un pequeño delay para mostrar que está analizando
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 500);
  };

  // Función para detener el análisis
  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
    setShouldAnalyze(false);
    setMarkers([]);
  };

  // Función para manejar la carga de código desde archivos
  const handleCodeLoad = (newCode: string, fileName?: string) => {
    setCode(newCode);
    setCurrentFile(fileName);
    
    // Usar el detector inteligente de lenguaje
    const detectedLanguage = detectLanguage(newCode, fileName);
    const detectionInfo = getLanguageInfo(newCode, fileName);
    
    // Siempre actualizar la información de detección
    setLanguageDetectionInfo(detectionInfo);
    
    // Para archivos cargados, ser más agresivo en la detección:
    // 1. Si hay nombre de archivo, usar la extensión principalmente
    // 2. Si la confianza del contenido es alta, usar esa detección
    // 3. Fallback al detector principal
    let finalLanguage = detectedLanguage;
    
    if (fileName) {
      const extensionLanguage = detectLanguageFromFile(fileName);
      if (extensionLanguage !== language) {
        finalLanguage = extensionLanguage;
      }
    }
    
    // Si el detector de contenido tiene alta confianza, usar esa detección
    if (detectionInfo.confidence > 7) {
      finalLanguage = detectionInfo.detectedLanguage;
    }
    
    setLanguage(finalLanguage);
    
    // NO ejecutar análisis automático al cargar archivos
    setMarkers([]);
    setShouldAnalyze(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header 
        language={language} 
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        onCodeLoad={handleCodeLoad}
      />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 h-[calc(100vh-4rem)]"
      >
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col">
            {/* Barra de control del compilador */}
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentFile && (
                    <span className="text-sm text-muted-foreground">
                      📁 {currentFile}
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {language}
                  </Badge>
                  
                  {/* Mostrar advertencia si la detección no es muy confiable */}
                  {languageDetectionInfo && languageDetectionInfo.confidence < 3 && languageDetectionInfo.confidence > 0 && (
                    <Badge variant="outline" className="text-xs text-yellow-600">
                      ⚠️ Detección incierta
                    </Badge>
                  )}
                </div>
                
                {/* Botones de control del compilador */}
                <div className="flex items-center gap-2">
                  {isAnalyzing ? (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={handleStopAnalysis}
                      disabled={!isAnalyzing}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Detener
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleRunCompiler}
                      disabled={!code || code.length === 0 || isAnalyzing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Ejecutar Compilador
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Estado del análisis */}
              {isAnalyzing && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Analizando código...
                </div>
              )}
            </div>
            <CodeEditor 
              value={code} 
              onChange={handleCodeChange} 
              language={language}
              theme={theme}
              markers={markers}
              onMarkersUpdate={handleMarkersUpdate}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CodeAnalysisAPI 
            code={code} 
            language={language}
            shouldAnalyze={shouldAnalyze}
            onAnalysisComplete={(_canExecute) => {
              setIsAnalyzing(false);
              // Aquí podrías agregar lógica adicional cuando el análisis se complete
            }}
            onMarkersUpdate={handleMarkersUpdate}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}