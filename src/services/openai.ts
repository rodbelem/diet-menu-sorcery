import OpenAI from 'openai';
import { Menu, MenuItem } from '@/types/menu';
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
  
  IMPORTANTE: Você DEVE gerar um cardápio que siga ESTRITAMENTE o plano nutricional fornecido, respeitando:
  - Todas as quantidades e porções especificadas
  - Todos os tipos de alimentos permitidos e restrições
  - Todas as recomendações e regras nutricionais
  - Os horários e frequência das refeições
  
  Gere um cardápio ${period === "weekly" ? "semanal (7 dias completos)" : "quinzenal (15 dias completos)"} detalhado com as seguintes informações:
  - Refeições para cada dia informando o peso de cada ingrediente
  - O cardápio DEVE começar em uma segunda-feira e incluir TODOS os dias até ${period === "weekly" ? "domingo" : "o domingo da segunda semana"}
  - Para cada dia, inclua TODAS as refeições (café da manhã, almoço, lanche da tarde, jantar, ceia)
  - Cada refeição DEVE seguir EXATAMENTE as quantidades e tipos de alimentos especificados no plano nutricional

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

export const regenerateMeal = async (pdfContent: string, mealType: string) => {
  const openai = await getOpenAIClient();
  
  const prompt = `Com base no seguinte plano nutricional:
  
  ${pdfContent}
  
  IMPORTANTE: Você DEVE gerar uma refeição que siga ESTRITAMENTE o plano nutricional fornecido, respeitando:
  - Todas as quantidades e porções especificadas
  - Todos os tipos de alimentos permitidos e restrições
  - Todas as recomendações e regras nutricionais
  
  Gere uma nova opção para a refeição "${mealType}" que seja diferente da anterior mas ainda siga EXATAMENTE o plano nutricional.
  
  Retorne os dados no seguinte formato JSON:
  {
    "meal": "${mealType}",
    "description": "Descrição da refeição",
    "ingredients": [
      {
        "name": "Nome do ingrediente",
        "quantity": "Quantidade necessária",
        "estimatedCost": 0.00
      }
    ]
  }`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("Não foi possível gerar nova opção de refeição");
    
    return JSON.parse(response) as MenuItem;
  } catch (error) {
    console.error("Erro ao gerar nova opção de refeição:", error);
    throw error;
  }
};