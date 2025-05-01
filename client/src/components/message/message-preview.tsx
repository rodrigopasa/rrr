import React from 'react';

interface MessagePreviewProps {
  content: string;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({ content }) => {
  // Função para formatar o texto da mensagem com quebras de linha e estilização básica
  const formatMessageText = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">Escreva uma mensagem para visualizar a pré-visualização</p>;
    
    // Dividir por quebras de linha e aplicar formatação
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line || ' '} {/* Se a linha estiver vazia, adiciona um espaço para manter a quebra */}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#e5ddd5] flex-1 p-4 rounded-lg">
        <div className="max-w-[80%] bg-white rounded-lg p-3 shadow-sm relative ml-auto">
          <div className="text-sm text-gray-800">
            {formatMessageText(content)}
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-500 flex items-center justify-end">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15" fill="none" className="ml-1">
                <path fill="#53bdeb" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
              </svg>
            </span>
          </div>
          <div className="absolute right-0 bottom-0 transform translate-y-1/2 translate-x-0 text-white">
            <svg width="8" height="13" viewBox="0 0 8 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4.887C5 2.196 2.761 0 0 0v13c2.761 0 5-2.196 5-4.887v-3.226z" fill="white" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 text-center">
        Esta é uma pré-visualização de como sua mensagem aparecerá no WhatsApp
      </div>
    </div>
  );
};

export default MessagePreview;