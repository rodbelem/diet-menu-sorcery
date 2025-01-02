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
  
  const prompt = `Analise cuidadosamente o seguinte planejamento alimentar:
  
  ${pdfContent}
  
  INSTRUÇÕES CRÍTICAS:
  1. PRIMEIRO, identifique no planejamento alimentar:
     - Exatamente quais refeições estão prescritas (desjejum, colação, almoço, lanche, jantar, ceia, etc)
     - Os horários específicos de cada refeição
     - As quantidades exatas de cada alimento em cada refeição
     - Os tipos específicos de alimentos permitidos e suas variações
     - Todas as restrições alimentares mencionadas
  
  2. DEPOIS, gere um cardápio que deve OBRIGATORIAMENTE:
     - Incluir TODAS as refeições que aparecem no planejamento, nos mesmos horários
     - Usar SOMENTE os alimentos e quantidades que estão EXPLICITAMENTE permitidos no planejamento
     - NUNCA sugerir alimentos que não estão listados no planejamento (exemplo: se o planejamento especifica "arroz branco", NUNCA sugira "arroz integral")
     - Respeitar TODAS as restrições alimentares mencionadas
     - Manter as mesmas quantidades e medidas especificadas no planejamento
  
  3. FINALMENTE, antes de retornar o cardápio:
     - Verifique se cada refeição sugerida está EXATAMENTE de acordo com o planejamento
     - Confirme se as quantidades e medidas estão corretas
     - Certifique-se que nenhum alimento não permitido foi incluído
  
  Gere um cardápio ${period === "weekly" ? "semanal (7 dias completos)" : "quinzenal (15 dias completos)"} que:
  - Comece na segunda-feira e vá até ${period === "weekly" ? "domingo" : "o domingo da segunda semana"}
  - Inclua TODAS as refeições especificadas no planejamento alimentar para cada dia
  - Mantenha EXATAMENTE as mesmas quantidades e tipos de alimentos do planejamento

  Após gerar o cardápio, crie uma lista de compras com todos os ingredientes necessários, incluindo uma estimativa de custo para cada item e o custo total.
  
  Retorne os dados no seguinte formato JSON:
  {
    "days": [
      {
        "day": "Segunda-feira",
        "meals": [
          {
            "meal": "Nome da refeição conforme está no planejamento",
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
  
  const prompt = `Analise cuidadosamente o seguinte planejamento alimentar:
  
  ${pdfContent}
  
  INSTRUÇÕES CRÍTICAS:
  1. PRIMEIRO, identifique no planejamento alimentar:
     - A refeição específica "${mealType}" e seu horário
     - As quantidades exatas de cada alimento permitido nesta refeição
     - Os tipos específicos de alimentos permitidos e suas variações
     - Todas as restrições alimentares mencionadas
  
  2. DEPOIS, gere uma nova opção para esta refeição que deve OBRIGATORIAMENTE:
     - Usar SOMENTE os alimentos e quantidades que estão EXPLICITAMENTE permitidos no planejamento para esta refeição
     - NUNCA sugerir alimentos que não estão listados no planejamento
     - Respeitar TODAS as restrições alimentares mencionadas
     - Manter as mesmas quantidades e medidas especificadas no planejamento
  
  3. FINALMENTE, antes de retornar a sugestão:
     - Verifique se a refeição sugerida está EXATAMENTE de acordo com o planejamento
     - Confirme se as quantidades e medidas estão corretas
     - Certifique-se que nenhum alimento não permitido foi incluído
  
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