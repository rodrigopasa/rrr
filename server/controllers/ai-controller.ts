import { Request, Response } from 'express';
import { generateMessageWithAI, analyzeMessageSentiment } from '../services/openai-service';
import { z } from 'zod';
import { log } from '../vite';

/**
 * Manipula a requisição para gerar mensagem com IA
 */
export async function handleGenerateAIMessage(req: Request, res: Response) {
  try {
    // Validar o corpo da requisição
    const schema = z.object({
      prompt: z.string().min(5, "O prompt deve ter pelo menos 5 caracteres")
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: "Requisição inválida", 
        errors: parsed.error.format() 
      });
    }
    
    const { prompt } = parsed.data;
    
    // Registrar quem está usando a funcionalidade para controle
    log(`Usuário ${req.user?.id} solicitou geração de IA com prompt: "${prompt.substring(0, 50)}..."`, "openai");
    
    // Gerar o texto com IA
    const generatedText = await generateMessageWithAI(prompt);
    
    return res.status(200).json({ 
      message: "Mensagem gerada com sucesso",
      text: generatedText 
    });
  } catch (error) {
    log(`Erro ao gerar mensagem com IA: ${error}`, "openai");
    return res.status(500).json({
      message: "Erro ao gerar mensagem com IA",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

/**
 * Manipula a requisição para analisar sentimento da mensagem
 */
export async function handleAnalyzeMessageSentiment(req: Request, res: Response) {
  try {
    // Validar o corpo da requisição
    const schema = z.object({
      message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres")
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        message: "Requisição inválida", 
        errors: parsed.error.format() 
      });
    }
    
    const { message } = parsed.data;
    
    // Analisar o sentimento da mensagem
    const analysis = await analyzeMessageSentiment(message);
    
    return res.status(200).json({ 
      message: "Análise realizada com sucesso",
      analysis 
    });
  } catch (error) {
    log(`Erro ao analisar sentimento: ${error}`, "openai");
    return res.status(500).json({
      message: "Erro ao analisar mensagem",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}