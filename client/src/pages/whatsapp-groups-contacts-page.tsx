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
  Phone, User, UsersRound, ArrowRight, Info
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

  // Filter groups and contacts based on search term
  const filteredGroups = groups?.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome ou número..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
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
                            {filteredGroups.map((group) => (
                              <div 
                                key={group.id} 
                                className="flex items-start p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer gap-3"
                              >
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-5 w-5 text-orange-600" />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-medium text-gray-900 truncate">{group.name}</div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    <div className="flex items-center">
                                      <UsersRound className="h-3.5 w-3.5 mr-1" />
                                      <span>{group.participantsCount || 0} membros</span>
                                    </div>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Enviar mensagem para este grupo</p>
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