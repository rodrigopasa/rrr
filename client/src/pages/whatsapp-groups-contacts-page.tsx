import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, RefreshCw, Search, UserPlus, MessageSquare, 
  Phone, User, UsersRound, ArrowRight, Info, Send,
  Calendar, Star, Tag, Filter, CheckCircle, Plus, Clock,
  PlusCircle, ListFilter, MessageCircle, CalendarClock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types for WhatsApp data
interface WhatsAppGroup {
  id: string;
  name: string;
  isGroup: boolean;
  participantsCount?: number;
  timestamp: number;
  unreadCount?: number;
  // Custom properties for campaign management
  tag?: string;
  isFavorite?: boolean;
  lastMessageSent?: string;
  campaignStatus?: 'active' | 'pending' | 'completed' | 'none';
}

interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  profilePicUrl?: string;
  isMyContact: boolean;
  isGroup: boolean;
}

export default function WhatsAppGroupsContactsPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("groups");
  
  // Novos estados para gerenciamento de campanhas de lançamento
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [activeGroup, setActiveGroup] = useState<WhatsAppGroup | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Check for tab parameter in URL
  useEffect(() => {
    // Parse the query string
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    
    // Set active tab if parameter exists and is valid
    if (tabParam === 'contacts') {
      setActiveTab('contacts');
    }
  }, [location]);

  // Query for WhatsApp status
  const { data: status } = useQuery({
    queryKey: ['/api/whatsapp/status'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
      return res.json();
    },
  });

  // Query for WhatsApp groups
  const {
    data: groups,
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useQuery<WhatsAppGroup[]>({
    queryKey: ['/api/whatsapp/groups'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/whatsapp/groups');
        if (!res.ok) throw new Error('Failed to fetch WhatsApp groups');
        return res.json();
      } catch (error) {
        console.error('Error fetching WhatsApp groups:', error);
        return [];
      }
    },
    enabled: status?.isAuthenticated, // Only fetch when WhatsApp is connected
  });

  // Query for WhatsApp contacts
  const {
    data: contacts,
    isLoading: isLoadingContacts,
    refetch: refetchContacts
  } = useQuery<WhatsAppContact[]>({
    queryKey: ['/api/whatsapp/contacts'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/whatsapp/contacts');
        if (!res.ok) throw new Error('Failed to fetch WhatsApp contacts');
        return res.json();
      } catch (error) {
        console.error('Error fetching WhatsApp contacts:', error);
        return [];
      }
    },
    enabled: status?.isAuthenticated, // Only fetch when WhatsApp is connected
  });

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === "groups") {
      refetchGroups();
      toast({
        title: "Atualizado",
        description: "Lista de grupos atualizada com sucesso",
      });
    } else {
      refetchContacts();
      toast({
        title: "Atualizado",
        description: "Lista de contatos atualizada com sucesso",
      });
    }
  };

  // Handlers para gerenciamento de campanhas
  const handleToggleFavorite = (groupId: string) => {
    // Em uma implementação real, isso chamaria uma API para atualizar no backend
    toast({
      title: "Grupo favoritado",
      description: "Este grupo foi adicionado aos favoritos",
    });
  };

  const handleCreateCampaign = (group: WhatsAppGroup) => {
    setActiveGroup(group);
    setShowCampaignModal(true);
  };

  const handleScheduleMessage = (group: WhatsAppGroup) => {
    // Aqui redirecionaríamos para a página de agendamento pré-preenchida
    toast({
      title: "Agendamento iniciado",
      description: "Configure sua mensagem programada para o lançamento",
    });
  };

  // Advanced filtering 
  const applyGroupFilters = (group: WhatsAppGroup) => {
    if (groupFilter === "all") return true;
    if (groupFilter === "favorites" && group.isFavorite) return true;
    if (groupFilter === "campaign" && group.campaignStatus) return true;
    return false;
  };

  // Filter groups and contacts based on search term and filters
  const filteredGroups = groups?.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    applyGroupFilters(group)
  );
  
  // Sort groups
  const sortedGroups = filteredGroups?.slice().sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "members") {
      return (b.participantsCount || 0) - (a.participantsCount || 0);
    } else if (sortBy === "recent") {
      return b.timestamp - a.timestamp;
    }
    return 0;
  });
  
  const filteredContacts = contacts?.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contact.number.includes(searchTerm)
  );

  if (isLoadingAuth) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">WhatsApp Grupos & Contatos</h2>
                <p className="text-gray-500">Visualize e gerencie seus grupos e contatos do WhatsApp</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                  disabled={!status?.isAuthenticated}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden md:inline">Atualizar</span>
                </Button>
                
                <Button
                  asChild
                  className="bg-[#4f46e5] hover:bg-[#4f46e5]/90 flex items-center gap-2"
                  disabled={!status?.isAuthenticated}
                >
                  <Link href="/messages">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden md:inline">Enviar Mensagem</span>
                  </Link>
                </Button>
              </div>
            </div>

            {!status?.isAuthenticated && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">WhatsApp não conectado</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Para visualizar seus grupos e contatos do WhatsApp, você precisa conectar sua conta.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                    asChild
                  >
                    <Link href="/whatsapp-setup">
                      Conectar WhatsApp
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {status?.isAuthenticated && (
              <>
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome ou número..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {activeTab === "groups" && (
                    <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex gap-2 items-center">
                        <ListFilter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Filtros:</span>
                        
                        <div className="flex flex-wrap gap-1.5">
                          <Badge 
                            variant={groupFilter === "all" ? "default" : "outline"}
                            className={`cursor-pointer ${groupFilter === "all" ? "bg-gradient-to-r from-blue-500 to-orange-500" : ""}`}
                            onClick={() => setGroupFilter("all")}
                          >
                            Todos
                          </Badge>
                          <Badge 
                            variant={groupFilter === "favorites" ? "default" : "outline"}
                            className={`cursor-pointer ${groupFilter === "favorites" ? "bg-gradient-to-r from-blue-500 to-orange-500" : ""}`}
                            onClick={() => setGroupFilter("favorites")}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Favoritos
                          </Badge>
                          <Badge 
                            variant={groupFilter === "campaign" ? "default" : "outline"}
                            className={`cursor-pointer ${groupFilter === "campaign" ? "bg-gradient-to-r from-blue-500 to-orange-500" : ""}`}
                            onClick={() => setGroupFilter("campaign")}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            Campanhas
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-sm h-7 px-2 text-gray-600"
                          onClick={() => setShowQuickActions(!showQuickActions)}
                        >
                          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                          Ações de Lançamento
                        </Button>
                        
                        <select 
                          className="text-sm border rounded px-2 py-1 bg-transparent text-gray-600"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="name">Nome</option>
                          <option value="members">Mais membros</option>
                          <option value="recent">Mais recentes</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <Tabs value={activeTab} defaultValue="groups" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="groups" className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4" />
                      <span>Grupos</span>
                      {groups && groups.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5">
                          {groups.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Contatos</span>
                      {contacts && contacts.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5">
                          {contacts.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Quick Action Panel - Aparece quando o botão "Ações de Lançamento" é clicado */}
                  {showQuickActions && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-orange-500/10 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center">
                            <PlusCircle className="h-5 w-5 mr-2 text-orange-500" />
                            Ações Rápidas para Lançamento
                          </h3>
                          <p className="text-sm text-gray-600">Ferramentas para ajudar no seu lançamento de produto</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowQuickActions(false)}>
                          <i className="ri-close-line"></i>
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg border p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                              <Send className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Mensagem em Massa</h4>
                              <p className="text-xs text-gray-500 mt-0.5">Envie mensagens para múltiplos grupos de uma só vez</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center mr-3">
                              <CalendarClock className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Agendar Campanha</h4>
                              <p className="text-xs text-gray-500 mt-0.5">Crie mensagens programadas para seu lançamento</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-start">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-orange-500 flex items-center justify-center mr-3">
                              <Tag className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">Organizar Grupos</h4>
                              <p className="text-xs text-gray-500 mt-0.5">Categorize seus grupos para melhor gestão</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                
                  <TabsContent value="groups" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <UsersRound className="h-5 w-5 text-orange-500 mr-2" />
                          Grupos do WhatsApp
                        </CardTitle>
                        <CardDescription>
                          Lista de todos os grupos disponíveis no seu WhatsApp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingGroups ? (
                          // Loading skeletons
                          <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex items-center p-3 border rounded-lg gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-40" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : filteredGroups && filteredGroups.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sortedGroups?.map((group) => (
                              <div 
                                key={group.id} 
                                className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer gap-3 relative overflow-hidden"
                              >
                                {/* Indicador de campanha ativa */}
                                {group.campaignStatus === 'active' && (
                                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-bl-md">
                                    <CheckCircle className="h-3 w-3 inline-block mr-1" />
                                    Campanha Ativa
                                  </div>
                                )}
                                
                                {/* Indicador de programação */}
                                {group.campaignStatus === 'pending' && (
                                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-bl-md">
                                    <Clock className="h-3 w-3 inline-block mr-1" />
                                    Programado
                                  </div>
                                )}
                                
                                {/* Ícone do grupo */}
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500/80 to-orange-600 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-5 w-5 text-white" />
                                </div>
                                
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center">
                                    <div className="font-medium text-gray-900 truncate flex items-center">
                                      {group.name}
                                      {group.isFavorite && (
                                        <Star className="h-3.5 w-3.5 text-amber-400 ml-1.5 fill-amber-400" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Tags de categorização */}
                                  {group.tag && (
                                    <div className="mt-1">
                                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                                        {group.tag}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  <div className="text-sm text-gray-500 flex items-center gap-2 mt-1.5">
                                    <div className="flex items-center">
                                      <UsersRound className="h-3.5 w-3.5 mr-1" />
                                      <span>{group.participantsCount || 0} membros</span>
                                    </div>
                                    
                                    <div className="flex ml-auto">
                                      {/* Botão para agendar mensagem para lançamento */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7"
                                              onClick={() => handleScheduleMessage(group)}
                                            >
                                              <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Agendar mensagem para lançamento</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      
                                      {/* Botão para enviar mensagem */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7"
                                              onClick={() => window.location.href = `/messages?group=${group.id}`}
                                            >
                                              <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Enviar mensagem para este grupo</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      
                                      {/* Botão para favoritar */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7"
                                              onClick={() => handleToggleFavorite(group.id)}
                                            >
                                              <Star className={`h-3.5 w-3.5 ${group.isFavorite ? "text-amber-400 fill-amber-400" : "text-gray-400"}`} />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{group.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum grupo encontrado</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                              {searchTerm 
                                ? `Nenhum grupo corresponde à pesquisa "${searchTerm}"`
                                : "Você não possui grupos no WhatsApp ou eles ainda não foram sincronizados."}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <User className="h-5 w-5 text-blue-500 mr-2" />
                          Contatos do WhatsApp
                        </CardTitle>
                        <CardDescription>
                          Lista de todos os contatos disponíveis no seu WhatsApp
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingContacts ? (
                          // Loading skeletons
                          <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex items-center p-3 border rounded-lg gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-40" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : filteredContacts && filteredContacts.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredContacts.map((contact) => (
                              <div 
                                key={contact.id} 
                                className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer gap-3"
                              >
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-medium text-gray-900 truncate">{contact.name}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                    <div className="flex items-center">
                                      <Phone className="h-3.5 w-3.5 mr-1" />
                                      <span>{contact.number}</span>
                                    </div>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Enviar mensagem para este contato</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum contato encontrado</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto">
                              {searchTerm 
                                ? `Nenhum contato corresponde à pesquisa "${searchTerm}"`
                                : "Você não possui contatos no WhatsApp ou eles ainda não foram sincronizados."}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}