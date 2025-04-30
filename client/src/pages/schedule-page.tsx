import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, CalendarPlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

interface ScheduledMessage {
  id: string;
  title: string;
  recipients: string;
  recipientCount: number;
  type: "individual" | "group" | "campaign" | "automation";
  scheduledFor: string;
}

export default function SchedulePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showComposer, setShowComposer] = useState(false);

  // Query for scheduled messages
  const { data: scheduledMessages, isLoading, refetch } = useQuery<ScheduledMessage[]>({
    queryKey: ["/api/schedules", { search: searchTerm, filter }],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/schedules?search=${searchTerm}&filter=${filter}`);
        if (!res.ok) throw new Error("Failed to fetch scheduled messages");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });

  const getTypeBadge = (type: ScheduledMessage["type"]) => {
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
      case "campaign":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
            Campanha
          </span>
        );
      case "automation":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            Automação
          </span>
        );
      default:
        return null;
    }
  };

  // Function to check if the scheduled date is today
  const isToday = (dateStr: string) => {
    const today = new Date();
    const scheduledDate = new Date(dateStr);
    return (
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Agendamentos</h2>
              <p className="text-gray-500">Gerencie suas mensagens agendadas</p>
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
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden md:inline">Agendar Mensagem</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar agendamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Grupo</SelectItem>
                    <SelectItem value="campaign">Campanha</SelectItem>
                    <SelectItem value="automation">Automação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-4">Para hoje</h3>
              <div className="space-y-4 mb-8">
                {isLoading ? (
                  [...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))
                ) : scheduledMessages && scheduledMessages.filter(msg => isToday(msg.scheduledFor)).length > 0 ? (
                  scheduledMessages
                    .filter(msg => isToday(msg.scheduledFor))
                    .map((message) => (
                      <div
                        key={message.id}
                        className="bg-gray-50 rounded-lg p-4 border-l-4 border-[#4f46e5]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{message.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {message.recipients} • {message.recipientCount} contatos
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getTypeBadge(message.type)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-8 w-8 p-0 text-gray-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-[#4f46e5] font-medium">
                            Hoje, {new Date(message.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Button variant="link" size="sm" className="h-6 p-0 text-[#4f46e5]">
                            Visualizar
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhum agendamento para hoje</p>
                  </div>
                )}
              </div>

              <h3 className="font-medium text-gray-700 mb-4">Próximos agendamentos</h3>
              <div className="space-y-4">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))
                ) : scheduledMessages && scheduledMessages.filter(msg => !isToday(msg.scheduledFor)).length > 0 ? (
                  scheduledMessages
                    .filter(msg => !isToday(msg.scheduledFor))
                    .map((message) => (
                      <div
                        key={message.id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{message.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {message.recipients} • {message.recipientCount} contatos
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getTypeBadge(message.type)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-8 w-8 p-0 text-gray-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm">
                          <span className="text-gray-600 font-medium">
                            {new Date(message.scheduledFor).toLocaleDateString()} {new Date(message.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Button variant="link" size="sm" className="h-6 p-0 text-[#4f46e5]">
                            Visualizar
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhum agendamento futuro</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showComposer && <MessageComposer onClose={() => setShowComposer(false)} />}
    </div>
  );
}
