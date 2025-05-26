'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Bug,
  Zap,
  Eye,
  Brain,
  CheckCircle2
} from 'lucide-react';

// Usar el nuevo analizador mejorado
import { analyzeCodeEnhanced } from '@/lib/compiler-analyzer';
import { useMemo } from 'react';

interface CodeAnalysisProps {
  code: string;
  markers: any[];
  language: string;
}

export default function CodeAnalysis({ code, markers, language }: CodeAnalysisProps) {
  
  // Usar el nuevo analizador completo mejorado
  const compilerResult = useMemo(() => {
    // Evitar análisis innecesario en código vacío o muy pequeño
    if (!code.trim() || code.trim().length < 3) return null;
    
    try {
      return analyzeCodeEnhanced(code, language);
    } catch (error) {
      console.error('Error en análisis de código:', error);
      return null;
    }
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

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'lexical': return <Eye className="h-4 w-4" />;
      case 'syntax': return <Code2 className="h-4 w-4" />;
      case 'semantic': return <Brain className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPhaseProgress = (phase: any) => {
    if (!phase.completed) return 0;
    if (phase.errorsFound === 0) return 100;
    return Math.max(50, 100 - (phase.errorsFound * 10));
  };

  return (
    <div className="h-full bg-muted/20">
      <Tabs defaultValue="overview" className="h-full">
        <div className="p-4 border-b border-border">
          <TabsList className="grid grid-cols-5 w-full text-xs">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="symbols">Símbolos</TabsTrigger>
            <TabsTrigger value="errors">Errores</TabsTrigger>
            <TabsTrigger value="execution">Ejecución</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-4rem)]">
          {/* Panel de Resumen */}
          <TabsContent value="overview" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  Análisis del Compilador
                </CardTitle>
                <CardDescription>
                  Lenguaje detectado: {compilerResult?.language || language} | Estado: {' '}
                  {compilerResult?.canExecute ? (
                    <span className="text-green-600 font-medium">✅ Listo para ejecutar</span>
                  ) : (
                    <span className="text-red-600 font-medium">❌ Con errores</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!compilerResult ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Code2 className="h-5 w-5 mr-2" />
                    Escribe código para comenzar el análisis
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Fases del Compilador */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Fases del Compilador</h4>
                      
                      {/* Análisis Léxico */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon('lexical')}
                            <span className="text-sm font-medium">Análisis Léxico</span>
                            {compilerResult.analysisPhases.lexical.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {compilerResult.analysisPhases.lexical.tokensFound} tokens, {' '}
                            {compilerResult.analysisPhases.lexical.errorsFound} errores
                          </span>
                        </div>
                        <Progress value={getPhaseProgress(compilerResult.analysisPhases.lexical)} className="h-2" />
                      </div>

                      {/* Análisis Sintáctico */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon('syntax')}
                            <span className="text-sm font-medium">Análisis Sintáctico</span>
                            {compilerResult.analysisPhases.syntax.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {compilerResult.analysisPhases.syntax.nodesGenerated} nodos, {' '}
                            {compilerResult.analysisPhases.syntax.errorsFound} errores
                          </span>
                        </div>
                        <Progress value={getPhaseProgress(compilerResult.analysisPhases.syntax)} className="h-2" />
                      </div>

                      {/* Análisis Semántico */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon('semantic')}
                            <span className="text-sm font-medium">Análisis Semántico</span>
                            {compilerResult.analysisPhases.semantic.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {compilerResult.analysisPhases.semantic.symbolsFound} símbolos, {' '}
                            {compilerResult.analysisPhases.semantic.errorsFound} errores
                          </span>
                        </div>
                        <Progress value={getPhaseProgress(compilerResult.analysisPhases.semantic)} className="h-2" />
                      </div>
                    </div>

                    <Separator />

                    {/* Estadísticas Generales */}
                    <div className="grid grid-cols-3 gap-4">
                      <StatCard 
                        title="Total Errores" 
                        value={compilerResult.errors.length.toString()}
                        variant={compilerResult.errors.length === 0 ? "success" : "error"}
                        subtitle="En todas las fases"
                      />
                      <StatCard 
                        title="Tokens Léxicos" 
                        value={compilerResult.tokens.length.toString()}
                        variant="info"
                        subtitle="Elementos identificados"
                      />
                      <StatCard 
                        title="Símbolos" 
                        value={compilerResult.symbolTable.length.toString()}
                        variant="info"
                        subtitle="Variables y funciones"
                      />
                    </div>

                    {/* Resumen de Errores por Tipo */}
                    {compilerResult.errors.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Resumen de Errores</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <StatCard 
                              title="Léxicos" 
                              value={compilerResult.errors.filter(e => e.type === 'lexico').length.toString()}
                              variant="error"
                              subtitle="Tokens no reconocidos"
                            />
                            <StatCard 
                              title="Sintácticos" 
                              value={compilerResult.errors.filter(e => e.type === 'sintactico').length.toString()}
                              variant="warning"
                              subtitle="Estructura incorrecta"
                            />
                            <StatCard 
                              title="Semánticos" 
                              value={compilerResult.errors.filter(e => e.type === 'semantico').length.toString()}
                              variant="info"
                              subtitle="Lógica del código"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Tokens Mejorado */}
          <TabsContent value="tokens" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Tabla de Tokens (Análisis Léxico)
                </CardTitle>
                <CardDescription>
                  Clasificación detallada de tokens con categorías y tipos específicos
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
                      <div key={index} className="rounded-md bg-card p-3 shadow-sm border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {token.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
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

          {/* Panel de Tabla de Símbolos Mejorado */}
          <TabsContent value="symbols" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="h-5 w-5 text-primary" />
                  Tabla de Símbolos (Análisis Semántico)
                </CardTitle>
                <CardDescription>
                  Variables, funciones, clases y constantes con información de tipos y alcance
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
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {symbol.type}
                              </Badge>
                              {symbol.dataType && (
                                <Badge variant="secondary" className="text-xs">
                                  {symbol.dataType}
                                </Badge>
                              )}
                              {symbol.isConstant && (
                                <Badge variant="default" className="text-xs">
                                  CONST
                                </Badge>
                              )}
                              {symbol.isUsed && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  USADO
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm">{symbol.name}</p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Ámbito: {symbol.scope} | Línea: {symbol.line}</p>
                              {symbol.parameters && symbol.parameters.length > 0 && (
                                <p>Parámetros: {symbol.parameters.map(p => `${p.name}: ${p.dataType}`).join(', ')}</p>
                              )}
                              {symbol.returnType && (
                                <p>Retorna: {symbol.returnType}</p>
                              )}
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

          {/* Panel de Errores Detallados */}
          <TabsContent value="errors" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Errores y Advertencias
                </CardTitle>
                <CardDescription>
                  Detalles completos de errores encontrados en cada fase del compilador
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!compilerResult || compilerResult.errors.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    ✅ No se encontraron errores
                  </div>
                ) : (
                  <div className="space-y-4">
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
                                  {error.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Línea {error.line}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{error.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Posición: {error.position} | Columna: {error.column}
                              </p>
                              {error.context && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Contexto: {error.context}
                                </p>
                              )}
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

          {/* Panel de Ejecución Mejorado */}
          <TabsContent value="execution" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Simulación de Ejecución
                </CardTitle>
                <CardDescription>
                  Resultado de la ejecución simulada del código analizado
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
                      <span className="font-medium">
                        Código ejecutado exitosamente {compilerResult.executionResult?.success ? '✅' : '❌'}
                      </span>
                    </div>
                    
                    {compilerResult.executionResult && (
                      <div className="bg-muted/50 rounded-md p-4">
                        <h4 className="text-sm font-medium mb-2">Salida de Ejecución:</h4>
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {compilerResult.executionResult.output}
                        </pre>
                        
                        {compilerResult.executionResult.executedCommands.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <h5 className="text-xs font-medium mb-2">Comandos Ejecutados:</h5>
                            <div className="space-y-1">
                              {compilerResult.executionResult.executedCommands.map((cmd, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                                  {cmd}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {compilerResult.executionResult.errors.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <h5 className="text-xs font-medium mb-2 text-red-600">Errores de Ejecución:</h5>
                            <div className="space-y-1">
                              {compilerResult.executionResult.errors.map((err, idx) => (
                                <p key={idx} className="text-xs text-red-600">{err}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </ScrollArea>
      </Tabs>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  variant, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  variant?: 'error' | 'warning' | 'info' | 'success'; 
  subtitle?: string;
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'error': return 'border-red-200 bg-red-50 text-red-700';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'success': return 'border-green-200 bg-green-50 text-green-700';
      default: return 'bg-card border-border';
    }
  };

  return (
    <div className={`rounded-md p-3 border ${getVariantStyles()}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {subtitle && (
        <p className="text-xs opacity-80 mt-1">{subtitle}</p>
      )}
    </div>
  );
}