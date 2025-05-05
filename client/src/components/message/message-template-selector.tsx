import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Sparkles, Copy, Save, MessageSquare } from "lucide-react";

interface MessageTemplateProps {
  onSelectTemplate: (templateContent: string) => void;
}

// Templates pré-definidos para uso rápido
const PREDEFINED_TEMPLATES = [
  {
    id: "welcome",
    name: "Boas-vindas",
    content: "Olá {nome}, seja bem-vindo(a) ao nosso grupo! Estamos felizes em ter você conosco. Aqui você receberá todas as informações sobre o lançamento do {produto}."
  },
  {
    id: "launch_day",
    name: "Dia de Lançamento",
    content: "🚀 HOJE É O GRANDE DIA! 🚀\n\nO lançamento de {produto} está começando agora! Acesse {link} para garantir sua vaga com condições especiais disponíveis apenas nas próximas {horas} horas!"
  },
  {
    id: "reminder",
    name: "Lembrete",
    content: "⏰ LEMBRETE IMPORTANTE ⏰\n\nFaltam apenas {horas} horas para o fechamento da oferta especial de lançamento do {produto}! Não perca essa oportunidade exclusiva! Acesse agora: {link}"
  },
  {
    id: "bonus",
    name: "Anúncio de Bônus",
    content: "🎁 BÔNUS EXCLUSIVO LIBERADO! 🎁\n\nAnunciando um bônus especial para quem adquirir {produto} hoje: {bonus_description}. Este bônus tem valor de R$ {bonus_value} mas está incluso para você! Acesse: {link}"
  },
  {
    id: "testimonial",
    name: "Depoimento de Cliente",
    content: "✨ RESULTADOS REAIS ✨\n\n\"{testimonial}\"\n\n- {client_name}, {client_location}.\n\nVocê também pode transformar sua realidade com {produto}! Acesse: {link}"
  }
];

export default function MessageTemplateSelector({ onSelectTemplate }: MessageTemplateProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customTemplate, setCustomTemplate] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado para armazenar templates customizados
  const [customTemplates, setCustomTemplates] = useState<Array<{id: string, name: string, content: string}>>([
    {
      id: "custom_1",
      name: "Promoção Relâmpago",
      content: "⚡ PROMOÇÃO RELÂMPAGO ⚡\n\nApenas nas próximas {horas} horas: {discount}% OFF em {produto}!\n\nUse o cupom: {coupon_code}\n\nAcesse agora: {link}"
    }
  ]);

  // Todos os templates disponíveis
  const allTemplates = [...PREDEFINED_TEMPLATES, ...customTemplates];

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const template = allTemplates.find(t => t.id === id);
    if (template) {
      setCustomTemplate(template.content);
    }
  };

  const handleApplyTemplate = () => {
    onSelectTemplate(customTemplate);
    toast({
      title: "Template aplicado",
      description: "O template foi aplicado ao seu texto",
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, forneça um nome para o template",
        variant: "destructive",
      });
      return;
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: newTemplateName,
      content: newTemplateContent || customTemplate,
    };

    setCustomTemplates([...customTemplates, newTemplate]);
    setShowSaveDialog(false);
    setNewTemplateName("");
    setNewTemplateContent("");

    toast({
      title: "Template salvo",
      description: "Seu template personalizado foi salvo com sucesso",
    });
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt necessário",
        description: "Por favor, descreva o tipo de mensagem que você quer gerar",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Chamada para a API real OpenAI
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao gerar mensagem com IA');
      }
      
      const data = await response.json();
      const aiGeneratedText = data.text;
      
      setCustomTemplate(aiGeneratedText);
      setShowAIDialog(false);
      
      toast({
        title: "Conteúdo gerado com IA",
        description: "A mensagem foi gerada com sucesso! Você pode editá-la antes de aplicar.",
      });
    } catch (error) {
      console.error('Erro na geração com IA:', error);
      toast({
        title: "Erro na geração",
        description: error instanceof Error ? error.message : "Não foi possível gerar o conteúdo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label>Selecione um template</Label>
        <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Escolha um template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Selecione um template</SelectItem>
            {allTemplates.map(template => (
              <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Conteúdo do template</Label>
          <div className="flex gap-2">
            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Gerar com IA</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Gerar mensagem com IA</DialogTitle>
                  <DialogDescription>
                    Descreva o tipo de mensagem que você deseja criar e nossa IA irá gerá-la para você.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ai-prompt">Descreva sua mensagem</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="Ex: Uma mensagem para anunciar um lançamento de produto com urgência"
                      rows={4}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-orange-500"
                    onClick={generateWithAI}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar com IA
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={() => {
              setNewTemplateContent(customTemplate);
              setShowSaveDialog(true);
            }} className="flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5 text-green-600" />
              <span>Salvar</span>
            </Button>
          </div>
        </div>
        <Textarea
          value={customTemplate}
          onChange={(e) => setCustomTemplate(e.target.value)}
          placeholder="Conteúdo do template aqui..."
          rows={8}
          className="font-mono text-sm"
        />
        <div className="text-xs text-gray-500 flex items-start gap-1 mt-1">
          <MessageSquare className="h-3.5 w-3.5 mt-0.5" />
          <span>
            Use <code className="bg-gray-100 px-1 rounded text-xs">{"{placeholder}"}</code> para campos dinâmicos como <code className="bg-gray-100 px-1 rounded text-xs">{"{nome}"}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{"{produto}"}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{"{link}"}</code>, etc.
          </span>
        </div>
      </div>

      <Button 
        onClick={handleApplyTemplate} 
        className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
      >
        <Copy className="mr-2 h-4 w-4" />
        Aplicar Template
      </Button>

      {/* Modal para salvar template */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Salvar Template</DialogTitle>
            <DialogDescription>
              Dê um nome ao seu template para poder reutilizá-lo no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Ex: Agradecimento Pós-Compra"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={newTemplateContent || customTemplate}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}