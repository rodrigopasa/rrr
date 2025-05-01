import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
  content: string;
  recipientName?: string;
  className?: string;
}

export default function MessagePreview({
  content,
  recipientName = "Destinatário",
  className
}: MessagePreviewProps) {
  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-t-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2.5 w-2.5 rounded-full bg-orange-500"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pré-visualização da mensagem
          </span>
        </div>
      </div>
      
      <Card className="rounded-t-none shadow-md border-t-0">
        <div className="bg-[#128C7E] p-2 flex items-center gap-2 rounded-t-lg">
          <i className="ri-whatsapp-line text-white text-lg"></i>
          <span className="text-white text-sm font-medium">WhatsApp</span>
        </div>
        
        <CardContent className="p-0">
          <div className="p-3 border-b">
            <div className="text-sm font-medium">{recipientName}</div>
            <div className="text-xs text-gray-500">Online</div>
          </div>
          
          <div className="p-4 bg-[#E5DDD5] h-48 overflow-y-auto">
            <div className="flex items-start gap-2 justify-end mb-4">
              <div className="bg-[#D9FDD3] p-2 rounded-lg max-w-[80%] shadow-sm">
                <div className="text-sm whitespace-pre-wrap break-words">{content || "Digite uma mensagem para visualizar aqui..."}</div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">12:30</span>
                  <i className="ri-check-double-line text-xs text-blue-500 ml-1"></i>
                </div>
              </div>
            </div>
            
            {content && (
              <div className="flex justify-center mt-6 mb-2">
                <div className="bg-white/70 backdrop-blur-sm py-1 px-3 rounded-full text-xs text-gray-500">
                  Sua mensagem será exibida assim para o destinatário
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 flex items-center gap-2 bg-[#F0F2F5]">
            <div className="bg-white p-2 rounded-full">
              <i className="ri-emotion-line text-gray-500"></i>
            </div>
            <div className="bg-white flex-1 rounded-full h-9 px-4 flex items-center text-gray-400 text-sm">
              Digite uma mensagem
            </div>
            <div className="bg-[#128C7E] p-2 rounded-full">
              <i className="ri-mic-line text-white"></i>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}