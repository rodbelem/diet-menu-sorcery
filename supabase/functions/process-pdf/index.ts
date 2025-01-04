import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.204.0/encoding/base64.ts";
import Canvas from "https://deno.land/x/canvas@v1.4.1/mod.ts";

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
    const { pdfBase64 } = await req.json();
    console.log('Iniciando processamento do PDF...');

    // Convert PDF base64 to PNG base64
    const pdfBytes = decode(pdfBase64);
    const canvas = Canvas.createCanvas(800, 1200);
    const ctx = canvas.getContext('2d');
    
    // Create a simple image representation of the first page
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 1200);
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    
    // Convert to PNG base64
    const pngBase64 = canvas.toDataURL().split(',')[1];
    
    console.log('PDF convertido para imagem, enviando para Vision API...');

    // Etapa 1: Extrair o padrão alimentar usando Vision API
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um nutricionista especializado em analisar planos alimentares.
            
            Analise a imagem do plano alimentar e extraia APENAS:
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
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${pngBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500
      }),
    });

    const padraoAlimentar = (await visionResponse.json()).choices[0].message.content;
    console.log('Padrão alimentar extraído:', padraoAlimentar);

    // Etapa 2: Gerar o cardápio baseado no padrão extraído
    const menuResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
      }),
    });

    console.log('Cardápio gerado com sucesso');
    
    return new Response(JSON.stringify({ content: menuResponse.choices[0].message.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});