import { Menu, MenuItem } from '@/types/menu';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { generateAIResponse } from './ai';

export const generateMenu = async (pdfContent: string, period: "weekly" | "biweekly") => {
  if (!pdfContent) {
    throw new Error('PDF content is required');
  }

  // First, store the pattern from PDF
  const { data: patternData, error: patternError } = await supabase
    .from('meal_patterns')
    .insert([{ content: pdfContent }])
    .select()
    .single();

  if (patternError) {
    console.error('Error storing meal pattern:', patternError);
    throw patternError;
  }

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

Analise o padrão alimentar abaixo e crie uma sugestão de cardápio ${config.type} com ${config.days} dias, respeitando rigorosamente:
1) Os horários de cada refeição
2) As quantidades especificadas
3) Os alimentos permitidos e suas variações
4) Todas as restrições alimentares mencionadas

Padrão alimentar:
"""
${pdfContent}
"""

Retorne os dados em formato JSON seguindo exatamente esta estrutura:
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
    console.log('Gerando cardápio com OpenAI...');
    const response = await generateAIResponse(prompt);
    if (!response) throw new Error("Não foi possível gerar o cardápio");
    
    const menuData = JSON.parse(response) as Menu;

    // Store the generated menu
    const { data: menuRecord, error: menuError } = await supabase
      .from('menus')
      .insert([{
        pattern_id: patternData.id,
        content: menuData as unknown as Json,
        period: period,
        total_cost: menuData.totalCost
      }])
      .select()
      .single();

    if (menuError) {
      console.error('Error storing menu:', menuError);
      throw menuError;
    }
    
    return menuData;
  } catch (error) {
    console.error("Erro ao gerar cardápio:", error);
    throw error;
  }
};

export const regenerateMeal = async (pdfContent: string, mealType: string) => {
  const prompt = `Analise cuidadosamente o seguinte planejamento alimentar e gere uma nova opção para a refeição "${mealType}" que:
1) Use APENAS alimentos explicitamente permitidos no planejamento
2) Mantenha EXATAMENTE as mesmas quantidades especificadas
3) Seja DIFERENTE das outras refeições do dia
4) Respeite TODAS as restrições alimentares

PLANEJAMENTO:
${pdfContent}

Retorne os dados em formato JSON seguindo exatamente esta estrutura:
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
    const response = await generateAIResponse(prompt);
    if (!response) throw new Error("Não foi possível gerar nova opção de refeição");
    
    return JSON.parse(response) as MenuItem;
  } catch (error) {
    console.error("Erro ao gerar nova opção de refeição:", error);
    throw error;
  }
};