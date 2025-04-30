import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import WhatsAppQRCodeSetup from "@/components/whatsapp/qr-code-setup";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function WhatsAppSetupPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
            <h2 className="text-2xl font-bold mb-6">Configuração do WhatsApp</h2>
            <p className="text-gray-600 mb-8">
              Para enviar mensagens pelo WhatsApp, você precisa conectar uma conta. Escaneie o código QR abaixo com seu WhatsApp para iniciar.
            </p>

            <div className="max-w-2xl mx-auto">
              <WhatsAppQRCodeSetup />
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Informações Importantes</h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li>É necessário ter o WhatsApp instalado no seu telefone.</li>
                <li>Este sistema utiliza a sessão do WhatsApp Web, assim como quando você acessa o WhatsApp pelo navegador.</li>
                <li>Mantenha o seu telefone conectado à internet para garantir o funcionamento.</li>
                <li>Ao conectar pela primeira vez, pode levar alguns minutos para que todas as mensagens sejam sincronizadas.</li>
                <li>Se a sessão for desconectada, você precisará escanear o QR code novamente.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}