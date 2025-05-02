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
import { AdvancedMessageEditor, MessagePreview } from "./advanced-message-editor";

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
    const formattedNumbers = numbersRaw.map(num => {
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
    
    // Filtrar para garantir que só números com pelo menos 12 dígitos sejam incluídos
    // (Código de país + DDD + número)
    return formattedNumbers.filter(num => {
      // Se começar com +, o número precisa ter pelo menos 13 caracteres (+55 + DDD + número)
      if (num.startsWith("+")) {
        return num.length >= 13;
      }
      // Se não começar com +, precisa ter pelo menos 12 dígitos (55 + DDD + número)
      return num.length >= 12;
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
          description: "Não foi possível identificar números de telefone válidos. Os números precisam incluir código do país (ex: +55) + DDD + número.",
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
      
      // Enviar para todos os números de uma vez
      try {
        // Fazer uma única chamada à API para todos os números
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: phoneNumbers.join(','), // Enviar todos os números em uma única string separada por vírgula
            message: data.message
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          setSendingStatus({
            total: phoneNumbers.length,
            sent: result.successful || 0,
            failed: result.failed || 0
          });
          
          console.log("Resultado do envio:", result);
        } else {
          const errorText = await response.text();
          console.error("Erro na resposta:", errorText);
          
          // Se a resposta falhar completamente, considerar todos como falha
          setSendingStatus(prev => ({ 
            ...prev,
            failed: phoneNumbers.length 
          }));
          
          throw new Error(`Erro no servidor: ${response.status} ${errorText}`);
        }
      } catch (error) {
        console.error("Erro durante o envio:", error);
        // Em caso de erro na chamada, considerar todos como falha
        setSendingStatus({
          total: phoneNumbers.length,
          sent: 0,
          failed: phoneNumbers.length
        });
        
        throw error; // Repassar o erro para ser tratado no próximo catch
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
        description: error instanceof Error 
          ? `Ocorreu um erro: ${error.message}`
          : "Ocorreu um erro ao tentar enviar as mensagens. Verifique o formato dos números.",
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
                      <AdvancedMessageEditor
                        initialValue={field.value}
                        onChange={field.onChange}
                        placeholder="Digite sua mensagem aqui..."
                        minHeight="200px"
                        showToolbar={true}
                        showEmojis={true}
                        className="border rounded-md"
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