'use client';

import { useState } from 'react';
import CodeEditor from '@/components/code-editor';
import CodeAnalysis from '@/components/code-analisis';
import Header from '@/components/headert';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { defaultCode } from '@/lib/constants';
import { detectLanguage, getLanguageInfo } from '@/lib/language-detector';

export default function EditorLayout() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [markers, setMarkers] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState<string | undefined>(undefined);
  const [languageDetectionInfo, setLanguageDetectionInfo] = useState<any>(null);

  // Función para detectar el lenguaje automáticamente basado en el nombre del archivo
  const detectLanguageFromFile = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'javascript',
      'tsx': 'javascript',
      'py': 'python',
      'cpp': 'C++',
      'cxx': 'C++',
      'cc': 'C++',
      'c': 'C++',
      'h': 'C++',
      'hpp': 'C++',
      'html': 'html',
      'htm': 'html',
      'sql': 'T-SQL',
      'pas': 'Pascal',
      'pascal': 'Pascal',
      'txt': language // Mantener el lenguaje actual para archivos .txt
    };

    return languageMap[extension || ''] || 'javascript';
  };

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    
    // Detectar lenguaje automáticamente basado en el contenido
    if (value && value.trim()) {
      const detectionInfo = getLanguageInfo(value, currentFile);
      setLanguageDetectionInfo(detectionInfo);
      
      // Solo cambiar automáticamente si la confianza es alta (>5) y es diferente al actual
      if (detectionInfo.confidence > 5 && detectionInfo.detectedLanguage !== language) {
        setLanguage(detectionInfo.detectedLanguage);
      }
    }
    
    // Demo de análisis de código básico (mantener para compatibilidad)
    const newMarkers = [];
    
    // Ejemplo de verificación de console.log
    const consoleLogRegex = /console\.log\(/g;
    let match;
    while ((match = consoleLogRegex.exec(value || '')) !== null) {
      newMarkers.push({
        type: 'warning',
        message: 'console.log encontrado en el código',
        position: match.index,
      });
    }
    
    // Ejemplo de verificación de comentarios TODO
    const todoRegex = /\/\/\s*TODO/gi;
    while ((match = todoRegex.exec(value || '')) !== null) {
      newMarkers.push({
        type: 'info', 
        message: 'Comentario TODO encontrado',
        position: match.index,
      });
    }
    
    setMarkers(newMarkers);
  };

  // Función para manejar la carga de código desde archivos
  const handleCodeLoad = (newCode: string, fileName?: string) => {
    setCode(newCode);
    setCurrentFile(fileName);
    
    // Usar el detector inteligente de lenguaje
    const detectedLanguage = detectLanguage(newCode, fileName);
    const detectionInfo = getLanguageInfo(newCode, fileName);
    
    setLanguage(detectedLanguage);
    setLanguageDetectionInfo(detectionInfo);
    
    // Actualizar markers para el nuevo código
    handleCodeChange(newCode);
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
            {/* Mostrar información del archivo actual */}
            {(currentFile || languageDetectionInfo) && (
              <div className="px-4 py-2 bg-muted/30 border-b border-border">
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
                  </div>
                  
                  {languageDetectionInfo && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Confianza: {languageDetectionInfo.confidence}
                      </span>
                      {languageDetectionInfo.alternatives.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          | Alternativas: {languageDetectionInfo.alternatives.slice(0, 2).map((alt: any) => alt.language).join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Mostrar advertencia si la detección no es muy confiable */}
                {languageDetectionInfo && languageDetectionInfo.confidence < 3 && languageDetectionInfo.confidence > 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs text-yellow-600">
                      ⚠️ Detección incierta - Verifica el lenguaje seleccionado
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <CodeEditor 
              value={code} 
              onChange={handleCodeChange} 
              language={language}
              theme={theme}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CodeAnalysis 
            code={code} 
            markers={markers} 
            language={language} 
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}