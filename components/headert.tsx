'use client';

import { MoonIcon, SunIcon, Code2, Download, Upload, Settings, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { languages, editorThemes } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  language: string;
  setLanguage: (language: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

export default function Header({ language, setLanguage, theme, setTheme }: HeaderProps) {
  const { theme: systemTheme, setTheme: setSystemTheme } = useTheme();

  return (
    <header className="border-b border-border h-16 flex items-center justify-between px-4 bg-background">
      <div className="flex items-center space-x-2">
        <Cpu className="h-6 w-6 text-primary" />
        <h1 className="font-semibold text-xl">Compilador</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Select value={language} onValueChange={setLanguage}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Selecciona el lenguaje de programacion</p>
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
        </TooltipProvider>
      

        <div className="flex space-x-1">
          

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Subir codigo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          

         
        </div>
      </div>
    </header>
  );
}