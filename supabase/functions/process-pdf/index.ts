import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    console.log('Iniciando extração do padrão alimentar do PDF...');

    // Primeiro, extrair o padrão alimentar do PDF
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especializado em analisar planos alimentares.
          
          Analise o conteúdo do PDF e extraia APENAS:
          1. Horários específicos de cada refeição
          2. Padrão de cada refeição (café da manhã, desjejum, pré-treino, almoço, lanche, jantar, ceia)
          3. Quantidades exatas de cada alimento permitido em cada refeição
          4. Restrições alimentares
          5. Substituições permitidas
          
          Seja extremamente preciso com as medidas e quantidades.
          Use tópicos para organizar as informações.
          Mantenha APENAS informações relevantes para a criação do cardápio.`
        },
        {
          role: "user",
          content: `Extraia o padrão alimentar deste conteúdo: ${pdfBase64.substring(0, 100000)}`
        }
      ],
      max_tokens: 1000
    });

    const padraoAlimentar = extractionResponse.choices[0].message.content;
    console.log('Padrão alimentar extraído, gerando cardápio...');

    // Agora, gerar o cardápio baseado no padrão extraído
    const menuResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especializado em criar cardápios personalizados.
          
          Use o padrão alimentar fornecido para criar um cardápio que siga ESTRITAMENTE:
          1. Os horários especificados para cada refeição
          2. As quantidades exatas de cada alimento
          3. As restrições alimentares mencionadas
          4. As substituições permitidas
          
          REGRAS IMPORTANTES:
          - NUNCA repita a mesma refeição no mesmo dia
          - NUNCA inclua alimentos não permitidos no plano
          - SEMPRE mantenha as quantidades exatas especificadas
          - SEMPRE alterne as opções permitidas para garantir variedade
          - SEMPRE respeite as restrições alimentares
          
          Retorne o cardápio em formato JSON seguindo exatamente esta estrutura:
          {
            "days": [
              {
                "day": "Segunda-feira",
                "meals": [
                  {
                    "meal": "Nome da refeição (ex: Café da Manhã)",
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
          }`
        },
        {
          role: "user",
          content: `Crie um cardápio baseado neste padrão alimentar: ${padraoAlimentar}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    console.log('Cardápio gerado com sucesso');
    
    return new Response(
      JSON.stringify({ content: menuResponse.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});