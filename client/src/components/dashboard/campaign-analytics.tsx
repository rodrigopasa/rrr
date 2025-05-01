import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Users, MessageSquare, ArrowDown, ArrowUp, Smartphone, TrendingUp, Calendar, Download, BarChart3, LineChart as LineChartIcon } from "lucide-react";

// Tipos
interface CampaignData {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: "active" | "completed" | "pending";
  totalMessages: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  groups: number;
  recipients: number;
}

interface TimeSeriesData {
  date: string;
  messages: number;
  opens: number;
  clicks: number;
  responses: number;
}

interface MetricCard {
  title: string;
  value: number | string;
  description: string;
  change: number;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
}

export default function CampaignAnalytics() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Buscar dados das campanhas
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<CampaignData[]>({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/campaigns");
        if (!res.ok) throw new Error("Falha ao buscar dados das campanhas");
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar campanhas:", error);
        return [];
      }
    },
  });

  // Buscar dados de histórico da campanha selecionada
  const { data: timeSeriesData = [], isLoading: isLoadingTimeSeries } = useQuery<TimeSeriesData[]>({
    queryKey: ["/api/campaigns/timeseries", { campaignId: selectedCampaign, timeRange }],
    queryFn: async () => {
      try {
        const res = await fetch(
          `/api/campaigns/timeseries?campaignId=${selectedCampaign}&timeRange=${timeRange}`
        );
        if (!res.ok) throw new Error("Falha ao buscar dados históricos");
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar dados históricos:", error);
        return [];
      }
    },
  });

  // Calcular métricas para a campanha selecionada
  const getMetrics = (): MetricCard[] => {
    if (selectedCampaign === "all") {
      // Métricas para todas as campanhas
      const totalMessages = campaigns.reduce((sum, campaign) => sum + campaign.totalMessages, 0);
      const avgDeliveryRate =
        campaigns.reduce((sum, campaign) => sum + campaign.deliveryRate, 0) / (campaigns.length || 1);
      const totalGroups = campaigns.reduce((sum, campaign) => sum + campaign.groups, 0);
      const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.recipients, 0);
      
      return [
        {
          title: "Total de Mensagens",
          value: totalMessages.toLocaleString(),
          description: "Mensagens enviadas",
          change: 12.5,
          icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
          trend: "up",
        },
        {
          title: "Taxa de Entrega",
          value: `${avgDeliveryRate.toFixed(1)}%`,
          description: "Média de todas campanhas",
          change: 2.1,
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
          trend: "up",
        },
        {
          title: "Grupos Ativos",
          value: totalGroups.toLocaleString(),
          description: "Total de grupos",
          change: 5.3,
          icon: <Users className="h-5 w-5 text-indigo-500" />,
          trend: "up",
        },
        {
          title: "Total de Destinatários",
          value: totalRecipients.toLocaleString(),
          description: "Alcance estimado",
          change: 8.7,
          icon: <Smartphone className="h-5 w-5 text-orange-500" />,
          trend: "up",
        },
      ];
    } else {
      // Métricas para uma campanha específica
      const campaign = campaigns.find((c) => c.id === selectedCampaign);
      if (!campaign) return [];
      
      return [
        {
          title: "Mensagens Enviadas",
          value: campaign.totalMessages.toLocaleString(),
          description: `Desde ${new Date(campaign.startDate).toLocaleDateString()}`,
          change: 12.5,
          icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
          trend: "up",
        },
        {
          title: "Taxa de Entrega",
          value: `${campaign.deliveryRate.toFixed(1)}%`,
          description: "Das mensagens enviadas",
          change: campaign.deliveryRate > 95 ? 1.5 : -1.2,
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
          trend: campaign.deliveryRate > 95 ? "up" : "down",
        },
        {
          title: "Taxa de Abertura",
          value: `${campaign.openRate.toFixed(1)}%`,
          description: "Mensagens visualizadas",
          change: campaign.openRate > 40 ? 3.2 : -2.1,
          icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
          trend: campaign.openRate > 40 ? "up" : "down",
        },
        {
          title: "Taxa de Cliques",
          value: `${campaign.clickRate.toFixed(1)}%`,
          description: "Em links na mensagem",
          change: campaign.clickRate > 10 ? 5.7 : -3.2,
          icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
          trend: campaign.clickRate > 10 ? "up" : "down",
        },
      ];
    }
  };

  const metrics = getMetrics();

  // Renderizar card de métrica
  const renderMetricCard = (metric: MetricCard, index: number) => (
    <Card key={index} className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-gray-500">{metric.title}</CardTitle>
          <div className="p-1.5 rounded-full bg-gray-100">{metric.icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="flex items-center text-xs text-gray-500">
            <CardDescription className="mr-2">{metric.description}</CardDescription>
            <div
              className={`flex items-center ${
                metric.trend === "up"
                  ? "text-green-600"
                  : metric.trend === "down"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {metric.trend === "up" ? (
                <ArrowUp className="h-3 w-3 mr-0.5" />
              ) : metric.trend === "down" ? (
                <ArrowDown className="h-3 w-3 mr-0.5" />
              ) : null}
              <span>{metric.change}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Análise de Campanhas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe o desempenho das suas campanhas de mensagens em grupos
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCampaign}
            onValueChange={setSelectedCampaign}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Selecione uma campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as campanhas</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(renderMetricCard)}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Desempenho ao Longo do Tempo</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={chartType === "bar" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "line" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-2"
                onClick={() => setChartType("line")}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {selectedCampaign === "all"
              ? "Dados agregados de todas as campanhas"
              : `Desempenho da campanha ${
                  campaigns.find((c) => c.id === selectedCampaign)?.name || ""
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoadingTimeSeries ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : timeSeriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            ) : chartType === "bar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSeriesData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="messages" name="Mensagens" fill="#3f84f8" />
                  <Bar dataKey="opens" name="Visualizações" fill="#4f46e5" />
                  <Bar dataKey="responses" name="Respostas" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="messages" name="Mensagens" stroke="#3f84f8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="opens" name="Visualizações" stroke="#4f46e5" />
                  <Line type="monotone" dataKey="responses" name="Respostas" stroke="#f97316" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Taxa de Engajamento</CardTitle>
            <CardDescription>Comparação entre visualizações e respostas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeriesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="date"
                    type="category"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                    width={80}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opens" name="Visualizações" fill="#4f46e5" />
                  <Bar dataKey="responses" name="Respostas" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Status das Mensagens</CardTitle>
            <CardDescription>Distribuição de status por campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaigns}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="deliveryRate"
                    name="Taxa de Entrega (%)"
                    fill="#3f84f8"
                  />
                  <Bar
                    dataKey="openRate"
                    name="Taxa de Visualização (%)"
                    fill="#4f46e5"
                  />
                  <Bar
                    dataKey="clickRate"
                    name="Taxa de Clique (%)"
                    fill="#f97316"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}