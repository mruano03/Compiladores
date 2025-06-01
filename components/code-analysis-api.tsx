'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Info,
  XCircle,
  Code2,
  Table,
  Play,
  Bug,
  Zap,
  Eye,
  Brain,
  CheckCircle2,
  Server,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

import { useCompilerAnalysis } from '@/hooks/use-compiler-analysis';

interface ErrorMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number;
  source: string;
}

interface AnalysisPhase {
  completed: boolean;
  tokensFound?: number;
  errorsFound?: number;
  nodesGenerated?: number;
  symbolsFound?: number;
}

interface CodeAnalysisAPIProps {
  code: string;
  language: string;
  shouldAnalyze?: boolean;
  onAnalysisComplete?: (canExecute: boolean) => void;
  onMarkersUpdate?: (markers: ErrorMarker[]) => void;
}

const CodeAnalysisAPI = React.memo(({ 
  code, 
  language, 
  shouldAnalyze = false,
  onAnalysisComplete,
  onMarkersUpdate
}: CodeAnalysisAPIProps) => {
  
  const { 
    result, 
    isAnalyzing, 
    isServerOnline, 
    error, 
    analyzeCode, 
    checkServer 
  } = useCompilerAnalysis();

  // Ejecutar análisis cuando se solicite
  useEffect(() => {
    if (shouldAnalyze && code && code.length > 0) {
      analyzeCode(code, language);
    }
  }, [shouldAnalyze, code, language, analyzeCode]);

  // Notificar cuando el análisis se complete
  useEffect(() => {
    if (result && onAnalysisComplete) {
      const canExecute = result.canExecute;
      onAnalysisComplete(canExecute);
    }
  }, [result, onAnalysisComplete]);

  // Memoizar el cálculo de marcadores
  const markers = useMemo(() => {
    if (result && result.errors) {
      return result.errors
        .filter(error => error.line > 0)
        .map(error => {
          // Asignar severidad basándose en el tipo de error para colores diferentes
          let severity: number;
          switch (error.type) {
            case 'lexico':
              // Errores léxicos - Rojo (8 = Error) - Problemas fundamentales de tokens
              severity = 8;
              break;
            case 'sintactico':
              // Errores sintácticos - Amarillo (4 = Warning) - Problemas de estructura
              severity = 4;
              break;
            case 'semantico':
              // Errores semánticos - Azul (2 = Info) - Problemas de significado
              severity = 2;
              break;
            default:
              // Fallback basándose en severidad original
              severity = error.severity === 'error' ? 8 : error.severity === 'warning' ? 4 : 2;
          }

          return {
            startLineNumber: error.line,
            startColumn: error.column || 1,
            endLineNumber: error.line,
            endColumn: (error.column || 1) + Math.max(10, error.message.length / 2),
            message: `${error.type.toUpperCase()}: ${error.message}`,
            severity: severity,
            source: 'compilador'
          };
        });
    }
    return [];
  }, [result]);

  // Efecto para enviar marcadores de errores al editor
  useEffect(() => {
    if (onMarkersUpdate) {
      onMarkersUpdate(markers);
    }
  }, [markers, onMarkersUpdate]);

  const getErrorIcon = useCallback((type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  }, []);

  const getErrorBadgeVariant = useCallback((type: string) => {
    switch (type) {
      case 'lexico': return 'destructive';
      case 'sintactico': return 'secondary';
      case 'semantico': return 'outline';
      default: return 'default';
    }
  }, []);

  const getPhaseIcon = useCallback((phase: string) => {
    switch (phase) {
      case 'lexical': return <Eye className="h-4 w-4" />;
      case 'syntax': return <Code2 className="h-4 w-4" />;
      case 'semantic': return <Brain className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  }, []);

  const getPhaseProgress = useCallback((phase: AnalysisPhase | undefined) => {
    if (!phase || !phase.completed) return 0;
    if ((phase.errorsFound || 0) === 0) return 100;
    return Math.max(50, 100 - ((phase.errorsFound || 0) * 10));
  }, []);

  // Memoizar arrays estáticos
  const errorTypes = useMemo(() => ['lexico', 'sintactico', 'semantico'], []);
  const tokenTypes = useMemo(() => ['KEYWORD', 'IDENTIFIER', 'NUMBER', 'STRING', 'OPERATOR', 'DELIMITER'], []);
  const symbolTypes = useMemo(() => ['function', 'variable', 'class', 'constant'], []);

  return (
    <div className="h-full bg-muted/20">
      <Tabs defaultValue="overview" className="h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="text-sm font-medium">Estado del Servidor:</span>
              {isServerOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="h-3 w-3" />
                  <span className="text-xs">Desconectado</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkServer}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
          </div>

          {error && (
            <Alert className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsList className="grid grid-cols-5 w-full text-xs">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="symbols">Símbolos</TabsTrigger>
            <TabsTrigger value="errors">Errores</TabsTrigger>
            <TabsTrigger value="execution">Ejecución</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-8rem)]">
          {/* Panel de Resumen */}
          <TabsContent value="overview" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  Análisis del Compilador
                </CardTitle>
                <CardDescription>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">🔍 Lenguaje:</span>
                        <Badge variant="secondary" className="font-medium">
                          {result?.language === 'unknown' ? 'No determinado' : (result?.language || language).toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">⚡ Estado:</span>
                        {result?.canExecute ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                            ✅ Listo para ejecutar
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            ❌ Con errores críticos
                          </Badge>
                        )}
                      </div>
                        
                    </div>
                    
                   
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                        Analizando código con el servidor...
                      </>
                    ) : code && code.length > 0 ? (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Presiona "Ejecutar Compilador" para analizar el código
                      </>
                    ) : (
                      <>
                        <Code2 className="h-5 w-5 mr-2" />
                        Escribe código para comenzar el análisis
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Fases del Compilador */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">🔧 Fases del Compilador</h4>
                        <Badge variant="outline" className="text-xs">
                          Análisis Completo
                        </Badge>
                      </div>
                      

                      
                      {/* Análisis Léxico */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon('lexical')}
                            <span className="text-sm font-medium">Análisis Léxico</span>
                            {result.analysisPhases?.lexical?.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.analysisPhases?.lexical?.tokensFound || 0} tokens, {' '}
                            {result.analysisPhases?.lexical?.errorsFound || 0} errores
                          </span>
                        </div>
                        <Progress value={getPhaseProgress(result.analysisPhases?.lexical)} className="h-2" />
                      </div>

                      {/* Análisis Sintáctico */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon('syntax')}
                            <span className="text-sm font-medium">Análisis Sintáctico</span>
                            {result.analysisPhases?.syntax?.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.analysisPhases?.syntax?.nodesGenerated || 0} nodos, {' '}
                            {result.analysisPhases?.syntax?.errorsFound || 0} errores
                          </span>
                        </div>
                        <Progress value={getPhaseProgress(result.analysisPhases?.syntax)} className="h-2" />
                      </div>

                      {/* Análisis Semántico */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPhaseIcon('semantic')}
                            <span className="text-sm font-medium">Análisis Semántico</span>
                            {result.analysisPhases?.semantic?.completed && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.analysisPhases?.semantic?.symbolsFound || 0} símbolos, {' '}
                            {result.analysisPhases?.semantic?.errorsFound || 0} errores
                          </span>
                        </div>
                        <Progress value={getPhaseProgress(result.analysisPhases?.semantic)} className="h-2" />
                      </div>
                    </div>

                    {/* Resumen de Errores por Fase */}
                    {result.errors && result.errors.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-red-600 dark:text-red-400">🚨 Diagnóstico de Errores</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {result.errors.length} problema{result.errors.length > 1 ? 's' : ''} total{result.errors.length > 1 ? 'es' : ''}
                            </Badge>
                            {result.canExecute && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                Sin errores críticos
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Explicación de severidades */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Información sobre severidades
                            </span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <div>• <strong>Error:</strong> Impide la ejecución del código</div>
                            <div>• <strong>Warning:</strong> Advertencia, pero permite ejecución</div>
                            <div>• <strong>Info:</strong> Información adicional, no afecta ejecución</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {errorTypes.map(errorType => {
                            const errorsOfType = result.errors?.filter(e => e.type === errorType) || [];
                            if (errorsOfType.length === 0) return null;
                            
                            // Contar errores por severidad
                            const criticalErrors = errorsOfType.filter(e => e.severity === 'error').length;
                            const warnings = errorsOfType.filter(e => e.severity === 'warning').length;
                            const infos = errorsOfType.filter(e => e.severity === 'info').length;
                            
                            return (
                              <div key={errorType} className="bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {errorType.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {errorsOfType.length} problema{errorsOfType.length > 1 ? 's' : ''} encontrado{errorsOfType.length > 1 ? 's' : ''}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    Fase {errorType === 'lexico' ? '1' : errorType === 'sintactico' ? '2' : '3'}
                                  </Badge>
                                  {criticalErrors > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {criticalErrors} crítico{criticalErrors > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {warnings > 0 && (
                                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                                      {warnings} warning{warnings > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                  {infos > 0 && (
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                      {infos} info{infos > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {errorsOfType.slice(0, 3).map((error, idx) => {
                                    const severityStyles = {
                                      error: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
                                      warning: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
                                      info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                                    };
                                    
                                    return (
                                      <div key={`${errorType}-${idx}`} className={`text-xs rounded p-2 border ${severityStyles[error.severity as keyof typeof severityStyles] || severityStyles.error}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-mono text-xs bg-white dark:bg-gray-900 px-1 rounded border">
                                            L{error.line}:C{error.column}
                                          </span>
                                          <Badge 
                                            variant={error.severity === 'error' ? 'destructive' : 'outline'} 
                                            className={`text-xs ${
                                              error.severity === 'warning' ? 'text-yellow-600 border-yellow-600' :
                                              error.severity === 'info' ? 'text-blue-600 border-blue-600' : ''
                                            }`}
                                          >
                                            {error.severity}
                                          </Badge>
                                        </div>
                                        <div>{error.message}</div>
                                      </div>
                                    );
                                  })}
                                  {errorsOfType.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-1">
                                      ... y {errorsOfType.length - 3} problema{errorsOfType.length - 3 > 1 ? 's' : ''} más (ver panel de Errores)
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                         
                      </div>
                    )}

                    {/* Estadísticas Académicas */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">📊 Métricas del Análisis</h4>
                        <Badge variant="outline" className="text-xs">
                          Resultados Cuantitativos
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard 
                          title="Tokens Identificados" 
                          value={(result.tokens?.length || 0).toString()}
                          variant="info"
                          subtitle="Elementos léxicos encontrados"
                        />
                        <StatCard 
                          title="Errores Detectados" 
                          value={(result.errors?.length || 0).toString()}
                          variant={(result.errors?.length || 0) > 0 ? "error" : "success"}
                          subtitle={`${result.errors?.filter(e => e.type === 'lexico').length || 0} léx, ${result.errors?.filter(e => e.type === 'sintactico').length || 0} sint, ${result.errors?.filter(e => e.type === 'semantico').length || 0} sem`}
                        />
                        <StatCard 
                          title="Tabla de Símbolos" 
                          value={(result.symbolTable?.length || 0).toString()}
                          variant="info"
                          subtitle="Variables, funciones, clases"
                        />
                        <StatCard 
                          title="Árbol Sintáctico" 
                          value={(result.parseTree?.length || 0).toString()}
                          variant="info"
                          subtitle="Nodos del AST generados"
                        />
                      </div>
                      
                      {/* Clasificación de tokens por tipo */}
                      {result.tokens && result.tokens.length > 0 && (
                        <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground space-y-2">
                            <div className="font-medium text-foreground mb-2">🏷️ Clasificación de Tokens:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {tokenTypes.map(tokenType => {
                                const count = result.tokens?.filter(t => t.type === tokenType).length || 0;
                                if (count === 0) return null;
                                return (
                                  <div key={tokenType} className="flex justify-between">
                                    <span className="capitalize">{tokenType.toLowerCase()}:</span>
                                    <span className="font-mono">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Información sobre símbolos */}
                      {result.symbolTable && result.symbolTable.length > 0 && (
                        <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground space-y-2">
                            <div className="font-medium text-foreground mb-2">🔍 Análisis de Símbolos:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {symbolTypes.map(symbolType => {
                                const count = result.symbolTable?.filter(s => s.category === symbolType).length || 0;
                                if (count === 0) return null;
                                return (
                                  <div key={symbolType} className="flex justify-between">
                                    <span className="capitalize">{symbolType}s:</span>
                                    <span className="font-mono">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                                             )}
                       
                       {/* Estado del Compilador */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <h4 className="text-sm font-medium">⚙️ Estado del Compilador</h4>
                           <Badge variant="outline" className="text-xs">
                             Progreso del Análisis
                           </Badge>
                         </div>
                         
                         <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                           <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                             <div className="font-medium text-slate-800 dark:text-slate-200 mb-2">📋 Estado de las Fases:</div>
                             <div className="space-y-1">
                               <div className="flex justify-between">
                                 <span>Análisis Léxico:</span>
                                 <Badge variant={result?.analysisPhases?.lexical?.completed ? "default" : "secondary"} className="text-xs">
                                   {result?.analysisPhases?.lexical?.completed ? "✅ Completado" : "⏳ Pendiente"}
                                 </Badge>
                               </div>
                               <div className="flex justify-between">
                                 <span>Análisis Sintáctico:</span>
                                 <Badge variant={result?.analysisPhases?.syntax?.completed ? "default" : "secondary"} className="text-xs">
                                   {result?.analysisPhases?.syntax?.completed ? "✅ Completado" : "⏳ Pendiente"}
                                 </Badge>
                               </div>
                               <div className="flex justify-between">
                                 <span>Análisis Semántico:</span>
                                 <Badge variant={result?.analysisPhases?.semantic?.completed ? "default" : "secondary"} className="text-xs">
                                   {result?.analysisPhases?.semantic?.completed ? "✅ Completado" : "⏳ Pendiente"}
                                 </Badge>
                               </div>
                               <div className="flex justify-between">
                                 <span>Listo para Ejecución:</span>
                                 <Badge variant={result?.canExecute ? "default" : "destructive"} className="text-xs">
                                   {result?.canExecute ? "✅ Sí" : "❌ No"}
                                 </Badge>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Tokens */}
          <TabsContent value="tokens" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Tokens Léxicos ({result?.tokens?.length || 0})
                </CardTitle>
                <CardDescription>
                  Análisis léxico del código fuente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result?.tokens?.length ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.tokens?.map((token, index) => (
                      <div key={`token-${index}-${token.type}-${token.line}-${token.column}`} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{token.type}</Badge>
                          <code className="text-sm">{token.value}</code>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Línea {token.line}, Col {token.column}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No hay tokens para mostrar
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Símbolos */}
          <TabsContent value="symbols" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Tabla de Símbolos ({result?.symbolTable?.length || 0})
                </CardTitle>
                <CardDescription>
                  Variables, funciones y clases identificadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result?.symbolTable?.length ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.symbolTable?.map((symbol, index) => (
                      <div key={`symbol-${index}-${symbol.name}-${symbol.line}`} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{symbol.category}</Badge>
                          <span className="font-medium">{symbol.name}</span>
                          <span className="text-sm text-muted-foreground">({symbol.type})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Scope: {symbol.scope}</div>
                          <div className="text-xs text-muted-foreground">Línea {symbol.line}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No hay símbolos para mostrar
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Errores */}
          <TabsContent value="errors" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Errores y Advertencias ({result?.errors?.length || 0})
                </CardTitle>
                <CardDescription>
                  Problemas encontrados durante el análisis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result?.errors?.length ? (
                  <div className="space-y-4">
                    {/* Resumen general de errores */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {errorTypes.map(errorType => {
                        const count = result.errors?.filter(e => e.type === errorType).length || 0;
                        return (
                          <div key={errorType} className={`p-3 rounded border text-center ${
                            count > 0 
                              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
                              : 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
                          }`}>
                            <div className={`text-lg font-bold ${
                              count > 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {count}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {errorType}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explicación académica */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📚 Información Académica</h5>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <div><strong>Léxico:</strong> Errores en tokens, caracteres no reconocidos, palabras mal formadas</div>
                        <div><strong>Sintáctico:</strong> Errores en la estructura, orden incorrecto de símbolos</div>
                        <div><strong>Semántico:</strong> Errores de significado, variables no declaradas, tipos incompatibles</div>
                      </div>
                    </div>

                    {/* Tabs para categorías de errores */}
                    <Tabs defaultValue="lexico" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="lexico" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Léxicos ({result.errors?.filter(e => e.type === 'lexico').length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="sintactico" className="text-xs">
                          <Code2 className="h-3 w-3 mr-1" />
                          Sintácticos ({result.errors?.filter(e => e.type === 'sintactico').length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="semantico" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          Semánticos ({result.errors?.filter(e => e.type === 'semantico').length || 0})
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab de Errores Léxicos */}
                      <TabsContent value="lexico" className="mt-4">
                        <div className="space-y-3">
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded p-3">
                            <h6 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Análisis Léxico
                            </h6>
                            <div className="text-xs text-red-700 dark:text-red-300">
                              Los errores léxicos ocurren cuando el analizador léxico no puede reconocer un token válido. 
                              Esto incluye caracteres ilegales, strings mal cerrados, números malformados, etc.
                            </div>
                          </div>
                          
                          {result.errors?.filter(e => e.type === 'lexico').length > 0 ? (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {result.errors?.filter(e => e.type === 'lexico').map((error, index) => (
                                <div key={`lexico-error-${index}`} className="flex items-start gap-2 p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-900/50">
                                  {getErrorIcon(error.severity)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="destructive" className="text-xs">
                                        LÉXICO
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {error.severity.toUpperCase()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        📍 Línea {error.line}, Columna {error.column} (Pos: {error.position})
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{error.message}</p>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      <strong>Contexto:</strong> El analizador léxico no pudo procesar el carácter o secuencia en la posición {error.position}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-12 w-12 mx-auto mb-3" />
                              <div className="font-medium">¡Sin errores léxicos!</div>
                              <div className="text-sm text-muted-foreground">Todos los tokens fueron reconocidos correctamente</div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Tab de Errores Sintácticos */}
                      <TabsContent value="sintactico" className="mt-4">
                        <div className="space-y-3">
                          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                            <h6 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                              <Code2 className="h-4 w-4" />
                              Análisis Sintáctico
                            </h6>
                            <div className="text-xs text-yellow-700 dark:text-yellow-300">
                              Los errores sintácticos se producen cuando la secuencia de tokens no respeta la gramática del lenguaje. 
                              Incluyen paréntesis no balanceados, palabras clave en lugares incorrectos, estructuras incompletas, etc.
                            </div>
                          </div>
                          
                          {result.errors?.filter(e => e.type === 'sintactico').length > 0 ? (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {result.errors?.filter(e => e.type === 'sintactico').map((error, index) => (
                                <div key={`sintactico-error-${index}`} className="flex items-start gap-2 p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-900/50">
                                  {getErrorIcon(error.severity)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-xs">
                                        SINTÁCTICO
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {error.severity.toUpperCase()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        📍 Línea {error.line}, Columna {error.column} (Pos: {error.position})
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{error.message}</p>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      <strong>Contexto:</strong> La estructura sintáctica no cumple con las reglas gramaticales del lenguaje
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-12 w-12 mx-auto mb-3" />
                              <div className="font-medium">¡Sin errores sintácticos!</div>
                              <div className="text-sm text-muted-foreground">La estructura del código es sintácticamente correcta</div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Tab de Errores Semánticos */}
                      <TabsContent value="semantico" className="mt-4">
                        <div className="space-y-3">
                          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded p-3">
                            <h6 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                              <Brain className="h-4 w-4" />
                              Análisis Semántico
                            </h6>
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              Los errores semánticos se detectan cuando el código es sintácticamente correcto pero carece de sentido semántico. 
                              Incluyen variables no declaradas, tipos incompatibles, funciones no definidas, violaciones de scope, etc.
                            </div>
                          </div>
                          
                          {result.errors?.filter(e => e.type === 'semantico').length > 0 ? (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                              {result.errors?.filter(e => e.type === 'semantico').map((error, index) => (
                                <div key={`semantico-error-${index}`} className="flex items-start gap-2 p-3 border dark:border-gray-700 rounded bg-white dark:bg-gray-900/50">
                                  {getErrorIcon(error.severity)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs border-purple-500 text-purple-700 dark:text-purple-300">
                                        SEMÁNTICO
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {error.severity.toUpperCase()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        📍 Línea {error.line}, Columna {error.column} (Pos: {error.position})
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{error.message}</p>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      <strong>Contexto:</strong> El significado semántico del código presenta inconsistencias o violaciones de reglas
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-12 w-12 mx-auto mb-3" />
                              <div className="font-medium">¡Sin errores semánticos!</div>
                              <div className="text-sm text-muted-foreground">El código tiene un significado semántico correcto</div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>

                  </div>
                ) : (
                  <div className="text-center py-6 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-medium">¡No se encontraron errores!</div>
                    <div className="text-sm text-muted-foreground">El código pasó todas las fases de análisis sin problemas</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Panel de Ejecución */}
          <TabsContent value="execution" className="p-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Resultado de Ejecución
                </CardTitle>
                <CardDescription>
                  Simulación de la ejecución del código
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result?.executionResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {result.executionResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {result.executionResult.success ? 'Ejecución exitosa' : 'Error en ejecución'}
                      </span>
                    </div>
                    
                    {result.executionResult.output && (
                      <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{result.executionResult.output}</pre>
                      </div>
                    )}
                    
                    {result.executionResult.error && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <p className="text-red-700 text-sm">{result.executionResult.error}</p>
                      </div>
                    )}
                  </div>
                ) : result?.canExecute === false ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    El código no se puede ejecutar debido a errores
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Play className="h-8 w-8 mx-auto mb-2" />
                    Ejecuta el análisis para ver los resultados
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
});

CodeAnalysisAPI.displayName = 'CodeAnalysisAPI';

// Componente auxiliar para estadísticas
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
      case 'error': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30';
      case 'warning': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30';
      case 'success': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30';
      default: return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'error': return 'text-red-900 dark:text-red-900';
      case 'warning': return 'text-yellow-900 dark:text-yellow-900';
      case 'success': return 'text-green-900 dark:text-green-900';
      default: return 'text-blue-900 dark:text-blue-900';
    }
  };

  return (
    <div className={`p-3 rounded border ${getVariantStyles()}`}>
      <div className={`text-2xl font-bold ${getTextStyles()}`}>{value}</div>
      <div className={`text-sm font-medium ${getTextStyles()}`}>{title}</div>
      {subtitle && <div className={`text-xs ${getTextStyles()} opacity-90`}>{subtitle}</div>}
    </div>
  );
}

export default CodeAnalysisAPI; 