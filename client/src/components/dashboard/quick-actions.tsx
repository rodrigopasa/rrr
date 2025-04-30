import { useState } from "react";
import MessageComposer from "../message/message-composer";
import ImportContacts from "../contacts/import-contacts";
import { Card, CardContent } from "@/components/ui/card";

export default function QuickActions() {
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showImportContacts, setShowImportContacts] = useState(false);

  return (
    <>
      <Card className="col-span-2">
        <CardContent className="p-0">
          {/* New Message Card */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Ações Rápidas</h3>
            <p className="mb-4">
              Crie e envie mensagens para contatos individuais ou grupos agora
              mesmo.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowMessageComposer(true)}
                className="py-2 px-4 bg-white text-orange-600 rounded font-medium hover:bg-gray-100 transition-colors flex items-center"
              >
                <i className="ri-send-plane-fill mr-2"></i>
                Nova Mensagem
              </button>
              
              <button
                onClick={() => setShowImportContacts(true)}
                className="py-2 px-4 bg-white/20 text-white rounded font-medium hover:bg-white/30 transition-colors flex items-center"
              >
                <i className="ri-upload-2-line mr-2"></i>
                Importar Contatos
              </button>
              
              <button
                className="py-2 px-4 bg-white/20 text-white rounded font-medium hover:bg-white/30 transition-colors flex items-center"
              >
                <i className="ri-calendar-line mr-2"></i>
                Agendar Envio
              </button>
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
