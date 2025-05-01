import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CalendarRange, Download, RefreshCw } from "lucide-react";

interface MessageAnalyticsProps {
  userId: number;
}

// Dados simulados para exibição
const mockTimeData = [
  { name: "01/05", enviados: 120, entregues: 115, lidos: 78 },
  { name: "02/05", enviados: 132, entregues: 130, lidos: 95 },
  { name: "03/05", enviados: 101, entregues: 99, lidos: 65 },
  { name: "04/05", enviados: 134, entregues: 132, lidos: 89 },
  { name: "05/05", enviados: 90, entregues: 85, lidos: 63 },
  { name: "06/05", enviados: 230, entregues: 225, lidos: 188 },
  { name: "07/05", enviados: 280, entregues: 265, lidos: 210 },
];

const mockGroupData = [
  { name: "Grupo de Lançamento - Produto X", value: 420, color: "#3b82f6" },
  { name: "Afiliados Premium", value: 280, color: "#f97316" },
  { name: "Suporte Técnico", value: 180, color: "#10b981" },
  { name: "Clientes VIP", value: 320, color: "#6366f1" },
  { name: "Beta Testers", value: 120, color: "#8b5cf6" },
];

const mockTypeData = [
  { name: "Inicial", value: 180, color: "#3b82f6" },
  { name: "Lançamento", value: 320, color: "#f97316" },
  { name: "Promocional", value: 280, color: "#ef4444" },
  { name: "Informativo", value: 220, color: "#10b981" },
  { name: "Suporte", value: 150, color: "#6366f1" },
];

const formatoBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function MessageAnalytics({ userId }: MessageAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Estatísticas de exemplo
  const stats = {
    messagesSent: 1087,
    messagesDelivered: 1051,
    readRate: 69.4,
    clickRate: 25.3,
    conversionValue: 18750.0,
    topGroup: "Grupo de Lançamento - Produto X",
    topCampaign: "Lançamento do Produto X",
  };

  const refreshData = () => {
    setIsRefreshing(true);
    // Simulação de atualização de dados
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const handleExportCSV = () => {
    // Simulação de download de dados
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute(
      "download",
      `relatorio-mensagens-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-md shadow-md">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Analytics de Mensagens</h2>
          <p className="text-muted-foreground">
            Visualize o desempenho das suas mensagens e campanhas.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2">
            <Label htmlFor="timeRange" className="whitespace-nowrap">
              Período:
            </Label>
            <Select
              value={timeRange}
              onValueChange={(value) => {
                setTimeRange(value);
                const today = new Date();
                let startDateValue = new Date();

                switch (value) {
                  case "7d":
                    startDateValue.setDate(today.getDate() - 7);
                    break;
                  case "30d":
                    startDateValue.setDate(today.getDate() - 30);
                    break;
                  case "90d":
                    startDateValue.setDate(today.getDate() - 90);
                    break;
                  case "custom":
                    // Manter datas atuais se selecionado custom
                    return;
                }

                setStartDate(startDateValue.toISOString().split("T")[0]);
                setEndDate(today.toISOString().split("T")[0]);
              }}
            >
              <SelectTrigger id="timeRange" className="w-[120px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeRange === "custom" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
                <ArrowRight className="h-4 w-4 hidden sm:block" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSent}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.messagesDelivered / stats.messagesSent) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.messagesDelivered} mensagens entregues
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readRate}%</div>
            <p className="text-xs text-muted-foreground">
              Das mensagens entregues
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Convertido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatoBRL.format(stats.conversionValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimado para o período
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time" className="w-full">
        <TabsList>
          <TabsTrigger value="time">Por Tempo</TabsTrigger>
          <TabsTrigger value="groups">Por Grupos</TabsTrigger>
          <TabsTrigger value="types">Por Tipo</TabsTrigger>
        </TabsList>
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho de Mensagens ao Longo do Tempo</CardTitle>
              <CardDescription>
                Visualize quantas mensagens foram enviadas, entregues e lidas diariamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockTimeData} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="enviados"
                      fill="#3b82f6"
                      name="Enviados"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="entregues"
                      fill="#10b981"
                      name="Entregues"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="lidos"
                      fill="#f97316"
                      name="Lidos"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Grupos</CardTitle>
              <CardDescription>
                Analise quais grupos receberam mais mensagens no período.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockGroupData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      labelLine={false}
                    >
                      {mockGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Mensagem</CardTitle>
              <CardDescription>
                Visualize quais tipos de mensagens foram mais enviados.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      labelLine={false}
                    >
                      {mockTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Grupo</CardTitle>
            <CardDescription>
              Os 5 grupos com mais mensagens enviadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockGroupData.map((group, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-12 text-sm">{i + 1}.</div>
                  <div className="w-full max-w-[180px] truncate">{group.name}</div>
                  <div className="ml-auto font-medium">{group.value}</div>
                  <div
                    className="ml-2 h-2 w-16 rounded-full"
                    style={{
                      backgroundColor: group.color,
                      opacity: 1 - i * 0.15,
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>
              Mensagens programadas para envio nos próximos dias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <CalendarRange className="h-4 w-4 mr-2 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium">Lançamento Final - Grupo VIP</div>
                  <div className="text-sm text-gray-500">
                    08/05/2025 às 10:00 (28 destinatários)
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarRange className="h-4 w-4 mr-2 text-orange-500" />
                <div className="flex-1">
                  <div className="font-medium">Lembrete de Fechamento</div>
                  <div className="text-sm text-gray-500">
                    10/05/2025 às 18:00 (42 destinatários)
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarRange className="h-4 w-4 mr-2 text-green-500" />
                <div className="flex-1">
                  <div className="font-medium">Promoção de Fim de Semana</div>
                  <div className="text-sm text-gray-500">
                    12/05/2025 às 09:00 (18 destinatários)
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarRange className="h-4 w-4 mr-2 text-purple-500" />
                <div className="flex-1">
                  <div className="font-medium">Convite Webinar</div>
                  <div className="text-sm text-gray-500">
                    15/05/2025 às 14:00 (65 destinatários)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}