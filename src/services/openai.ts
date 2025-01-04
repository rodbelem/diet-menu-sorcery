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
  
  const periodConfig = {
    weekly: {
      days: "7",
      type: "semanal",
      period: "semana"
    },
    biweekly: {
      days: "15",
      type: "quinzenal",
      period: "quinzena"
    }
  };

  const config = periodConfig[period];
  
  const prompt = `Você é um nutricionista especializado em montar sugestões de cardápios para pacientes com base no padrão utilizado em seus respectivos planejamentos alimentares. 

O que você precisa fazer é simples -> Analise o padrão alimentar abaixo de refeições, prestando atenção aos alimentos e suas quantidades e crie uma sugestão de cardápio ${config.type}, contendo os ${config.days} dias da ${config.period} com cada uma de suas refeições, baseado no padrão abaixo.

"""
${pdfContent}
"""

Regras: 

1) Você deve trazer o cardápio completo com todos os ${config.days} dias e as refeições de cada dia. 
2) Você deve analisar principalmente frutas/leguminosas/verduras/legumes/proteínas e pensar em substitutos similares 
3) Traga o cardápio já montado, não precisa trazer opções variadas para um mesmo dia, é o cardápio montado que eu quero.

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