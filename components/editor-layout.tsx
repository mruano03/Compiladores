'use client';

import { useState } from 'react';
import CodeEditor from '@/components/code-editor';
import CodeAnalysis from '@/components/code-analisis';
import Header from '@/components/headert';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { defaultCode } from '@/lib/constants';

export default function EditorLayout() {
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [markers, setMarkers] = useState<any[]>([]);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    
    // demo de analisis de codigo
    const newMarkers = [];
    
    // ejemplo de verificacion de console.log
    const consoleLogRegex = /console\.log\(/g;
    let match;
    while ((match = consoleLogRegex.exec(value || '')) !== null) {
      newMarkers.push({
        type: 'Peligro',
        message: 'console.log encontrado en el codigo ',
        position: match.index,
      });
    }
    
    // ejemplo de verificacion de comentarios TODO
    const todoRegex = /\/\/\s*TODO/gi;
    while ((match = todoRegex.exec(value || '')) !== null) {
      newMarkers.push({
        type: 'info',
        message: 'comentario TODO encontrado',
        position: match.index,
      });
    }
    
    setMarkers(newMarkers);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header 
        language={language} 
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 h-[calc(100vh-4rem)]"
      >
        <ResizablePanel defaultSize={60} minSize={30}>
          <CodeEditor 
            value={code} 
            onChange={handleCodeChange} 
            language={language}
            theme={theme}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CodeAnalysis code={code} markers={markers} language={language} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}