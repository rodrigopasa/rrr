import OpenAI from "openai";
import { log } from "../vite";

// Inicializa o cliente OpenAI com a chave da API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera texto utilizando OpenAI GPT-4o com base no prompt fornecido
 * @param prompt - Descrição do tipo de mensagem a ser gerada
 * @returns Texto gerado
 */
export async function generateMessageWithAI(prompt: string): Promise<string> {
  try {
    log(`Gerando mensagem com OpenAI: "${prompt.substring(0, 50)}..."`, "openai");
    
    const systemPrompt = `
      Você é um especialista em marketing digital especializado em campanhas de lançamento de produtos.
      Gere uma mensagem profissional para WhatsApp baseada na descrição fornecida.
      A mensagem deve:
      1. Ser vibrante e engajadora
      2. Estar em português brasileiro
      3. Ter entre 100-200 caracteres
      4. Usar emojis relevantes no início das seções
      5. Incluir placeholders no formato {placeholder} para personalização
      6. Comum incluir placeholders como {nome}, {produto}, {link}, {empresa}
      7. Ter um visual bem formatado com quebras de linha adequadas
    `;
    
    // o modelo mais recente da OpenAI é "gpt-4o" que foi lançado em 13 de maio de 2024. não mude isso a menos que explicitamente solicitado pelo usuário
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const generatedText = response.choices[0].message.content || "";
    
    log("Mensagem gerada com sucesso", "openai");
    return generatedText;
  } catch (error) {
    log(`Erro ao gerar mensagem com OpenAI: ${error}`, "openai");
    throw new Error(`Falha ao gerar texto com IA: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analisa o sentimento e a eficácia de uma mensagem de marketing
 * @param message - A mensagem a ser analisada
 * @returns Análise de sentimento e sugestões
 */
export async function analyzeMessageSentiment(message: string): Promise<{
  sentiment: string;
  toneAnalysis: string;
  suggestions: string[];
  score: number;
}> {
  try {
    log(`Analisando sentimento da mensagem: "${message.substring(0, 50)}..."`, "openai");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `
            Você é um especialista em análise de mensagens de marketing.
            Analise a mensagem fornecida e retorne uma resposta JSON com os seguintes campos:
            - sentiment: o sentimento geral da mensagem (positivo, negativo, neutro)
            - toneAnalysis: uma análise curta do tom da mensagem
            - suggestions: array com 2-3 sugestões para melhorar a mensagem
            - score: uma pontuação de 1 a 10 sobre a eficácia da mensagem para marketing
          `
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: result.sentiment || "neutro",
      toneAnalysis: result.toneAnalysis || "Não foi possível analisar o tom da mensagem",
      suggestions: result.suggestions || ["Não foi possível gerar sugestões"],
      score: result.score || 5
    };
  } catch (error) {
    log(`Erro ao analisar sentimento com OpenAI: ${error}`, "openai");
    throw new Error(`Falha ao analisar mensagem: ${error instanceof Error ? error.message : String(error)}`);
  }
}