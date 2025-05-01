import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Send, Users, Smartphone, Upload, 
  ListChecks, Loader2, CheckCircle2, AlertCircle 
} from "lucide-react";
import MessagePreview from "./message-preview";

// Validação de formulário
const formSchema = z.object({
  phoneNumbers: z.string().min(1, "Insira ao menos um número de telefone"),
  message: z.string().min(1, "A mensagem não pode estar vazia"),
});

type FormValues = z.infer<typeof formSchema>;

export default function DirectMessageForm() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<{
    total: number;
    sent: number;
    failed: number;
  }>({ total: 0, sent: 0, failed: 0 });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumbers: "",
      message: "",
    },
  });

  const previewMessage = form.watch("message");

  // Função para validar e preparar números de telefone
  const preparePhoneNumbers = (input: string): string[] => {
    // Remover espaços e dividir por qualquer separador (vírgula, ponto-e-vírgula, nova linha)
    const numbersRaw = input
      .split(/[,;\n]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    // Formatar números (remover não-dígitos, exceto o sinal de +)
    return numbersRaw.map(num => {
      // Se já tiver +, manter; caso contrário, considerar BR e adicionar +55
      if (num.startsWith("+")) {
        return num.replace(/[^\d+]/g, "");
      }
      
      // Remove caracteres não numéricos e adiciona prefixo BR se necessário
      let cleaned = num.replace(/[^\d]/g, "");
      
      // Se o número tiver 10-11 dígitos sem o DDD internacional, adiciona +55
      if (cleaned.length >= 10 && cleaned.length <= 11) {
        return "+55" + cleaned;
      }
      
      return cleaned;
    });
  };

  // Enviar mensagens
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSending(true);
      
      // Preparar números
      const phoneNumbers = preparePhoneNumbers(data.phoneNumbers);
      if (phoneNumbers.length === 0) {
        toast({
          title: "Erro ao enviar mensagens",
          description: "Não foi possível identificar números de telefone válidos",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }
      
      setSendingStatus({
        total: phoneNumbers.length,
        sent: 0,
        failed: 0
      });
      
      // Simular envio para cada número (em um caso real, seria uma chamada à API)
      for (let i = 0; i < phoneNumbers.length; i++) {
        const phoneNumber = phoneNumbers[i];
        try {
          // Fazer chamada à API para enviar mensagem
          const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: phoneNumber,
              message: data.message
            }),
          });
          
          if (response.ok) {
            setSendingStatus(prev => ({ ...prev, sent: prev.sent + 1 }));
          } else {
            setSendingStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
          
          // Pequeno delay para não sobrecarregar o WhatsApp
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          setSendingStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
      
      toast({
        title: "Mensagens enviadas",
        description: `Enviadas: ${sendingStatus.sent}, Falhas: ${sendingStatus.failed}`,
        variant: sendingStatus.failed === 0 ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Erro ao enviar mensagens:", error);
      toast({
        title: "Erro ao enviar mensagens",
        description: "Ocorreu um erro ao tentar enviar as mensagens",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna de entrada */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="phoneNumbers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Números de WhatsApp</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite os números separados por vírgula, ponto-e-vírgula ou nova linha.
Exemplo:
+5511987654321
11987654322
(11) 98765-4323"
                        className="h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Smartphone className="h-3 w-3 mr-1" />
                      Números sem prefixo internacional serão considerados do Brasil (+55)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        className="h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={isSending}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Enviar mensagem</span>
                    </>
                  )}
                </Button>
              </div>

              {isSending && sendingStatus.total > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando mensagens...
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center p-2 bg-white rounded-md">
                      <span className="text-gray-500">Total</span>
                      <span className="font-medium text-gray-800">{sendingStatus.total}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white rounded-md">
                      <span className="text-gray-500">Enviados</span>
                      <span className="font-medium text-green-600">{sendingStatus.sent}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white rounded-md">
                      <span className="text-gray-500">Falhas</span>
                      <span className="font-medium text-red-600">{sendingStatus.failed}</span>
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