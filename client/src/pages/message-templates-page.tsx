import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Star,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  MessageSquare,
  Loader2,
  Clock,
  AlertTriangle,
  FileBarChart,
  TagIcon,
  Info,
  BarChart3,
  History
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Definição de tipos
interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'promocao' | 'comunicado' | 'feriado' | 'produto' | 'custom';
  description?: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  variables?: string[];
  tags?: string[];
}

// Esquema para validação do formulário
const templateFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  content: z.string().min(10, { message: "O conteúdo deve ter pelo menos 10 caracteres" }),
  category: z.enum(["promocao", "comunicado", "feriado", "produto", "custom"], {
    message: "Selecione uma categoria válida",
  }),
  description: z.string().optional(),
  tags: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// Mapeamento de categorias para exibição
const categoryMapping: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  promocao: { label: "Promoção", variant: "default" },
  comunicado: { label: "Comunicado", variant: "secondary" },
  feriado: { label: "Feriado", variant: "outline" },
  produto: { label: "Produto", variant: "default" },
  custom: { label: "Personalizado", variant: "outline" },
};

export default function MessageTemplatesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Buscar templates
  const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/message-templates");
        if (!res.ok) throw new Error("Falha ao buscar templates");
        return await res.json();
      } catch (error) {
        console.error("Erro ao buscar templates:", error);
        return [];
      }
    },
  });

  // Filtrar templates
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = activeTab === "all" || template.category === activeTab;
    const matchesSearch = 
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Ordenar templates (favoritos primeiro, depois por uso)
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.usageCount - a.usageCount;
  });

  // Formulário de criação/edição
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "custom",
      description: "",
      tags: "",
    },
  });

  // Resetar formulário e abrir diálogo
  const openCreateDialog = () => {
    form.reset({
      title: "",
      content: "",
      category: "custom",
      description: "",
      tags: "",
    });
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  // Abrir diálogo de edição
  const openEditDialog = (template: MessageTemplate) => {
    form.reset({
      title: template.title,
      content: template.content,
      category: template.category,
      description: template.description || "",
      tags: template.tags?.join(", ") || "",
    });
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  // Criação/edição de template
  const templateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const endpoint = editingTemplate 
        ? `/api/message-templates/${editingTemplate.id}` 
        : "/api/message-templates";
      
      const method = editingTemplate ? "PUT" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      setDialogOpen(false);
      toast({
        title: editingTemplate ? "Template atualizado" : "Template criado",
        description: editingTemplate 
          ? "O template foi atualizado com sucesso" 
          : "O novo template foi criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar template",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    },
  });

  // Favoritar template
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await fetch(`/api/message-templates/${id}/favorite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFavorite }),
      });

      if (!response.ok) throw new Error("Erro ao favoritar template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar favorito",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    },
  });

  // Deletar template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/message-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir template",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      });
    },
  });

  // Enviar formulário
  const onSubmit = (data: TemplateFormValues) => {
    templateMutation.mutate(data);
  };

  // Formato de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para renderizar card de template (visão em grid)
  const renderTemplateCard = (template: MessageTemplate) => (
    <Card key={template.id} className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">{template.title}</CardTitle>
          <div className="flex items-center">
            <button
              onClick={() => toggleFavoriteMutation.mutate({ id: template.id, isFavorite: !template.isFavorite })}
              className="text-gray-400 hover:text-amber-500"
            >
              <Star
                className={`h-5 w-5 ${template.isFavorite ? "text-amber-500 fill-amber-500" : ""}`}
              />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditDialog(template)}>
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Mock da funcionalidade de cópia
                  navigator.clipboard.writeText(template.content);
                  toast({
                    title: "Copiado!",
                    description: "Conteúdo copiado para a área de transferência",
                  });
                }}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar conteúdo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir este template?")) {
                      deleteTemplateMutation.mutate(template.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={categoryMapping[template.category]?.variant || "outline"}>
            {categoryMapping[template.category]?.label || template.category}
          </Badge>
          {template.usageCount > 0 && (
            <Badge variant="outline" className="text-xs bg-gray-50">
              Usado {template.usageCount}x
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-gray-600 line-clamp-4 whitespace-pre-line">
          {template.content}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4 flex justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>{formatDate(template.createdAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => openEditDialog(template)}
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  // Função para renderizar linha de template (visão em lista)
  const renderTemplateRow = (template: MessageTemplate) => (
    <div
      key={template.id}
      className="grid grid-cols-[auto,1fr,auto] gap-4 border-b py-4 hover:bg-gray-50 px-4 -mx-4"
    >
      <div className="flex items-start pt-1">
        <button
          onClick={() => toggleFavoriteMutation.mutate({ id: template.id, isFavorite: !template.isFavorite })}
          className="text-gray-400 hover:text-amber-500"
        >
          <Star
            className={`h-5 w-5 ${template.isFavorite ? "text-amber-500 fill-amber-500" : ""}`}
          />
        </button>
      </div>
      <div>
        <div className="font-medium">{template.title}</div>
        <div className="text-sm text-gray-600 line-clamp-2 mt-1 whitespace-pre-line">
          {template.content}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={categoryMapping[template.category]?.variant || "outline"}>
            {categoryMapping[template.category]?.label || template.category}
          </Badge>
          <div className="text-xs text-gray-500">
            Criado em {formatDate(template.createdAt)}
          </div>
          {template.usageCount > 0 && (
            <div className="text-xs text-gray-500">
              • Usado {template.usageCount} vezes
            </div>
          )}
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            navigator.clipboard.writeText(template.content);
            toast({
              title: "Copiado!",
              description: "Conteúdo copiado para a área de transferência",
            });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => openEditDialog(template)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir este template?")) {
                  deleteTemplateMutation.mutate(template.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <TopNav />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Templates de Mensagens</h1>
              <p className="text-gray-500 mt-1">
                Gerencie e crie modelos de mensagens para envio rápido
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <History className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                onClick={openCreateDialog} 
                className="gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                <Plus className="h-4 w-4" />
                Novo Template
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar templates..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </Button>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="promocao">Promoções</TabsTrigger>
                <TabsTrigger value="comunicado">Comunicados</TabsTrigger>
                <TabsTrigger value="produto">Produtos</TabsTrigger>
                <TabsTrigger value="feriado">Feriados</TabsTrigger>
                <TabsTrigger value="custom">Personalizados</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : sortedTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
                    <p className="text-sm max-w-md mx-auto">
                      {searchTerm
                        ? `Não encontramos templates correspondentes a "${searchTerm}"`
                        : "Crie seu primeiro template para enviar mensagens padronizadas"}
                    </p>
                    <Button className="mt-4 gap-2" onClick={openCreateDialog}>
                      <Plus className="h-4 w-4" />
                      Criar Template
                    </Button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedTemplates.map(renderTemplateCard)}
                  </div>
                ) : (
                  <div className="space-y-0 divide-y">
                    {sortedTemplates.map(renderTemplateRow)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas para Templates Eficientes</CardTitle>
              <CardDescription>
                Use essas recomendações para criar templates mais eficazes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-orange-100 p-2 rounded-full h-fit">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Seja conciso e claro</h4>
                  <p className="text-sm text-gray-600">
                    Mantenha suas mensagens diretas e ao ponto. Evite textos muito longos que podem cansar o leitor.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-blue-100 p-2 rounded-full h-fit">
                  <TagIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Use variáveis para personalização</h4>
                  <p className="text-sm text-gray-600">
                    Inclua variáveis como {"{{nome}}"} e {"{{empresa}}"} para personalizar automaticamente suas mensagens para cada destinatário.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-green-100 p-2 rounded-full h-fit">
                  <FileBarChart className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Analise o desempenho</h4>
                  <p className="text-sm text-gray-600">
                    Acompanhe quais templates têm melhor taxa de resposta e adapte seu conteúdo com base nesses dados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Diálogo de criação/edição de template */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Faça as alterações desejadas e salve o template."
                : "Crie um novo modelo de mensagem para usar em suas comunicações."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Promoção de Produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="promocao">Promoção</SelectItem>
                        <SelectItem value="comunicado">Comunicado</SelectItem>
                        <SelectItem value="feriado">Feriado</SelectItem>
                        <SelectItem value="produto">Produto</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo da Mensagem</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite aqui o conteúdo da mensagem..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use {"{{variavel}}"} para inserir variáveis que serão substituídas ao enviar a mensagem.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Uma breve descrição sobre o uso deste template"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="promocao, lancamento, verao (separadas por vírgula)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Adicione tags relacionadas para facilitar a busca.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={templateMutation.isPending}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                >
                  {templateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingTemplate ? "Atualizar Template" : "Criar Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}