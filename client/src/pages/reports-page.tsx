import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Dados simulados para os relatórios
const messageStatusData = [
  { name: 'Enviadas', value: 420, color: '#4f46e5' },
  { name: 'Entregues', value: 380, color: '#10b981' },
  { name: 'Lidas', value: 310, color: '#f59e0b' },
  { name: 'Respondidas', value: 125, color: '#6366f1' },
];

const weekdayData = [
  { name: 'Segunda', messages: 65 },
  { name: 'Terça', messages: 78 },
  { name: 'Quarta', messages: 90 },
  { name: 'Quinta', messages: 81 },
  { name: 'Sexta', messages: 56 },
  { name: 'Sábado', messages: 38 },
  { name: 'Domingo', messages: 40 },
];

const hourlyData = [
  { hour: '08:00', messages: 12 },
  { hour: '09:00', messages: 18 },
  { hour: '10:00', messages: 25 },
  { hour: '11:00', messages: 31 },
  { hour: '12:00', messages: 22 },
  { hour: '13:00', messages: 18 },
  { hour: '14:00', messages: 29 },
  { hour: '15:00', messages: 34 },
  { hour: '16:00', messages: 30 },
  { hour: '17:00', messages: 26 },
  { hour: '18:00', messages: 20 },
  { hour: '19:00', messages: 15 },
  { hour: '20:00', messages: 10 },
];

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    }
  });

  if (authLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const isLoading = statsLoading;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold">Relatórios e Análises</h2>
              <div className="mt-2 sm:mt-0">
                <Button variant="outline" className="mr-2">
                  <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
                <Button>Gerar Novo Relatório</Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="contacts">Contatos</TabsTrigger>
              <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status das Mensagens</CardTitle>
                    <CardDescription>Distribuição das mensagens por status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={messageStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {messageStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="vertical" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mensagens por Dia da Semana</CardTitle>
                    <CardDescription>Total de mensagens enviadas por dia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weekdayData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="messages" fill="#4f46e5" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição Horária</CardTitle>
                  <CardDescription>Mensagens enviadas por hora do dia</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="messages" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Mensagens</CardTitle>
                  <CardDescription>Detalhes sobre as mensagens enviadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-12">
                    <h3 className="text-lg font-medium">Relatório Detalhado de Mensagens</h3>
                    <p className="text-muted-foreground mt-2">
                      Esta funcionalidade estará disponível em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Contatos</CardTitle>
                  <CardDescription>Informações sobre sua base de contatos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-12">
                    <h3 className="text-lg font-medium">Relatório Detalhado de Contatos</h3>
                    <p className="text-muted-foreground mt-2">
                      Esta funcionalidade estará disponível em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Campanhas</CardTitle>
                  <CardDescription>Desempenho das suas campanhas de mensagens</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-12">
                    <h3 className="text-lg font-medium">Relatório Detalhado de Campanhas</h3>
                    <p className="text-muted-foreground mt-2">
                      Esta funcionalidade estará disponível em breve.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}