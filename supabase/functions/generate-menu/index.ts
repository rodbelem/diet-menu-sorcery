import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um nutricionista especializado em montar cardápios personalizados com base em padrões alimentares analisados.'
          },
          {
            role: 'user',
            content: `Com base nesta análise de padrão alimentar, crie um cardápio ${period === 'weekly' ? 'semanal' : 'quinzenal'} detalhado:
            ${JSON.stringify(analyzedPattern, null, 2)}
            
            Retorne o cardápio em formato JSON seguindo exatamente esta estrutura:
            {
              "days": [
                {
                  "day": "Segunda-feira",
                  "meals": [
                    {
                      "meal": "Nome da refeição",
                      "description": "Descrição detalhada",
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
            }`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from OpenAI API:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const menu = data.choices[0].message.content;

    return new Response(JSON.stringify({ menu }), {
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