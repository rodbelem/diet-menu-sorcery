import OpenAI from 'openai';
import { Menu } from '@/types/menu';
import { supabase } from '@/integrations/supabase/client';

const getOpenAIClient = async () => {
  const { data, error } = await supabase.functions.invoke('get-secret', {
    body: { name: 'OPENAI_API_KEY' }
  });
  
  if (error || !data?.secret) {
    throw new Error('Failed to get OpenAI API key');
  }
  
  return new OpenAI({
    apiKey: data.secret,
    dangerouslyAllowBrowser: true
  });
};

export const generateMenu = async (pdfContent: string, period: "weekly" | "biweekly") => {
  const openai = await getOpenAIClient();
  
  const prompt = `Com base no seguinte plano nutricional:
  
  ${pdfContent}
  
  Gere um cardápio ${period === "weekly" ? "semanal (7 dias completos)" : "quinzenal (15 dias completos)"} detalhado com as seguintes informações:
  - Refeições para cada dia informando o peso de cada ingrediente
  - O cardápio DEVE começar em uma segunda-feira e incluir TODOS os dias até ${period === "weekly" ? "domingo" : "o domingo da segunda semana"}
  - Para cada dia, inclua TODAS as refeições (café da manhã, almoço, lanche da tarde, jantar, ceia)

  Abaixo disso, preciso que você me gere uma lista completa de compras dos ingredientes necessários para todas as refeições serem feitas. Adicione uma estimativa de custo para cada conjunto de ingrediente (em reais) e uma estimativa de custo total.
  
  Retorne os dados no seguinte formato JSON:
  {
    "days": [
      {
        "day": "Segunda-feira",
        "meals": [
          {
            "meal": "Café da manhã",
            "description": "Descrição da refeição",
            "ingredients": [
              {
                "name": "Nome do ingrediente",
                "quantity": "Quantidade necessária",
                "estimatedCost": 0.00
              }
            ]
          }
        ]
      }
    ],
    "totalCost": 0.00
  }`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("Não foi possível gerar o cardápio");
    
    return JSON.parse(response) as Menu;
  } catch (error) {
    console.error("Erro ao gerar cardápio:", error);
    throw error;
  }
};