import { getAIConfig } from "./config";

export const generateWithAnthropic = async (prompt: string) => {
  const config = await getAIConfig();
  
  try {
    console.log('Usando Claude para processar texto longo...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropicApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: "You are a nutrition expert specialized in analyzing meal plans and extracting patterns. Return all responses in JSON format."
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Erro ao gerar com Claude:', error);
    throw error;
  }
};