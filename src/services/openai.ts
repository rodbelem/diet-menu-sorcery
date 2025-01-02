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
  
  const prompt = `Você é um nutricionista especializado em criar cardápios personalizados. Analise cuidadosamente o seguinte planejamento alimentar e crie um cardápio que siga ESTRITAMENTE as orientações fornecidas:

  ${pdfContent}

  REGRAS CRÍTICAS DE ANÁLISE:
  1. PRIMEIRO, identifique com precisão no planejamento alimentar:
     - Liste TODAS as refeições prescritas (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia)
     - Anote os horários EXATOS de cada refeição
     - Catalogue TODAS as quantidades específicas de cada alimento
     - Liste TODOS os tipos de alimentos permitidos e suas variações
     - Identifique TODAS as restrições alimentares mencionadas
     - Observe TODAS as substituições permitidas para cada alimento

  2. REGRAS ESTRITAS para geração do cardápio:
     - NUNCA repita a mesma refeição no mesmo dia
     - NUNCA inclua alimentos que não estão explicitamente permitidos no planejamento
     - SEMPRE mantenha as quantidades exatas especificadas
     - SEMPRE respeite os horários definidos para cada refeição
     - SEMPRE alterne as opções de alimentos permitidos para garantir variedade
     - NUNCA exceda as porções especificadas
     - SEMPRE respeite as restrições alimentares mencionadas

  3. VERIFICAÇÃO FINAL obrigatória:
     - Confirme que cada refeição está 100% alinhada com o planejamento
     - Verifique se não há repetições inadequadas
     - Confirme que todas as quantidades estão corretas
     - Certifique-se que não há alimentos não permitidos
     - Verifique se todas as restrições foram respeitadas

  Gere um cardápio ${period === "weekly" ? "semanal (7 dias)" : "quinzenal (15 dias)"} que:
  - Comece na segunda-feira e vá até ${period === "weekly" ? "domingo" : "o domingo da segunda semana"}
  - Inclua TODAS as refeições especificadas no planejamento para cada dia
  - Mantenha EXATAMENTE as mesmas quantidades e tipos de alimentos do planejamento
  - Garanta variedade nas refeições ao longo dos dias

  Após gerar o cardápio, crie uma lista de compras com todos os ingredientes necessários, incluindo uma estimativa de custo para cada item e o custo total.
  
  Retorne os dados no seguinte formato JSON:
  {
    "days": [
      {
        "day": "Segunda-feira",
        "meals": [
          {
            "meal": "Nome da refeição conforme está no planejamento",
            "description": "Descrição detalhada da refeição",
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
      model: "gpt-4o",
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
  
  REGRAS CRÍTICAS para gerar uma nova opção para a refeição "${mealType}":
  1. PRIMEIRO, identifique no planejamento:
     - As especificações exatas para a refeição "${mealType}"
     - Os horários e quantidades permitidos
     - Todos os alimentos permitidos e suas variações
     - Todas as restrições aplicáveis
  
  2. DEPOIS, gere uma nova opção que deve OBRIGATORIAMENTE:
     - Usar SOMENTE alimentos explicitamente permitidos no planejamento
     - Manter EXATAMENTE as mesmas quantidades especificadas
     - Ser DIFERENTE das outras refeições do dia
     - Respeitar TODAS as restrições alimentares
  
  3. FINALMENTE, antes de retornar:
     - Verifique se a refeição está 100% de acordo com o planejamento
     - Confirme se as quantidades estão corretas
     - Certifique-se que não incluiu nenhum alimento não permitido
  
  Retorne os dados no seguinte formato JSON:
  {
    "meal": "${mealType}",
    "description": "Descrição detalhada da refeição",
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
      model: "gpt-4o",
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