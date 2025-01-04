import OpenAI from 'openai';
import { Menu, MenuItem } from '@/types/menu';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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

export const generateShoppingList = async (menu: Menu) => {
  const openai = await getOpenAIClient();
  
  const prompt = `Você é um nutricionista especializado em criar listas de compras precisas a partir de cardápios.

Analise cuidadosamente o cardápio abaixo e crie uma lista de compras completa que inclua:
1) Todos os ingredientes necessários
2) As quantidades totais de cada item
3) Medidas práticas para compras em supermercado

CARDÁPIO:
${JSON.stringify(menu, null, 2)}

Retorne a lista no seguinte formato JSON:
{
  "categories": [
    {
      "name": "Nome da categoria (ex: Frutas, Verduras, Proteínas)",
      "items": [
        {
          "name": "Nome do item",
          "quantity": "Quantidade total necessária",
          "unit": "Unidade de medida para compra",
          "estimatedCost": 0.00
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
    if (!response) throw new Error("Não foi possível gerar a lista de compras");
    
    const shoppingListData = JSON.parse(response);

    // Get the menu ID from the database
    const { data: menuData, error: menuError } = await supabase
      .from('menus')
      .select('id')
      .eq('content', menu)
      .single();

    if (menuError) {
      console.error('Error finding menu:', menuError);
      throw menuError;
    }

    // Store the shopping list
    const { data: shoppingListRecord, error: shoppingListError } = await supabase
      .from('shopping_lists')
      .insert([{
        menu_id: menuData.id,
        content: shoppingListData as unknown as Json,
        total_cost: menu.totalCost
      }])
      .select()
      .single();

    if (shoppingListError) {
      console.error('Error storing shopping list:', shoppingListError);
      throw shoppingListError;
    }

    return shoppingListData;
  } catch (error) {
    console.error("Erro ao gerar lista de compras:", error);
    throw error;
  }
};

export const regenerateMeal = async (pdfContent: string, mealType: string) => {
  const openai = await getOpenAIClient();
  
  const prompt = `Analise cuidadosamente o seguinte planejamento alimentar e gere uma nova opção para a refeição "${mealType}" que:
1) Use APENAS alimentos explicitamente permitidos no planejamento
2) Mantenha EXATAMENTE as mesmas quantidades especificadas
3) Seja DIFERENTE das outras refeições do dia
4) Respeite TODAS as restrições alimentares

PLANEJAMENTO:
${pdfContent}

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