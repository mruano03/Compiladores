'use client';

import Editor from '@monaco-editor/react';
import { Spinner } from '@/components/ui/spinner';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  theme: string;
}

export default function CodeEditor({ value, onChange, language, theme }: CodeEditorProps) {
  return (
    <div className="h-full w-full border-r border-border">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
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
        }}
        loading={<Spinner className="h-8 w-8 text-primary" />}
      />
    </div>
  );
}