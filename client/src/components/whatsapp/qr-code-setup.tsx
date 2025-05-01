import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, RefreshCw, CheckCircle, AlertTriangle, 
  SmartphoneNfc, Smartphone, Link as LinkIcon, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function WhatsAppQRCodeSetup() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Query for WhatsApp status
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/whatsapp/status', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) {
        throw new Error('Failed to fetch WhatsApp status');
      }
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Query for WhatsApp QR code
  const { data: qrCodeData, isLoading: isLoadingQRCode, refetch: refetchQRCode } = useQuery({
    queryKey: ['/api/whatsapp/qrcode', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/qrcode');
      if (!res.ok) {
        return { qrCode: null };
      }
      return res.json();
    },
    enabled: data?.isInitialized && !data?.isAuthenticated,
    refetchInterval: data?.isInitialized && !data?.isAuthenticated ? 5000 : false,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível conectar ao serviço do WhatsApp.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
    refetchQRCode();
    
    toast({
      title: "Atualizando status",
      description: "Solicitando informações atualizadas do WhatsApp...",
    });
  };

  return (
    <Card className="w-full border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-gray-950 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
              <i className="ri-whatsapp-line text-green-600 dark:text-green-400 text-xl"></i>
            </div>
            <div>
              <CardTitle>Configuração do WhatsApp</CardTitle>
              <CardDescription className="mt-1">
                {data?.isAuthenticated 
                  ? "O WhatsApp está conectado e pronto para uso." 
                  : "Escaneie o QR code com seu WhatsApp para conectar."}
              </CardDescription>
            </div>
          </div>
          
          {data?.isAuthenticated && (
            <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              Conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 w-full">
                <Loader2 className="h-10 w-10 animate-spin text-green-500 mb-4" />
                <p className="text-muted-foreground">Carregando status do WhatsApp...</p>
              </div>
            ) : data?.isAuthenticated ? (
              <div className="flex flex-col h-full justify-center">
                <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800 mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <div className="text-green-700 dark:text-green-400 text-xl font-medium mb-2">
                    WhatsApp Conectado
                  </div>
                  <p className="text-green-600 dark:text-green-500">
                    Seu WhatsApp está pronto para enviar mensagens.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <Button asChild variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                    <Link href="/whatsapp-groups-contacts">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Ver Grupos & Contatos
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400">
                    <Link href="/messages">
                      <i className="ri-message-2-line mr-2"></i>
                      Enviar Mensagens
                    </Link>
                  </Button>
                </div>
              </div>
            ) : qrCodeData?.qrCode ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center max-w-md">
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-gray-100">Escaneie o QR Code</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use o seu celular para escanear o código QR e conectar-se ao WhatsApp.
                  </p>
                  
                  <div className="border-2 border-green-500 p-3 rounded-xl bg-white inline-block relative">
                    <div className="absolute inset-0 bg-green-500/10 rounded-xl pointer-events-none"></div>
                    <img 
                      src={qrCodeData.qrCode} 
                      alt="QR Code para conectar o WhatsApp" 
                      className="h-64 w-64"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <div className="text-amber-700 dark:text-amber-400 text-xl font-medium mb-2">
                  Aguardando QR Code
                </div>
                <p className="text-amber-600 dark:text-amber-500 mb-4">
                  O QR code será exibido em breve. Se não aparecer, tente atualizar.
                </p>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:border-amber-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Solicitar QR Code
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="bg-gray-50 dark:bg-gray-900/30 p-5 rounded-lg border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <QrCode className="h-5 w-5 mr-2 text-gray-500" />
                Como conectar
              </h3>
              
              <ol className="space-y-5">
                <li className="flex gap-3">
                  <div className="bg-green-100 dark:bg-green-900/50 h-8 w-8 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-medium flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Abra o WhatsApp no seu telefone</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Certifique-se de que você está usando a versão mais recente do WhatsApp.
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <div className="bg-green-100 dark:bg-green-900/50 h-8 w-8 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-medium flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Acesse as configurações</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Toque em Menu ou Configurações e selecione "Aparelhos conectados"
                      </p>
                    </div>
                  </div>
                </li>
                
                <li className="flex gap-3">
                  <div className="bg-green-100 dark:bg-green-900/50 h-8 w-8 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-medium flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Escaneie o código QR</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <SmartphoneNfc className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Aponte a câmera do seu telefone para o código QR exibido na tela
                      </p>
                    </div>
                  </div>
                </li>
              </ol>
              
              <Alert className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700 dark:text-blue-400">Importante</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-500 text-sm">
                  Mantenha seu telefone conectado à internet para garantir o funcionamento contínuo do sistema.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 mt-2">
        <Button 
          variant="outline" 
          disabled={isLoading || isLoadingQRCode}
          asChild
        >
          <Link href="/">
            <i className="ri-arrow-left-line mr-2"></i>
            Voltar ao Dashboard
          </Link>
        </Button>
        
        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
          disabled={isLoading || isLoadingQRCode}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Status
        </Button>
      </CardFooter>
    </Card>
  );
}