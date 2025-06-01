'use client';

import React, { useCallback } from 'react';
import { MoonIcon, SunIcon, Code2, Download, Upload, Settings, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { languages, editorThemes } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FileUpload from '@/components/file-upload';
import CodeExamples from '@/components/code-examples';

interface HeaderProps {
  language: string;
  setLanguage: (language: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onCodeLoad?: (code: string, fileName?: string) => void;
}

const Header = React.memo(({ 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  onCodeLoad 
}: HeaderProps) => {
  const { theme: systemTheme, setTheme: setSystemTheme } = useTheme();

  const handleExportCode = useCallback(() => {
    // Esta función sería implementada para exportar el código actual
    console.log('Exportar código...');
  }, []);

  const handleThemeToggle = useCallback(() => {
    setSystemTheme(systemTheme === 'dark' ? 'light' : 'dark');
  }, [systemTheme, setSystemTheme]);

  const handleLanguageChange = useCallback((value: string) => {
    setLanguage(value);
  }, [setLanguage]);

  return (
    <TooltipProvider>
      <header className="border-b border-border h-16 flex items-center justify-between px-4 bg-background">
        <div className="flex items-center space-x-3">
          <Cpu className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-bold text-xl text-primary">Compilador</h1>
            <p className="text-xs text-muted-foreground">Grupo</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleccionar Lenguaje" />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Selecciona el lenguaje de programación</p>
              </TooltipContent>
            </Tooltip>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex space-x-1">
            {/* Inyector de ejemplos de código */}
            {onCodeLoad && (
              <CodeExamples 
                onCodeLoad={onCodeLoad}
                onLanguageChange={setLanguage}
              />
            )}

            {onCodeLoad && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FileUpload onCodeLoad={onCodeLoad} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Subir archivo de código</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleExportCode}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar análisis</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleThemeToggle}
                >
                  <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cambiar tema</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
});

Header.displayName = 'Header';

export default Header;