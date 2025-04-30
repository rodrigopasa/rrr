import { useState } from "react";
import MessageComposer from "../message/message-composer";
import ImportContacts from "../contacts/import-contacts";

export default function QuickActions() {
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showImportContacts, setShowImportContacts] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* New Message Card */}
        <div className="bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white rounded-lg shadow p-6 md:col-span-2">
          <h3 className="text-xl font-semibold mb-3">Enviar Nova Mensagem</h3>
          <p className="mb-4">
            Crie e envie mensagens para contatos individuais ou grupos agora
            mesmo.
          </p>
          <button
            onClick={() => setShowMessageComposer(true)}
            className="py-2 px-4 bg-white text-[#4f46e5] rounded font-medium hover:bg-gray-100 transition-colors flex items-center"
          >
            <i className="ri-send-plane-fill mr-2"></i>
            Nova Mensagem
          </button>
        </div>

        {/* Import Contacts Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">Importar Contatos</h3>
          <p className="text-gray-600 mb-4">
            Importe seus contatos de arquivos CSV ou Excel.
          </p>
          <button
            onClick={() => setShowImportContacts(true)}
            className="py-2 px-4 bg-[#4f46e5] text-white rounded font-medium hover:bg-[#4f46e5]/90 transition-colors flex items-center"
          >
            <i className="ri-upload-2-line mr-2"></i>
            Importar
          </button>
        </div>
      </div>

      {showMessageComposer && (
        <MessageComposer onClose={() => setShowMessageComposer(false)} />
      )}
      
      {showImportContacts && (
        <ImportContacts onClose={() => setShowImportContacts(false)} />
      )}
    </>
  );
}
