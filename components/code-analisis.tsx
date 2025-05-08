'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Info,
  Check,
  XCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { getCodeStats } from '@/lib/code-analyzer';

interface CodeAnalysisProps {
  code: string;
  markers: any[];
  language: string;
}

export default function CodeAnalysis({ code, markers, language }: CodeAnalysisProps) {
  const stats = getCodeStats(code);

  return (
    <div className="h-full bg-muted/20">
      <Tabs defaultValue="issues" className="h-full">
        <div className="p-4 border-b border-border">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="issues">Errores</TabsTrigger>
            <TabsTrigger value="stats">Estadisticas</TabsTrigger>
            <TabsTrigger value="structure">Estructura</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-4rem)]">
          <TabsContent value="issues" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Resultados del analisis
                </CardTitle>
                <CardDescription>
                  Analisis para el codigo {language}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {markers.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    No se encontraron errores
                  </div>
                ) : (
                  <div className="space-y-4">
                    {markers.map((marker, index) => (
                      <div key={index} className="rounded-md bg-card p-3 shadow-sm border border-border">
                        <div className="flex items-start">
                          {marker.type === 'error' ? (
                            <XCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                          ) : marker.type === 'warning' ? (
                            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">
                              {marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {marker.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Posicion: {marker.position}
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

          <TabsContent value="stats" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Estadisticas del codigo
                </CardTitle>
                <CardDescription>
                  Metricas y informacion sobre tu codigo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Lines of Code" value={stats.lines.toString()} />
                    <StatCard title="Characters" value={stats.chars.toString()} />
                    <StatCard title="Words" value={stats.words.toString()} />
                    <StatCard title="Functions" value={stats.functions.toString()} />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Complejidad del codigo</h3>
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

          <TabsContent value="structure" className="p-4 m-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Estructura del codigo
                </CardTitle>
                <CardDescription>
                  Analisis de la organizacion del codigo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.structure.map((item, index) => (
                    <div key={index} className="rounded-md bg-card p-3 shadow-sm border border-border">
                      <p className="font-medium text-sm">{item.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.name}
                        {item.params && <span className="text-blue-400"> ({item.params})</span>}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Line: {item.line}
                      </p>
                    </div>
                  ))}
                  
                  {stats.structure.length === 0 && (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      No se encontraron elementos de estructura
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-card rounded-md p-3 border border-border">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}