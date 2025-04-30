import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { PlusCircle, Trash2, Search, RefreshCw, UserPlus } from "lucide-react";
import ImportContacts from "@/components/contacts/import-contacts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Contact {
  id: string;
  name: string;
  phone: string;
  group: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Query for contacts
  const {
    data: contacts,
    isLoading,
    refetch,
  } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/contacts?search=${searchTerm}`);
        if (!res.ok) throw new Error("Failed to fetch contacts");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });

  // Delete contacts mutation
  const deleteContactsMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      await apiRequest("DELETE", "/api/contacts", { ids: contactIds });
    },
    onSuccess: () => {
      toast({
        title: "Contatos excluídos",
        description: "Os contatos selecionados foram excluídos com sucesso.",
      });
      setSelectedContacts([]);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir contatos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (contacts) {
      if (selectedContacts.length === contacts.length) {
        setSelectedContacts([]);
      } else {
        setSelectedContacts(contacts.map((contact) => contact.id));
      }
    }
  };

  const handleSelectContact = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const handleDeleteContacts = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "Nenhum contato selecionado",
        description: "Selecione pelo menos um contato para excluir.",
        variant: "destructive",
      });
      return;
    }

    deleteContactsMutation.mutate(selectedContacts);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Contatos</h2>
              <p className="text-gray-500">Gerencie sua lista de contatos</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden md:inline">Atualizar</span>
              </Button>
              <Button
                className="bg-[#4f46e5] hover:bg-[#4f46e5]/90 flex items-center gap-2"
                onClick={() => setShowImportModal(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden md:inline">Importar Contatos</span>
              </Button>
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-2"
                onClick={handleDeleteContacts}
                disabled={selectedContacts.length === 0 || deleteContactsMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline">Excluir</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar contatos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left">
                      <Checkbox
                        checked={
                          contacts && contacts.length > 0 && 
                          selectedContacts.length === contacts.length
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Nome
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Telefone
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Grupo
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Data de Cadastro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-4" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                      </tr>
                    ))
                  ) : contacts && contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={() => handleSelectContact(contact.id)}
                          />
                        </td>
                        <td className="py-3 px-4 font-medium">{contact.name}</td>
                        <td className="py-3 px-4">{contact.phone}</td>
                        <td className="py-3 px-4">
                          {contact.group ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {contact.group}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <UserPlus className="h-12 w-12 text-gray-300 mb-2" />
                          <p>Nenhum contato encontrado</p>
                          <Button
                            variant="link"
                            className="text-[#4f46e5] mt-2"
                            onClick={() => setShowImportModal(true)}
                          >
                            Importar contatos
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showImportModal && (
        <ImportContacts onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}
