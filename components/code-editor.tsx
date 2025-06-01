'use client';

import Editor from '@monaco-editor/react';
import { Spinner } from '@/components/ui/spinner';
import { useRef, useEffect, useCallback } from 'react';

interface MonacoMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
  source: string;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  theme: string;
  markers?: MonacoMarker[];
  onMarkersUpdate?: (markers: MonacoMarker[]) => void;
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language, 
  theme, 
  markers = [],
  onMarkersUpdate 
}: CodeEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);

  // Función que se ejecuta cuando el editor se monta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configurar validación personalizada
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Configurar tema personalizado si es necesario
    if (theme === 'vs-dark') {
      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0d1117',
          'editor.foreground': '#e6edf3',
          'editorLineNumber.foreground': '#7d8590',
          'editorLineNumber.activeForeground': '#e6edf3',
        }
      });
      monaco.editor.setTheme('custom-dark');
    }
  };

  // Efecto para actualizar marcadores cuando cambian
  useEffect(() => {
    if (editorRef.current && monacoRef.current && markers.length >= 0) {
      const model = editorRef.current.getModel();
      if (model) {
        // Limpiar marcadores existentes
        monacoRef.current.editor.setModelMarkers(model, 'compilador', []);
        
        // Agregar nuevos marcadores
        if (markers.length > 0) {
          const monacoMarkers = markers.map(marker => ({
            startLineNumber: marker.startLineNumber || 1,
            startColumn: marker.startColumn || 1,
            endLineNumber: marker.endLineNumber || marker.startLineNumber || 1,
            endColumn: marker.endColumn || marker.startColumn + 10 || 11,
            message: marker.message || 'Error',
            severity: marker.severity || monacoRef.current.MarkerSeverity.Error,
            source: marker.source || 'compilador'
          }));
          
          monacoRef.current.editor.setModelMarkers(model, 'compilador', monacoMarkers);
        }
      }
    }
  }, [markers]);

  // Función para obtener marcadores actuales y enviarlos al padre
  const updateParentWithMarkers = useCallback(() => {
    if (editorRef.current && monacoRef.current && onMarkersUpdate) {
      const model = editorRef.current.getModel();
      if (model) {
        const currentMarkers = monacoRef.current.editor.getModelMarkers({
          resource: model.uri
        });
        onMarkersUpdate(currentMarkers);
      }
    }
  }, [onMarkersUpdate]);

  // Actualizar marcadores en el padre cuando cambien
  useEffect(() => {
    updateParentWithMarkers();
  }, [markers, updateParentWithMarkers]);

  return (
    <div className="h-full w-full border-r border-border">
      <Editor
        height="100%"
        width="100%"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme === 'vs-dark' ? 'custom-dark' : theme}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          fontFamily: 'var(--font-fira-code)',
          fontLigatures: true,
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          // Configuraciones para mejor visualización de errores
          renderLineHighlight: 'line',
          renderValidationDecorations: 'on',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
          },
          // Mostrar información de hover para errores
          hover: {
            enabled: true,
            delay: 300,
          },
        }}
        loading={<Spinner className="h-8 w-8 text-primary" />}
      />
    </div>
  );
}

// Mapear lenguajes del frontend a lenguajes de Monaco
function getMonacoLanguage(language: string): string {
  const languageMap: { [key: string]: string } = {
    'javascript': 'javascript',
    'python': 'python',
    'cpp': 'cpp',
    'c++': 'cpp',
    'html': 'html',
    'pascal': 'pascal',
    'sql': 'sql',
    'tsql': 'sql',
    'plsql': 'sql',
  };
  
  return languageMap[language.toLowerCase()] || 'plaintext';
}