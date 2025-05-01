import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Users, MessageSquare, BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WhatsAppStatus() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/whatsapp/status'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query for WhatsApp groups (count only)
  const { data: groups } = useQuery<any[]>({
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

  // Query for WhatsApp contacts (count only)
  const { data: contacts } = useQuery<any[]>({
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

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/20 mr-2">
            <i className="ri-whatsapp-line text-green-600 dark:text-green-400 text-xl"></i>
          </span>
          Status do WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                status?.isAuthenticated 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                status?.isAuthenticated 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {status?.isAuthenticated 
                  ? 'Conectado' 
                  : 'Desconectado'}
              </span>

              {status?.isAuthenticated && (
                <Badge variant="outline" className="ml-auto text-xs border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-400 dark:bg-green-900/20">
                  Ativo
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {status?.isAuthenticated 
                ? 'Seu WhatsApp está pronto para enviar mensagens.' 
                : 'É necessário conectar o WhatsApp para enviar mensagens.'}
            </p>

            {status?.isAuthenticated && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="flex items-center gap-1.5 h-10 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                >
                  <Link href="/whatsapp-groups-contacts">
                    <Users className="h-3.5 w-3.5" />
                    <div className="flex flex-col items-start text-xs">
                      <span className="font-medium">Grupos</span>
                      <span>{groups?.length || 0}</span>
                    </div>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="flex items-center gap-1.5 h-10 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:bg-violet-900/30"
                >
                  <Link href="/whatsapp-groups-contacts?tab=contacts">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <div className="flex flex-col items-start text-xs">
                      <span className="font-medium">Contatos</span>
                      <span>{contacts?.length || 0}</span>
                    </div>
                  </Link>
                </Button>
              </div>
            )}
            
            <Button 
              variant={status?.isAuthenticated ? "outline" : "default"}
              size="sm" 
              asChild 
              className={status?.isAuthenticated 
                ? "w-full border-gray-200 hover:bg-gray-100"
                : "w-full bg-green-600 hover:bg-green-700"
              }
            >
              <Link href="/whatsapp-setup">
                {status?.isAuthenticated 
                  ? (
                    <>
                      Gerenciar Conexão
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) 
                  : (
                    <>
                      <i className="ri-whatsapp-line mr-2"></i>
                      Conectar WhatsApp
                    </>
                  )
                }
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}