import OpenAI from 'openai';
import { getAIConfig, AI_CONFIG } from "./config";

export const generateWithOpenAI = async (prompt: string) => {
  const config = await getAIConfig();
  
  if (!config.openaiApiKey) {
    console.error('OpenAI API key não encontrada');
    throw new Error('Erro ao acessar a API da OpenAI. Por favor, tente novamente.');
  }

  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    console.log('Usando OpenAI para processar texto...');
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: AI_CONFIG.DEFAULT_MODEL,
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0].message.content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('Erro detalhado da API OpenAI:', error);
    
    if (error.status === 401) {
      throw new Error('Erro de autenticação com a OpenAI. Verifique a chave da API.');
    }
    
    throw new Error('Erro ao processar com OpenAI: ' + (error.message || 'Erro desconhecido'));
  }
};