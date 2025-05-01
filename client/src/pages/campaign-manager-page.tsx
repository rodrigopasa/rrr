import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search, Filter, MoreVertical, Play, Pause, Edit, Trash2, Users, CalendarClock, Tags, FileBarChart, MessageSquare, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import CampaignAnalytics from "@/components/dashboard/campaign-analytics";

// Tipos
interface Campaign {
  id: string;
  name: string;
  description: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
  startDate: string;
  endDate: string | null;
  groups: {
    id: string;
    name: string;
    participantsCount: number;
  }[];
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  totalMessages: number;
  tags: string[];
  progress: number;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  scheduled: { label: "Agendada", variant: "secondary" },
  active: { label: "Ativa", variant: "default" },
  paused: { label: "Pausada", variant: "outline" },
  completed: { label: "Concluída", variant: "secondary" },
};

export default function CampaignManagerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Buscar campanhas
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/campaigns");
        if (!res.ok) throw new Error("Falha ao buscar campanhas");
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar campanhas:", error);
        return [];
      }
    },
  });

  // Filtrar campanhas com base no status e termo de busca
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesStatus = activeTab === "all" || campaign.status === activeTab;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Formato de data localizado para Brasil
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: pt });
  };

  // Dados resumidos para cards
  const summaryData = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    totalGroups: campaigns.reduce((acc, campaign) => acc + campaign.groups.length, 0),
    totalMessagesSent: campaigns.reduce((acc, campaign) => acc + campaign.messagesSent, 0),
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <TopNav />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Gerenciador de Campanhas</h1>
              <p className="text-gray-500 mt-1">
                Gerencie e acompanhe suas campanhas de marketing para grupos de WhatsApp
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant={showAnalytics ? "default" : "outline"} 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="gap-2"
              >
                <BarChart className="h-4 w-4" />
                {showAnalytics ? "Ocultar Analytics" : "Mostrar Analytics"}
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                <Plus className="h-4 w-4" />
                Nova Campanha
              </Button>
            </div>
          </div>
          
          {showAnalytics && (
            <div className="mb-8">
              <CampaignAnalytics />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total de Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summaryData.total}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {summaryData.active} ativas, {summaryData.scheduled} agendadas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Campanhas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summaryData.active}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {summaryData.completed} campanhas concluídas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Grupos Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summaryData.totalGroups}</div>
                <p className="text-sm text-gray-500 mt-1">
                  Em todas as campanhas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Mensagens Enviadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summaryData.totalMessagesSent.toLocaleString()}</div>
                <p className="text-sm text-gray-500 mt-1">
                  Através de todas as campanhas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar campanhas..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </Button>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="active">Ativas</TabsTrigger>
                <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
                <TabsTrigger value="paused">Pausadas</TabsTrigger>
                <TabsTrigger value="completed">Concluídas</TabsTrigger>
                <TabsTrigger value="draft">Rascunhos</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma campanha encontrada</h3>
                    <p className="text-sm max-w-md mx-auto">
                      {searchTerm
                        ? `Não encontramos campanhas correspondentes a "${searchTerm}"`
                        : "Crie sua primeira campanha para começar a enviar mensagens programadas para grupos"}
                    </p>
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Campanha
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => (
                      <Card key={campaign.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                            <div className="p-6">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-lg">{campaign.name}</h3>
                                    <Badge variant={STATUS_BADGES[campaign.status].variant}>
                                      {STATUS_BADGES[campaign.status].label}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-500 text-sm mb-3">{campaign.description}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    {campaign.status === "active" ? (
                                      <DropdownMenuItem>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pausar
                                      </DropdownMenuItem>
                                    ) : campaign.status === "paused" ? (
                                      <DropdownMenuItem>
                                        <Play className="h-4 w-4 mr-2" />
                                        Retomar
                                      </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem>
                                      <FileBarChart className="h-4 w-4 mr-2" />
                                      Relatório
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remover
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 mt-4">
                                <div className="flex items-center gap-2">
                                  <CalendarClock className="h-4 w-4 text-gray-400" />
                                  <div className="text-sm">
                                    <div>Criada em</div>
                                    <div className="font-medium">{formatDate(campaign.createdAt)}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <div className="text-sm">
                                    <div>Grupos</div>
                                    <div className="font-medium">{campaign.groups.length} grupos ({campaign.groups.reduce((acc, g) => acc + g.participantsCount, 0)} participantes)</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-gray-400" />
                                  <div className="text-sm">
                                    <div>Mensagens</div>
                                    <div className="font-medium">{campaign.messagesSent} enviadas de {campaign.totalMessages}</div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mb-4">
                                {campaign.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <div>Progresso</div>
                                  <div className="font-medium">{campaign.progress}%</div>
                                </div>
                                <Progress value={campaign.progress} className="h-2" />
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 flex flex-col justify-center items-center px-6 py-4 md:border-l">
                              <div className="space-y-3 w-full">
                                <Button className="w-full gap-2" variant="outline" size="sm">
                                  <Users className="h-4 w-4" />
                                  Ver Grupos
                                </Button>
                                <Button className="w-full gap-2" variant="outline" size="sm">
                                  <MessageSquare className="h-4 w-4" />
                                  Ver Mensagens
                                </Button>
                                <Button className="w-full gap-2" variant="default" size="sm">
                                  <FileBarChart className="h-4 w-4" />
                                  Ver Estatísticas
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}