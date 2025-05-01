import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import MessagePreview from "./message-preview";

interface MessageComposerProps {
  onClose: () => void;
}

type SendType = "individual" | "group";

export default function MessageComposer({ onClose }: MessageComposerProps) {
  const { toast } = useToast();
  const [sendType, setSendType] = useState<SendType>("individual");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleRemoveContact = (contact: string) => {
    setSelectedContacts(selectedContacts.filter((c) => c !== contact));
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um contato",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);

      const payload = {
        recipients: selectedContacts,
        subject,
        message,
        scheduled: isScheduled,
        scheduledDate: isScheduled ? date : null,
        scheduledTime: isScheduled ? time : null,
      };

      await apiRequest("POST", "/api/messages/send", payload);

      toast({
        title: "Sucesso",
        description: isScheduled
          ? "Mensagem agendada com sucesso!"
          : "Mensagem enviada com sucesso!",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Mock search results (would be replaced with actual API call)
  const contactSearchResults = [
    "João Silva",
    "Maria Oliveira",
    "Carlos Pereira",
  ].filter(
    (contact) =>
      searchTerm && 
      contact.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedContacts.includes(contact)
  );

  const handleAddContact = (contact: string) => {
    if (!selectedContacts.includes(contact)) {
      setSelectedContacts([...selectedContacts, contact]);
      setSearchTerm("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Nova Mensagem</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recipients Section */}
            <div className="md:col-span-1">
              <h3 className="font-medium mb-4">Destinatários</h3>

              <div className="space-y-4">
                {/* Type Selector */}
                <div>
                  <Label className="mb-1">Tipo de Envio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`py-2 px-3 rounded border flex items-center justify-center text-sm ${
                        sendType === "individual"
                          ? "bg-gradient-to-r from-blue-500 to-orange-500 text-white border-transparent"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSendType("individual")}
                    >
                      <i className="ri-user-line mr-1"></i>
                      Individual
                    </button>
                    <button
                      className={`py-2 px-3 rounded border flex items-center justify-center text-sm ${
                        sendType === "group"
                          ? "bg-gradient-to-r from-blue-500 to-orange-500 text-white border-transparent"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSendType("group")}
                    >
                      <i className="ri-group-line mr-1"></i>
                      Grupo
                    </button>
                  </div>
                </div>

                {/* Contact Selection */}
                <div>
                  <Label htmlFor="contact-search" className="mb-1">
                    Buscar Contatos
                  </Label>
                  <div className="relative">
                    <Input
                      id="contact-search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nome ou número"
                      className="pr-10"
                    />
                    <i className="ri-search-line absolute right-3 top-2.5 text-gray-500"></i>
                    
                    {contactSearchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {contactSearchResults.map((contact) => (
                          <div
                            key={contact}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleAddContact(contact)}
                          >
                            {contact}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Contacts */}
                <div>
                  <Label className="mb-1">Contatos Selecionados</Label>
                  <div className="border border-gray-300 rounded-md p-2 min-h-[150px] max-h-[200px] overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {selectedContacts.map((contact) => (
                        <div
                          key={contact}
                          className="bg-gray-100 rounded-full py-1 px-3 flex items-center text-sm"
                        >
                          <span>{contact}</span>
                          <button
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            onClick={() => handleRemoveContact(contact)}
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedContacts.length} contatos selecionados
                  </p>
                </div>
              </div>
            </div>

            {/* Message Content Section */}
            <div className="md:col-span-2">
              <h3 className="font-medium mb-4">Conteúdo da Mensagem</h3>

              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <Label htmlFor="message-subject" className="mb-1">
                    Assunto
                  </Label>
                  <Input
                    id="message-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto da mensagem"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="message-body">
                      Mensagem
                    </Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowPreview(!showPreview)}
                      className={`h-8 text-xs border-gray-300 ${showPreview ? 'text-orange-500 hover:text-orange-600 hover:border-orange-500' : 'text-blue-500 hover:text-blue-600 hover:border-blue-500'}`}
                    >
                      {showPreview ? (
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Ocultar Visualização
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Pré-visualizar
                        </span>
                      )}
                    </Button>
                  </div>

                  {showPreview ? (
                    <div className="mt-2 mb-3">
                      <MessagePreview 
                        content={message} 
                        recipientName={selectedContacts.length > 0 ? selectedContacts[0] : "Destinatário"}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Toolbar */}
                      <div className="flex flex-wrap border border-gray-300 border-b-0 rounded-t-md bg-gray-50 p-2">
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-bold"></i>
                        </button>
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-italic"></i>
                        </button>
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-underline"></i>
                        </button>
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-link"></i>
                        </button>
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-emotion-line"></i>
                        </button>
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-image-line"></i>
                        </button>
                        <button className="p-1 text-gray-700 hover:bg-gray-200 rounded mr-1">
                          <i className="ri-file-line"></i>
                        </button>
                      </div>

                      {/* Text Area */}
                      <Textarea
                        id="message-body"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite sua mensagem aqui..."
                        rows={6}
                        className="rounded-t-none"
                      />
                    </>
                  )}
                </div>

                {/* Scheduling */}
                <div>
                  <div className="flex items-center mb-2">
                    <Checkbox
                      id="schedule-message"
                      checked={isScheduled}
                      onCheckedChange={(checked) => setIsScheduled(!!checked)}
                      className="mr-2"
                    />
                    <Label htmlFor="schedule-message" className="text-sm font-medium text-gray-700">
                      Agendar envio
                    </Label>
                  </div>

                  {isScheduled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="schedule-date" className="mb-1">
                          Data
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? (
                                format(date, "PPP", { locale: ptBR })
                              ) : (
                                <span>Escolha uma data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="schedule-time" className="mb-1">
                          Hora
                        </Label>
                        <Input
                          id="schedule-time"
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            disabled={isSending}
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 transition-all duration-300"
          >
            {isSending ? (
              <span className="flex items-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                {isScheduled ? "Agendando..." : "Enviando..."}
              </span>
            ) : (
              <span className="flex items-center">
                <i className="ri-send-plane-fill mr-2"></i>
                {isScheduled ? "Agendar" : "Enviar"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
