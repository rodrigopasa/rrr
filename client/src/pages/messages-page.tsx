import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, RefreshCw, Send, Trash2 } from "lucide-react";
import MessageComposer from "@/components/message/message-composer";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  title: string;
  recipients: string;
  status: "sent" | "delivered" | "failed" | "scheduled";
  type: "individual" | "group";
  sentAt: string;
}

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showComposer, setShowComposer] = useState(false);

  // Query for messages
  const { data: messages, isLoading, refetch } = useQuery<Message[]>({
    queryKey: ["/api/messages", { search: searchTerm, filter }],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/messages?search=${searchTerm}&filter=${filter}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });

  const getStatusBadge = (status: Message["status"]) => {
    switch (status) {
      case "sent":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
            <i className="ri-send-plane-fill mr-1 text-xs"></i>
            Enviada
          </span>
        );
      case "delivered":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
            <i className="ri-check-double-line mr-1 text-xs"></i>
            Entregue
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
            <i className="ri-error-warning-line mr-1 text-xs"></i>
            Falhou
          </span>
        );
      case "scheduled":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center">
            <i className="ri-calendar-line mr-1 text-xs"></i>
            Agendada
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: Message["type"]) => {
    switch (type) {
      case "individual":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            Individual
          </span>
        );
      case "group":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            Grupo
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Mensagens</h2>
              <p className="text-gray-500">Gerencie suas mensagens enviadas e agendadas</p>
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
                onClick={() => setShowComposer(true)}
              >
                <Send className="h-4 w-4" />
                <span className="hidden md:inline">Nova Mensagem</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="delivered">Entregues</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="scheduled">Agendados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Título / Assunto
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Destinatários
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Tipo
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                      Data de Envio
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="py-3 px-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                      </tr>
                    ))
                  ) : messages && messages.length > 0 ? (
                    messages.map((message) => (
                      <tr key={message.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{message.title}</td>
                        <td className="py-3 px-4">{message.recipients}</td>
                        <td className="py-3 px-4">{getStatusBadge(message.status)}</td>
                        <td className="py-3 px-4">{getTypeBadge(message.type)}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(message.sentAt).toLocaleDateString()} {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Send className="h-12 w-12 text-gray-300 mb-2" />
                          <p>Nenhuma mensagem encontrada</p>
                          <Button
                            variant="link"
                            className="text-[#4f46e5] mt-2"
                            onClick={() => setShowComposer(true)}
                          >
                            Enviar nova mensagem
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

      {showComposer && <MessageComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
