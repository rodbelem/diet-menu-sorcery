import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const diasSemana = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyzedPattern, period } = await req.json();
    
    if (!analyzedPattern) {
      throw new Error('Analyzed pattern is required');
    }

    console.log('Generating menu with OpenAI...');
    console.log('Analyzed Pattern:', JSON.stringify(analyzedPattern, null, 2));
    
    const numDias = period === 'weekly' ? 7 : 14;
    
    const systemPrompt = `Você é um nutricionista brasileiro especializado em criar cardápios personalizados.
    
    ATENÇÃO: NÃO FAÇA SUPOSIÇÕES SOBRE RESTRIÇÕES ALIMENTARES!
    - NÃO assuma que o cardápio deve ser vegano ou vegetariano
    - NÃO exclua alimentos que não foram explicitamente proibidos
    - INCLUA proteínas animais (carnes, ovos, laticínios) SE e SOMENTE SE estiverem permitidas no plano
    
    Regras importantes:
    1. Use APENAS português do Brasil
    2. Gere EXATAMENTE ${numDias} dias de cardápio
    3. Siga ESTRITAMENTE o padrão alimentar fornecido
    4. Use APENAS alimentos EXPLICITAMENTE permitidos no plano
    5. Mantenha consistência nas unidades de medida (g, ml, etc)
    6. Forneça descrições detalhadas das preparações
    7. Inclua TODAS as refeições especificadas no padrão
    8. Estime os custos com base em preços médios do Brasil
    9. Mantenha variedade entre os dias
    10. Se houver dúvida sobre um alimento, PERGUNTE antes de excluí-lo`;

    const userPrompt = `Com base nesta análise de padrão alimentar:
    ${JSON.stringify(analyzedPattern, null, 2)}
    
    IMPORTANTE:
    1. NÃO assuma restrições que não foram especificadas
    2. Use TODOS os grupos alimentares permitidos
    3. Inclua proteínas animais se permitidas no plano
    4. Mantenha o equilíbrio nutricional especificado
    
    Crie um cardápio para ${numDias} dias, incluindo todas as refeições especificadas.
    
    Para cada refeição, forneça:
    1. Nome da refeição em português
    2. Descrição detalhada da preparação
    3. Lista completa de ingredientes com quantidades precisas
    4. Estimativa de custo realista para o Brasil
    
    Retorne no seguinte formato JSON:
    {
      "days": [
        {
          "day": "Nome do dia em português",
          "meals": [
            {
              "meal": "Nome da refeição em português",
              "description": "Descrição detalhada em português",
              "ingredients": [
                {
                  "name": "Nome do ingrediente em português",
                  "quantity": "Quantidade com unidade de medida",
                  "estimatedCost": 0.00
                }
              ]
            }
          ]
        }
      ],
      "totalCost": 0.00
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from OpenAI API:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    let menu = JSON.parse(data.choices[0].message.content);

    // Validação e correção do número de dias
    if (menu.days.length !== numDias) {
      console.error(`Número incorreto de dias gerado: ${menu.days.length}, esperado: ${numDias}`);
      throw new Error('Número incorreto de dias gerado');
    }

    // Garantir que os dias da semana estejam corretos
    menu.days = menu.days.map((day: any, index: number) => {
      const dayIndex = index % 7;
      return {
        ...day,
        day: diasSemana[dayIndex]
      };
    });

    console.log('Menu gerado com sucesso');
    console.log('Primeiro dia de exemplo:', JSON.stringify(menu.days[0], null, 2));

    return new Response(JSON.stringify({ menu: JSON.stringify(menu) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-menu function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});