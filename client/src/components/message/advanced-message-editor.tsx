import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Link, Image, Smile, List, ListOrdered, 
  Code, FileUp, Check, X, SendHorizonal 
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface AdvancedMessageEditorProps {
  initialValue?: string;
  onChange?: (content: string) => void;
  onSend?: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  showToolbar?: boolean;
  showEmojis?: boolean;
  showSendButton?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function AdvancedMessageEditor({
  initialValue = '',
  onChange,
  onSend,
  placeholder = 'Digite sua mensagem aqui...',
  minHeight = '200px',
  showToolbar = true,
  showEmojis = true,
  showSendButton = false,
  readOnly = false,
  className = ''
}: AdvancedMessageEditorProps) {
  const [content, setContent] = useState(initialValue);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Atualiza o estado do conteúdo quando o valor inicial muda
  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  // Informa ao componente pai quando o conteúdo muda
  useEffect(() => {
    if (onChange) {
      onChange(content);
    }
  }, [content, onChange]);

  // Captura a seleção atual para inserir emojis/links no local correto
  const captureSelection = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(editorRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        
        setSelection({
          start,
          end: start + range.toString().length
        });
      }
    }
  };

  // Insere texto na posição da seleção
  const insertAtSelection = (insertText: string) => {
    const newContent = 
      content.substring(0, selection.start) + 
      insertText + 
      content.substring(selection.end);
    
    setContent(newContent);
  };

  // Formata texto selecionado
  const formatText = (format: 'bold' | 'italic' | 'code') => {
    const selectedText = content.substring(selection.start, selection.end);
    
    if (!selectedText) {
      toast({
        title: 'Nenhum texto selecionado',
        description: 'Selecione algum texto para formatá-lo.',
        variant: 'default',
      });
      return;
    }

    let formattedText = selectedText;
    
    switch (format) {
      case 'bold':
        formattedText = `*${selectedText}*`;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'code':
        formattedText = `\`\`\`${selectedText}\`\`\``;
        break;
    }

    insertAtSelection(formattedText);
  };

  // Adiciona lista
  const addList = (ordered: boolean) => {
    let listItems = content.substring(selection.start, selection.end)
      .split('\n')
      .filter(item => item.trim() !== '');
    
    if (listItems.length === 0) {
      listItems = ['Novo item'];
    }
    
    const formattedList = listItems
      .map((item, index) => {
        return ordered ? `${index + 1}. ${item}` : `• ${item}`;
      })
      .join('\n');
    
    insertAtSelection(`\n${formattedList}\n`);
  };

  // Adiciona um emoji ao conteúdo
  const addEmoji = (emoji: any) => {
    insertAtSelection(emoji.native);
    setShowEmojiPicker(false);
  };

  // Adiciona um link
  const insertLink = () => {
    if (!linkText || !linkUrl) {
      toast({
        title: 'Informações incompletas',
        description: 'Preencha o texto e o URL do link.',
        variant: 'destructive',
      });
      return;
    }
    
    insertAtSelection(`[${linkText}](${linkUrl})`);
    setShowLinkDialog(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Adiciona uma imagem
  const insertImage = () => {
    if (!imageUrl) {
      toast({
        title: 'URL da imagem necessário',
        description: 'Informe o URL da imagem para inseri-la.',
        variant: 'destructive',
      });
      return;
    }
    
    const alt = imageAlt || 'Imagem';
    insertAtSelection(`![${alt}](${imageUrl})`);
    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Em uma aplicação real, este arquivo seria enviado para um servidor
    // e retornaria uma URL que poderia ser inserida no conteúdo.
    // Aqui apenas simulamos uma integração:
    
    if (file.type.startsWith('image/')) {
      // Simulação de URL de imagem após upload
      const mockImageUrl = 'https://api.automizap.com/uploads/images/' + file.name;
      
      toast({
        title: 'Imagem carregada',
        description: `A imagem ${file.name} foi carregada com sucesso!`,
        variant: 'default',
      });
      
      insertAtSelection(`![${file.name}](${mockImageUrl})`);
    } else {
      // Simulação de URL de arquivo após upload
      const mockFileUrl = 'https://api.automizap.com/uploads/files/' + file.name;
      
      toast({
        title: 'Arquivo carregado',
        description: `O arquivo ${file.name} foi carregado com sucesso!`,
        variant: 'default',
      });
      
      insertAtSelection(`[Baixar ${file.name}](${mockFileUrl})`);
    }
    
    // Limpa o input de arquivo
    e.target.value = '';
  };

  return (
    <div className={`flex flex-col border rounded-md overflow-hidden ${className}`}>
      {showToolbar && (
        <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => formatText('bold')}
                  disabled={readOnly}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Negrito</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => formatText('italic')}
                  disabled={readOnly}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Itálico</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLinkDialog(true)}
                  disabled={readOnly}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Link</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageDialog(true)}
                  disabled={readOnly}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Imagem</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {showEmojis && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={readOnly}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none">
                      {/* Emoji picker would be imported, but we'll use a placeholder for now */}
                      <div className="emoji-picker-container">
                        <Picker 
                          data={data} 
                          onEmojiSelect={addEmoji}
                          previewPosition="none"
                          theme="light"
                          skinTonePosition="none"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>Emojis</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => addList(false)}
                  disabled={readOnly}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lista com Marcadores</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => addList(true)}
                  disabled={readOnly}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lista Numerada</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => formatText('code')}
                  disabled={readOnly}
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Código</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  disabled={readOnly}
                >
                  <FileUp className="h-4 w-4" />
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enviar Arquivo</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={!readOnly}
        className={`p-3 focus:outline-none overflow-auto whitespace-pre-wrap`}
        style={{ minHeight }}
        onInput={(e) => setContent(e.currentTarget.textContent || '')}
        onBlur={(e) => setContent(e.currentTarget.textContent || '')}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        dangerouslySetInnerHTML={{ __html: content || placeholder }}
      />

      {showSendButton && (
        <div className="bg-gray-50 border-t p-2 flex justify-end">
          <Button 
            onClick={() => onSend?.(content)} 
            disabled={!content.trim() || readOnly}
            className="gap-2"
          >
            <SendHorizonal className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      )}

      {/* Dialog para inserir link */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="link-text">Texto do Link</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Texto que será exibido"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={insertLink}>
              <Check className="h-4 w-4 mr-2" />
              Inserir Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para inserir imagem */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="image-url">URL da Imagem</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Texto Alternativo</Label>
              <Input
                id="image-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descrição da imagem"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={insertImage}>
              <Check className="h-4 w-4 mr-2" />
              Inserir Imagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de pré-visualização de mensagem que exibe texto formatado
export function MessagePreview({ content }: { content: string }) {
  // Função para formatar o conteúdo
  const formatContent = (text: string) => {
    // Substituir negrito: *texto* -> <b>texto</b>
    let formatted = text.replace(/\*(.*?)\*/g, '<b>$1</b>');
    
    // Substituir itálico: _texto_ -> <i>texto</i>
    formatted = formatted.replace(/_(.*?)_/g, '<i>$1</i>');
    
    // Substituir código: ```texto``` -> <code>texto</code>
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Substituir links: [texto](url) -> <a href="url">texto</a>
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline">$1</a>');
    
    // Substituir imagens: ![alt](url) -> <img src="url" alt="alt" />
    formatted = formatted.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-md my-2" />');
    
    // Substituir listas numeradas: 1. item -> <ol><li>item</li></ol>
    formatted = formatted.replace(/(\d+\.\s.*?(?:\n|$))+/g, (match) => {
      const items = match.trim().split('\n').map(item => {
        const itemContent = item.replace(/^\d+\.\s/, '');
        return `<li>${itemContent}</li>`;
      }).join('');
      return `<ol class="list-decimal pl-5 my-2">${items}</ol>`;
    });
    
    // Substituir listas com marcadores: • item -> <ul><li>item</li></ul>
    formatted = formatted.replace(/(•\s.*?(?:\n|$))+/g, (match) => {
      const items = match.trim().split('\n').map(item => {
        const itemContent = item.replace(/^•\s/, '');
        return `<li>${itemContent}</li>`;
      }).join('');
      return `<ul class="list-disc pl-5 my-2">${items}</ul>`;
    });
    
    // Quebras de linha
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  };

  return (
    <div 
      className="prose max-w-none bg-white rounded-md p-4 shadow-sm border"
      dangerouslySetInnerHTML={{ __html: formatContent(content) || '<p class="text-gray-400">Nenhum conteúdo para pré-visualizar</p>' }}
    />
  );
}