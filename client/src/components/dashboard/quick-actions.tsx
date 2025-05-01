import { useState } from "react";
import MessageComposer from "../message/message-composer";
import ImportContacts from "../contacts/import-contacts";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function QuickActions() {
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showImportContacts, setShowImportContacts] = useState(false);

  // Query for WhatsApp status
  const { data: status } = useQuery({
    queryKey: ['/api/whatsapp/status'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
      return res.json();
    },
  });

  return (
    <>
      <Card className="col-span-2">
        <CardContent className="p-0">
          {/* New Message Card */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">Ações Rápidas</h3>
                <p className="text-blue-100 mt-1">
                  Controle suas mensagens e aumente seu alcance
                </p>
              </div>
              
              {status?.isAuthenticated ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 py-1 px-2.5">
                  <div className="h-2 w-2 rounded-full bg-white mr-1.5 animate-pulse"></div>
                  WhatsApp Conectado
                </Badge>
              ) : (
                <Link href="/whatsapp-setup">
                  <Badge variant="outline" className="bg-red-100 text-red-500 border-red-200 py-1 hover:bg-red-200 cursor-pointer">
                    <i className="ri-error-warning-line mr-1"></i>
                    Não Conectado
                  </Badge>
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
                <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center mb-3">
                  <i className="ri-whatsapp-line text-xl"></i>
                </div>
                <h4 className="font-medium mb-1">Grupos & Contatos</h4>
                <p className="text-sm text-blue-100 mb-3">Acesse seus grupos e contatos do WhatsApp</p>
                <Link href="/whatsapp-groups-contacts" className="text-xs bg-white/20 py-1 px-2 rounded inline-flex items-center hover:bg-white/30">
                  Explorar
                  <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </div>
              
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
                <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center mb-3">
                  <i className="ri-message-2-line text-xl"></i>
                </div>
                <h4 className="font-medium mb-1">Enviar Mensagens</h4>
                <p className="text-sm text-blue-100 mb-3">Envie mensagens para contatos ou grupos</p>
                <button 
                  onClick={() => setShowMessageComposer(true)} 
                  className="text-xs bg-white/20 py-1 px-2 rounded inline-flex items-center hover:bg-white/30"
                  disabled={!status?.isAuthenticated}
                >
                  Enviar Agora
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
              
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
                <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center mb-3">
                  <i className="ri-user-add-line text-xl"></i>
                </div>
                <h4 className="font-medium mb-1">Importar Contatos</h4>
                <p className="text-sm text-blue-100 mb-3">Importe contatos de arquivos CSV ou Excel</p>
                <button 
                  onClick={() => setShowImportContacts(true)} 
                  className="text-xs bg-white/20 py-1 px-2 rounded inline-flex items-center hover:bg-white/30"
                >
                  Importar
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/messages" className="py-1.5 px-3 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors flex items-center text-sm">
                <i className="ri-send-plane-fill mr-1.5"></i>
                Nova Mensagem
              </Link>
              
              <Link href="/schedule" className="py-1.5 px-3 bg-white/20 text-white rounded-md font-medium hover:bg-white/30 transition-colors flex items-center text-sm">
                <i className="ri-calendar-line mr-1.5"></i>
                Agendar Envio
              </Link>
              
              <Link href="/whatsapp-setup" className="py-1.5 px-3 bg-white/20 text-white rounded-md font-medium hover:bg-white/30 transition-colors flex items-center text-sm">
                <i className="ri-settings-line mr-1.5"></i>
                Configurações
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {showMessageComposer && (
        <MessageComposer onClose={() => setShowMessageComposer(false)} />
      )}
      
      {showImportContacts && (
        <ImportContacts onClose={() => setShowImportContacts(false)} />
      )}
    </>
  );
}
