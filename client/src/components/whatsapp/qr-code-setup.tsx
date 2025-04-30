import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsAppQRCodeSetup() {
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

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
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Status do WhatsApp</CardTitle>
        <CardDescription>
          {data?.isAuthenticated 
            ? "O WhatsApp está conectado e pronto para enviar mensagens." 
            : "Escaneie o QR code com seu WhatsApp para conectar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data?.isAuthenticated ? (
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-md w-full">
            <div className="text-green-600 dark:text-green-400 text-lg font-medium">
              ✓ WhatsApp Conectado
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              O sistema está pronto para enviar mensagens.
            </p>
          </div>
        ) : qrCodeData?.qrCode ? (
          <div className="flex flex-col items-center gap-4">
            <img 
              src={qrCodeData.qrCode} 
              alt="QR Code para conectar o WhatsApp" 
              className="h-64 w-64 border p-2 rounded-md bg-white"
            />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Abra o WhatsApp no seu telefone, toque em Menu ou Configurações e selecione WhatsApp Web.
              Aponte seu telefone para esta tela para capturar o código.
            </p>
          </div>
        ) : (
          <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-md w-full">
            <div className="text-amber-600 dark:text-amber-400 text-lg font-medium">
              Aguardando QR Code
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              O QR code será exibido em breve. Se não aparecer, tente atualizar.
            </p>
          </div>
        )}

        <Button 
          onClick={handleRefresh}
          variant="outline"
          className="mt-4"
          disabled={isLoading || isLoadingQRCode}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Status
        </Button>
      </CardContent>
    </Card>
  );
}