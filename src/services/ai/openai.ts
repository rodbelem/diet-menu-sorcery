import OpenAI from 'openai';
import { getAIConfig, AI_CONFIG } from "./config";

export const generateWithOpenAI = async (prompt: string) => {
  const config = await getAIConfig();
  
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

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};