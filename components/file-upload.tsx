'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onCodeLoad: (code: string, fileName?: string) => void;
}

export default function FileUpload({ onCodeLoad }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (fileList: File[]) => {
    // Filtrar solo archivos .txt
    const txtFiles = fileList.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return extension === 'txt' || extension === 'js' || extension === 'py' || 
             extension === 'cpp' || extension === 'html' || extension === 'sql' || 
             extension === 'pas' || extension === 'pascal';
    });

    if (txtFiles.length === 0) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos de código (.txt, .js, .py, .cpp, .html, .sql, .pas)",
        variant: "destructive",
      });
      return;
    }

    if (txtFiles.length > 5) {
      toast({
        title: "Demasiados archivos",
        description: "Máximo 5 archivos permitidos",
        variant: "destructive",
      });
      return;
    }

    setFiles(txtFiles);
    
    // Leer el primer archivo automáticamente
    if (txtFiles.length > 0) {
      readFile(txtFiles[0]);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onCodeLoad(content, file.name);
      setIsOpen(false);
      toast({
        title: "Archivo cargado",
        description: `${file.name} se cargó exitosamente`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Error al leer archivo",
        description: "No se pudo leer el archivo seleccionado",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      toast({
        title: "Campo vacío",
        description: "Por favor ingresa código para analizar",
        variant: "destructive",
      });
      return;
    }

    onCodeLoad(textInput, 'texto-manual.txt');
    setTextInput('');
    setIsOpen(false);
    toast({
      title: "Código cargado",
      description: "El código se cargó exitosamente",
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar Código</DialogTitle>
          <DialogDescription>
            Sube archivos de código o ingresa código manualmente para analizar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Área de arrastrar archivos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Subir Archivos
              </CardTitle>
              <CardDescription>
                Arrastra archivos aquí o haz clic para seleccionar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arrastra archivos aquí o <span className="text-primary cursor-pointer">selecciona archivos</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: .txt, .js, .py, .cpp, .html, .sql, .pas
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.js,.py,.cpp,.html,.sql,.pas,.pascal"
                onChange={handleFileInput}
                className="hidden"
              />
              
              {/* Lista de archivos seleccionados */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Archivos seleccionados:</Label>
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-muted p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => readFile(file)}
                        >
                          Cargar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entrada manual de código */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresar Código Manualmente</CardTitle>
              <CardDescription>
                Escribe o pega tu código directamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code-input">Código</Label>
                <Textarea
                  id="code-input"
                  placeholder="// Escribe tu código aquí...
function ejemplo() {
  console.log('Hola mundo');
}"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
              <Button onClick={handleTextSubmit} className="w-full">
                Cargar Código
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 