import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, Users, Loader2, CheckCircle2, ListChecks, 
  Clock, Search, X, Info
} from "lucide-react";
import MessagePreview from "./message-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Definição de tipos para grupos
interface WhatsAppGroup {
  id: string;
  name: string;
  isGroup: boolean;
  participantsCount?: number;
  timestamp: number;
  unreadCount?: number;
  tag?: string;
  isFavorite?: boolean;
  lastMessageSent?: string;
  campaignStatus?: 'active' | 'pending' | 'completed' | 'none';
}

// Validação de formulário
const formSchema = z.object({
  message: z.string().min(1, "A mensagem não pode estar vazia"),
  groupIds: z.array(z.string()).min(1, "Selecione ao menos um grupo"),
  isScheduled: z.boolean().default(false),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function GroupMessageForm({ onClose }: { onClose?: () => void }) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sendingProgress, setSendingProgress] = useState({ total: 0, sent: 0, failed: 0 });
  
  // Estados para agendamento
  const [isScheduled, setIsScheduled] = useState(false);

  // Buscar grupos do WhatsApp
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['/api/whatsapp/groups'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/whatsapp/groups');
        if (!res.ok) throw new Error('Falha ao buscar grupos do WhatsApp');
        return res.json();
      } catch (error) {
        console.error('Erro ao buscar grupos do WhatsApp:', error);
        return [];
      }
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      groupIds: [],
      isScheduled: false,
      scheduledDate: "",
      scheduledTime: ""
    },
  });

  // Filtrar grupos com base no termo de busca
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Observar mensagem para pré-visualização
  const previewMessage = form.watch("message");
  
  // Quando os IDs de grupo selecionados no formulário mudam
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'groupIds') {
        setSelectedGroups(value.groupIds as string[] || []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Manipular seleção de grupo
  const handleGroupSelection = (groupId: string, isChecked: boolean) => {
    const currentGroupIds = form.getValues("groupIds") || [];
    
    let newGroupIds: string[];
    if (isChecked) {
      newGroupIds = [...currentGroupIds, groupId];
    } else {
      newGroupIds = currentGroupIds.filter(id => id !== groupId);
    }
    
    form.setValue("groupIds", newGroupIds, { shouldValidate: true });
  };

  // Enviar mensagens para grupos selecionados
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSending(true);
      
      const { message, groupIds, isScheduled, scheduledDate, scheduledTime } = data;
      
      if (groupIds.length === 0) {
        toast({
          title: "Erro ao enviar mensagem",
          description: "Selecione ao menos um grupo para enviar a mensagem",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }
      
      // Validar agendamento se estiver ativado
      if (isScheduled) {
        if (!scheduledDate || !scheduledTime) {
          toast({
            title: "Erro de agendamento",
            description: "Por favor, preencha a data e hora de agendamento",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }
        
        // Verificar se a data e hora são futuras
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
          toast({
            title: "Erro de agendamento",
            description: "A data e hora de agendamento devem ser futuras",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }
      }
      
      // Inicializar contador
      setSendingProgress({
        total: groupIds.length,
        sent: 0,
        failed: 0
      });
      
      if (isScheduled) {
        // Agendar mensagens para envio futuro
        try {
          const response = await fetch('/api/whatsapp/schedule-group-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              groupIds,
              message,
              scheduledDate,
              scheduledTime
            }),
          });
          
          if (response.ok) {
            toast({
              title: "Mensagens agendadas com sucesso",
              description: `As mensagens para ${groupIds.length} grupos foram agendadas para ${scheduledDate} às ${scheduledTime}`,
              variant: "default",
            });
            
            form.reset();
            setSelectedGroups([]);
            setIsScheduled(false);
            
            // Atualizar a lista de agendamentos, se necessário
            queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao agendar mensagens");
          }
        } catch (error) {
          console.error("Erro ao agendar mensagens:", error);
          toast({
            title: "Erro ao agendar mensagens",
            description: error instanceof Error ? error.message : "Ocorreu um erro ao agendar as mensagens para os grupos",
            variant: "destructive",
          });
        }
      } else {
        // Enviar mensagem para cada grupo imediatamente
        for (const groupId of groupIds) {
          try {
            const response = await fetch('/api/whatsapp/send-to-group', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                groupId,
                message
              }),
            });
            
            if (response.ok) {
              setSendingProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
            } else {
              setSendingProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
            
            // Adicionar pequeno delay entre os envios
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`Erro ao enviar mensagem para grupo ${groupId}:`, error);
            setSendingProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        }
        
        toast({
          title: "Mensagens enviadas para grupos",
          description: `Enviadas: ${sendingProgress.sent}, Falhas: ${sendingProgress.failed}`,
          variant: sendingProgress.failed === 0 ? "default" : "destructive",
        });
        
        // Se houve algum envio bem-sucedido, limpar o formulário
        if (sendingProgress.sent > 0) {
          form.reset();
          setSelectedGroups([]);
        }
      }
    } catch (error) {
      console.error("Erro ao processar mensagens:", error);
      toast({
        title: "Erro ao processar mensagens",
        description: "Ocorreu um erro ao tentar processar as mensagens para os grupos",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Número total de participantes nos grupos selecionados
  const totalParticipants = selectedGroups.reduce((total, groupId) => {
    const group = groups.find(g => g.id === groupId);
    return total + (group?.participantsCount || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna de entrada */}
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Seleção de Grupos
                </h3>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar grupos..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto p-1">
                    {isLoadingGroups ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum grupo encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredGroups.map((group) => (
                          <Card key={group.id} className="cursor-pointer hover:bg-gray-50 border-gray-200">
                            <CardContent className="p-3 flex items-center">
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={selectedGroups.includes(group.id)}
                                onCheckedChange={(checked) => {
                                  handleGroupSelection(group.id, checked === true);
                                }}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {group.name}
                                  {group.isFavorite && (
                                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 text-xs">
                                      Favorito
                                    </Badge>
                                  )}
                                  {group.campaignStatus === 'active' && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                      Campanha Ativa
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                                  <Users className="h-3 w-3 mr-1 inline" />
                                  {group.participantsCount || 0} membros
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ID: <span className="font-mono">{group.id}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedGroups.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <div className="flex items-center text-blue-800 text-sm">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      <span>
                        <b>{selectedGroups.length}</b> grupos selecionados com aproximadamente 
                        <b> {totalParticipants}</b> participantes no total
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem para os grupos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        className="h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isScheduled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsScheduled(checked === true);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-medium">
                      Agendar envio da mensagem
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              {isScheduled && (
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Programação de Envio
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de envio</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="text-sm text-blue-700">
                    <Info className="h-4 w-4 inline mr-1" />
                    As mensagens serão enviadas automaticamente na data e hora programadas
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  {showPreview ? (
                    <>
                      <ListChecks className="h-4 w-4" />
                      <span>Ocultar pré-visualização</span>
                    </>
                  ) : (
                    <>
                      <ListChecks className="h-4 w-4" />
                      <span>Mostrar pré-visualização</span>
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={isSending || selectedGroups.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : isScheduled ? (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Agendar mensagem</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Enviar para grupos</span>
                    </>
                  )}
                </Button>
                
                {onClose && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Fechar</span>
                  </Button>
                )}
              </div>
              
              {isSending && sendingProgress.total > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando mensagens para grupos...
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center p-2 bg-white rounded-md">
                      <span className="text-gray-500">Total</span>
                      <span className="font-medium text-gray-800">{sendingProgress.total}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white rounded-md">
                      <span className="text-gray-500">Enviados</span>
                      <span className="font-medium text-green-600">{sendingProgress.sent}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white rounded-md">
                      <span className="text-gray-500">Falhas</span>
                      <span className="font-medium text-red-600">{sendingProgress.failed}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna de pré-visualização */}
            {showPreview && (
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <ListChecks className="h-5 w-5 mr-2 text-blue-500" />
                  Pré-visualização da mensagem
                </h3>
                <MessagePreview content={previewMessage} />
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}