import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Star, Clock, Trash2, Edit, Copy, Plus, MessageSquare, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// Tipos
interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'promocao' | 'comunicado' | 'feriado' | 'produto' | 'custom';
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
}

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

// Lista de templates pré-definidos
const DEFAULT_TEMPLATES = [
  {
    id: 'default-1',
    title: 'Anúncio de Produto',
    content: '🔥 *NOVIDADE EXCLUSIVA!* 🔥\n\nOlá! Temos uma novidade incrível para compartilhar com você!\n\nAcaba de chegar {{produto}} com condições especiais para os membros deste grupo.\n\nAproveite esta oferta por tempo limitado! Responda esta mensagem para mais informações.',
    category: 'produto',
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-2',
    title: 'Promoção Relâmpago',
    content: '⚡ *PROMOÇÃO RELÂMPAGO - APENAS HOJE!* ⚡\n\nOportunidade única para os membros deste grupo!\n\n{{oferta}}\n\nPromoção válida apenas hoje, {{data}}.\n\nInteressados, entrem em contato agora mesmo!',
    category: 'promocao',
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-3',
    title: 'Comunicado Importante',
    content: '📢 *COMUNICADO IMPORTANTE* 📢\n\nPrezados clientes,\n\nInformamos que {{informacao}}.\n\nAgradecemos pela compreensão.\n\nAtenciosamente,\nEquipe {{empresa}}',
    category: 'comunicado',
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  },
];

export default function MessageTemplates({ onSelectTemplate }: MessageTemplatesProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Buscar templates do usuário
  const { data: userTemplates = [], isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ['/api/message-templates'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/message-templates');
        if (!res.ok) throw new Error('Falha ao buscar templates');
        return await res.json();
      } catch (error) {
        console.error('Erro ao buscar templates:', error);
        // Retornar templates padrão se a API falhar
        return DEFAULT_TEMPLATES as MessageTemplate[];
      }
    },
  });

  // Combinar templates padrão com templates do usuário
  const allTemplates = [...userTemplates];
  
  // Filtrar templates por categoria
  const filteredTemplates = activeCategory === 'all' 
    ? allTemplates 
    : allTemplates.filter(template => template.category === activeCategory);
  
  // Favoritos no topo
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    // Primeiro por favoritos
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    // Depois por uso
    return b.usageCount - a.usageCount;
  });

  // Marcar um template como favorito
  const toggleFavorite = async (id: string) => {
    try {
      const template = allTemplates.find(t => t.id === id);
      if (!template) return;
      
      const newValue = !template.isFavorite;
      
      // Otimistic update da UI
      queryClient.setQueryData<MessageTemplate[]>(['/api/message-templates'], 
        old => old?.map(t => t.id === id ? {...t, isFavorite: newValue} : t) || []
      );
      
      // API call
      const res = await fetch(`/api/message-templates/${id}/favorite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newValue }),
      });
      
      if (!res.ok) throw new Error('Falha ao atualizar favorito');
      
      toast({
        title: newValue ? 'Template adicionado aos favoritos' : 'Template removido dos favoritos',
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Erro ao marcar favorito:', error);
      // Reverter UI em caso de erro
      queryClient.invalidateQueries({ queryKey: ['/api/message-templates'] });
      toast({
        title: 'Erro ao atualizar favorito',
        variant: 'destructive',
      });
    }
  };

  // Aplicar template
  const applyTemplate = (content: string) => {
    onSelectTemplate(content);
    toast({
      title: 'Template aplicado',
      description: 'O texto foi inserido na sua mensagem',
      duration: 2000,
    });
  };

  return (
    <div className="message-templates space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-500" />
          Modelos de Mensagens
        </h3>
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" />
          Novo Modelo
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          <TabsTrigger value="promocao" className="text-xs">Promoções</TabsTrigger>
          <TabsTrigger value="comunicado" className="text-xs">Comunicados</TabsTrigger>
          <TabsTrigger value="produto" className="text-xs">Produtos</TabsTrigger>
        </TabsList>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-pulse space-y-2">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : sortedTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>Nenhum modelo encontrado para esta categoria</p>
            </div>
          ) : (
            sortedTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="truncate">{template.title}</span>
                    <div className="flex items-center gap-1 ml-2">
                      <Badge variant={getCategoryVariant(template.category)} className="text-[10px] px-2">
                        {getCategoryLabel(template.category)}
                      </Badge>
                      <button 
                        onClick={() => toggleFavorite(template.id)}
                        className="ml-1 text-gray-400 hover:text-amber-500 focus:outline-none"
                      >
                        <Star 
                          className={`h-4 w-4 ${template.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} 
                        />
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-xs text-gray-600 max-h-[60px] overflow-hidden">
                    {template.content.substring(0, 120)}{template.content.length > 120 ? '...' : ''}
                  </div>
                </CardContent>
                <CardFooter className="py-2 px-4 flex justify-between bg-gray-50 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{getTimeAgo(template.createdAt)}</span>
                    {template.usageCount > 0 && (
                      <span className="ml-2">· Usado {template.usageCount}x</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => applyTemplate(template.content)}
                      className="h-7 px-2 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}

// Funções auxiliares
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    promocao: 'Promoção',
    comunicado: 'Comunicado',
    feriado: 'Feriado',
    produto: 'Produto',
    custom: 'Personalizado',
  };
  return labels[category] || category;
}

function getCategoryVariant(category: string): "default" | "outline" | "secondary" | "destructive" {
  const variants: Record<string, any> = {
    promocao: 'default',
    comunicado: 'secondary',
    feriado: 'outline',
    produto: 'default',
    custom: 'outline',
  };
  return variants[category] || 'outline';
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  
  return date.toLocaleDateString();
}