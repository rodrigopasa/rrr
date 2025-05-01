import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import WhatsAppQRCodeSetup from "@/components/whatsapp/qr-code-setup";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Users, Smartphone, Link as LinkIcon, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export default function WhatsAppSetupPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("setup");

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
  } = useQuery<any[]>({
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
  } = useQuery<any[]>({
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

  // Redirect to auth if not authenticated
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
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Configuração do WhatsApp</h2>
                <p className="text-gray-500">Conecte o WhatsApp, gerencie grupos e contatos</p>
              </div>
              
              {status?.isAuthenticated && (
                <div className="flex gap-2">
                  <Button 
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Link href="/whatsapp-groups-contacts">
                      <Users className="h-4 w-4" />
                      <span className="hidden md:inline">Ver Grupos & Contatos</span>
                    </Link>
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Link href="/messages">
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden md:inline">Enviar Mensagem</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <Tabs defaultValue="setup" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="setup" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Conexão</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2" disabled={!status?.isAuthenticated}>
                  <i className="ri-bar-chart-line text-base"></i>
                  <span>Estatísticas</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <i className="ri-settings-line text-base"></i>
                  <span>Avançado</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="setup">
                <div className="max-w-5xl mx-auto">
                  <WhatsAppQRCodeSetup />
                </div>
              </TabsContent>

              <TabsContent value="stats">
                {status?.isAuthenticated ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Grupos</CardTitle>
                        <CardDescription>Total de grupos disponíveis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingGroups ? (
                          <Skeleton className="h-12 w-20" />
                        ) : (
                          <div className="flex items-end justify-between">
                            <div className="text-3xl font-bold">{groups?.length || 0}</div>
                            <Button variant="ghost" size="sm" asChild className="text-blue-600">
                              <Link href="/whatsapp-groups-contacts">
                                <span className="text-xs">Ver Todos</span>
                                <i className="ri-arrow-right-line ml-1"></i>
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Contatos</CardTitle>
                        <CardDescription>Total de contatos disponíveis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingContacts ? (
                          <Skeleton className="h-12 w-20" />
                        ) : (
                          <div className="flex items-end justify-between">
                            <div className="text-3xl font-bold">{contacts?.length || 0}</div>
                            <Button variant="ghost" size="sm" asChild className="text-violet-600">
                              <Link href="/whatsapp-groups-contacts?tab=contacts">
                                <span className="text-xs">Ver Todos</span>
                                <i className="ri-arrow-right-line ml-1"></i>
                              </Link>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Status</CardTitle>
                        <CardDescription>Estado atual da conexão</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-green-600 font-medium">Conectado e Ativo</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Seu WhatsApp está sincronizado e pronto para uso
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg border border-gray-200">
                    <div className="bg-white p-4 rounded-full mb-4">
                      <LinkIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Conecte o WhatsApp Primeiro</h3>
                    <p className="text-gray-500 text-center max-w-md mb-4">
                      Para acessar as estatísticas, é necessário conectar seu WhatsApp primeiro.
                    </p>
                    <Button onClick={() => setActiveTab("setup")}>
                      Ir para Configuração
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações Avançadas</CardTitle>
                      <CardDescription>
                        Opções e configurações adicionais para o WhatsApp
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-medium mb-2">Opções de Sincronização</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Configure como os dados do WhatsApp são sincronizados com a plataforma
                        </p>
                        
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Sincronização automática</h4>
                              <p className="text-sm text-gray-500">Atualiza automaticamente contatos e grupos</p>
                            </div>
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Notificações de mensagens</h4>
                              <p className="text-sm text-gray-500">Receba alertas de novas mensagens</p>
                            </div>
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Logs detalhados</h4>
                              <p className="text-sm text-gray-500">Registra informações mais detalhadas para depuração</p>
                            </div>
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Operações de Conexão</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Gerenciar o estado da conexão com o WhatsApp
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20" disabled={!status?.isAuthenticated}>
                            <i className="ri-logout-box-line mr-2"></i>
                            Desconectar WhatsApp
                          </Button>
                          
                          <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20">
                            <i className="ri-refresh-line mr-2"></i>
                            Reconectar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}