'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Info,
  Check,
  XCircle,
  FileText,
  BarChart3,
  Code2,
  Table,
  Play,
  Bug
} from 'lucide-react';
import { getCodeStats } from '@/lib/code-analyzer';
import { analyzeCode } from '@/lib/compiler-analyzer';
import { useMemo } from 'react';

interface CodeAnalysisProps {
  code: string;
  markers: any[];
  language: string;
}

export default function CodeAnalysis({ code, markers, language }: CodeAnalysisProps) {
  const stats = getCodeStats(code);
  
  // Usar el nuevo analizador completo
  const compilerResult = useMemo(() => {
    if (!code.trim()) return null;
    return analyzeCode(code, language);
  }, [code, language]);

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getErrorBadgeVariant = (type: string) => {
    switch (type) {
      case 'lexico': return 'destructive';
      case 'sintactico': return 'secondary';
      case 'semantico': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="h-full bg-muted/20">
      <Tabs defaultValue="compiler" className="h-full">
        <div className="p-4 border-b border-border">
          <TabsList className="grid grid-cols-5 w-full text-xs">
            <TabsTrigger value="compiler">Compilador</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="symbols">Símbolos</TabsTrigger>
            <TabsTrigger value="execution">Ejecución</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-4rem)]">
          {/* Panel del Compilador */}
          <TabsContent value="compiler" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  Análisis del Compilador
                </CardTitle>
                <CardDescription>
                  Lenguaje detectado: {compilerResult?.language || language}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!compilerResult ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Code2 className="h-5 w-5 mr-2" />
                    Escribe código para comenzar el análisis
                  </div>
                ) : compilerResult.errors.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    ✅ Código sin errores - Listo para ejecución
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <StatCard 
                        title="Errores Léxicos" 
                        value={compilerResult.errors.filter(e => e.type === 'lexico').length.toString()}
                        variant="error"
                      />
                      <StatCard 
                        title="Errores Sintácticos" 
                        value={compilerResult.errors.filter(e => e.type === 'sintactico').length.toString()}
                        variant="warning"
                      />
                      <StatCard 
                        title="Errores Semánticos" 
                        value={compilerResult.errors.filter(e => e.type === 'semantico').length.toString()}
                        variant="info"
                      />
                    </div>
                    
                    <Separator />
                    
                    {compilerResult.errors.map((error, index) => (
                      <div key={index} className="rounded-md bg-card p-3 shadow-sm border border-border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            {getErrorIcon(error.severity)}
                            <div className="ml-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getErrorBadgeVariant(error.type)}>
                                  {error.type.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Línea {error.line}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{error.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Posición: {error.position} | Columna: {error.column}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Tokens */}
          <TabsContent value="tokens" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Tabla de Tokens
                </CardTitle>
                <CardDescription>
                  Análisis léxico - Clasificación de tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!compilerResult || compilerResult.tokens.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    No hay tokens para mostrar
                  </div>
                ) : (
                  <div className="space-y-2">
                    {compilerResult.tokens.map((token, index) => (
                      <div key={index} className="rounded-md bg-card p-2 shadow-sm border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {token.type}
                            </Badge>
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {token.value}
                            </code>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            L{token.line}:C{token.column}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Tabla de Símbolos */}
          <TabsContent value="symbols" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="h-5 w-5 text-primary" />
                  Tabla de Símbolos
                </CardTitle>
                <CardDescription>
                  Variables, funciones y constantes identificadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!compilerResult || compilerResult.symbolTable.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    No hay símbolos para mostrar
                  </div>
                ) : (
                  <div className="space-y-3">
                    {compilerResult.symbolTable.map((symbol, index) => (
                      <div key={index} className="rounded-md bg-card p-3 shadow-sm border border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {symbol.type}
                              </Badge>
                              {symbol.dataType && (
                                <Badge variant="secondary" className="text-xs">
                                  {symbol.dataType}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm">{symbol.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Ámbito: {symbol.scope} | Línea: {symbol.line}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Ejecución */}
          <TabsContent value="execution" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Resultado de Ejecución
                </CardTitle>
                <CardDescription>
                  Simulación de la ejecución del código
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!compilerResult ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    No hay código para ejecutar
                  </div>
                ) : !compilerResult.canExecute ? (
                  <div className="flex items-center justify-center py-6 text-red-500">
                    <XCircle className="h-5 w-5 mr-2" />
                    No se puede ejecutar - Hay errores en el código
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Código ejecutado exitosamente</span>
                    </div>
                    
                    <div className="bg-muted/50 rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">Salida:</h4>
                      <pre className="text-sm whitespace-pre-wrap">
                        {compilerResult.executionResult}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Estadísticas (existente) */}
          <TabsContent value="stats" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Estadísticas del código
                </CardTitle>
                <CardDescription>
                  Métricas y información sobre tu código
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Líneas de código" value={stats.lines.toString()} />
                    <StatCard title="Caracteres" value={stats.chars.toString()} />
                    <StatCard title="Palabras" value={stats.words.toString()} />
                    <StatCard title="Funciones" value={stats.functions.toString()} />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Complejidad del código</h3>
                    <div className="bg-secondary h-3 rounded-full w-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          stats.complexity < 30 
                            ? 'bg-green-500' 
                            : stats.complexity < 70 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(stats.complexity, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>Simple</span>
                      <span>Moderado</span>
                      <span>Complejo</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, variant }: { title: string; value: string; variant?: 'error' | 'warning' | 'info' }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'error': return 'border-red-200 bg-red-50 text-red-700';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-700';
      default: return 'bg-card border-border';
    }
  };

  return (
    <div className={`rounded-md p-3 border ${getVariantStyles()}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}