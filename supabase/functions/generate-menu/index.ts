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
    const { analyzedPattern, period, singleMeal, mealType } = await req.json();
    
    if (!analyzedPattern) {
      throw new Error('Analyzed pattern is required');
    }

    console.log('Generating menu with OpenAI...');
    console.log('Analyzed Pattern:', JSON.stringify(analyzedPattern, null, 2));
    console.log('Single Meal:', singleMeal);
    console.log('Meal Type:', mealType);

    let systemPrompt = `Você é um nutricionista brasileiro especializado em criar cardápios personalizados.
    
    ATENÇÃO - REGRAS CRÍTICAS:
    1. NÃO FAÇA SUPOSIÇÕES SOBRE RESTRIÇÕES ALIMENTARES!
       - NÃO assuma que o cardápio deve ser vegano ou vegetariano
       - NÃO exclua alimentos que não foram explicitamente proibidos
       - INCLUA proteínas animais se permitidas no plano
    
    2. USE OS ALIMENTOS EXATAMENTE COMO ESPECIFICADOS!
       - Se o plano menciona "arroz", use arroz comum, NÃO use arroz integral
       - Se o plano menciona "pão", use pão comum, NÃO use pão integral
       - NÃO substitua alimentos por versões integrais ou diet sem especificação
       - Use APENAS os alimentos EXPLICITAMENTE listados no plano`;

    let userPrompt;
    
    if (singleMeal) {
      userPrompt = `Com base nesta análise de padrão alimentar:
      ${JSON.stringify(analyzedPattern, null, 2)}
      
      IMPORTANTE:
      1. NÃO assuma restrições que não foram especificadas
      2. Use TODOS os grupos alimentares permitidos
      3. Inclua proteínas animais se permitidas no plano
      4. Use os alimentos EXATAMENTE como listados (não substitua por versões integrais)
      
      Gere UMA NOVA opção para a refeição "${mealType}".
      
      Retorne no seguinte formato JSON:
      {
        "meal": "Nome da refeição",
        "description": "Descrição detalhada",
        "ingredients": [
          {
            "name": "Nome do ingrediente",
            "quantity": "Quantidade com unidade",
            "estimatedCost": 0.00
          }
        ]
      }`;
    } else {
      const numDias = period === 'weekly' ? 7 : 14;
      userPrompt = `Com base nesta análise de padrão alimentar:
      ${JSON.stringify(analyzedPattern, null, 2)}
      
      IMPORTANTE:
      1. NÃO assuma restrições que não foram especificadas
      2. Use TODOS os grupos alimentares permitidos
      3. Inclua proteínas animais se permitidas no plano
      4. Use os alimentos EXATAMENTE como listados (não substitua por versões integrais)
      
      Crie um cardápio para ${numDias} dias, incluindo todas as refeições especificadas.
      
      Retorne no seguinte formato JSON:
      {
        "days": [
          {
            "day": "Nome do dia",
            "meals": [
              {
                "meal": "Nome da refeição",
                "description": "Descrição detalhada",
                "ingredients": [
                  {
                    "name": "Nome do ingrediente",
                    "quantity": "Quantidade com unidade",
                    "estimatedCost": 0.00
                  }
                ]
              }
            ]
          }
        ],
        "totalCost": 0.00
      }`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
    let result = JSON.parse(data.choices[0].message.content);

    if (!singleMeal) {
      // Validação e correção do número de dias
      const numDias = period === 'weekly' ? 7 : 14;
      if (result.days.length !== numDias) {
        console.error(`Número incorreto de dias gerado: ${result.days.length}, esperado: ${numDias}`);
        throw new Error('Número incorreto de dias gerado');
      }

      // Garantir que os dias da semana estejam corretos
      result.days = result.days.map((day: any, index: number) => {
        const dayIndex = index % 7;
        return {
          ...day,
          day: diasSemana[dayIndex]
        };
      });
    }

    console.log('Menu gerado com sucesso');
    if (singleMeal) {
      console.log('Refeição gerada:', JSON.stringify(result, null, 2));
    } else {
      console.log('Primeiro dia de exemplo:', JSON.stringify(result.days[0], null, 2));
    }

    return new Response(JSON.stringify({ menu: JSON.stringify(result) }), {
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