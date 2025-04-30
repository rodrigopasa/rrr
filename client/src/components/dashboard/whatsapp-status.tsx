import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

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

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <i className="ri-whatsapp-line text-orange-500 mr-2 text-xl"></i>
          Status do WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${status?.isAuthenticated ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium">
                {status?.isAuthenticated 
                  ? 'Conectado' 
                  : 'Desconectado'}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {status?.isAuthenticated 
                ? 'Seu WhatsApp está pronto para enviar mensagens.' 
                : 'É necessário conectar o WhatsApp para enviar mensagens.'}
            </p>
            
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/whatsapp-setup">
                {status?.isAuthenticated ? 'Gerenciar Conexão' : 'Conectar WhatsApp'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}