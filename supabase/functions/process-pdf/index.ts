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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const { pdfBase64 } = await req.json();

    // Primeiro, vamos processar o PDF em partes menores para evitar o limite de tokens
    const chunkSize = 30000; // Tamanho reduzido para garantir que não ultrapasse o limite
    const chunks = [];
    
    for (let i = 0; i < pdfBase64.length; i += chunkSize) {
      const chunk = pdfBase64.slice(i, i + chunkSize);
      const chunkResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um nutricionista especializado em extrair informações de planos alimentares. Extraia apenas as informações essenciais sobre refeições, porções e restrições desta parte do documento."
          },
          {
            role: "user",
            content: `Analise esta parte do plano alimentar e extraia as informações relevantes: ${chunk}`
          }
        ],
      });
      chunks.push(chunkResponse.choices[0].message.content);
    }

    // Agora, vamos combinar e processar todas as informações extraídas
    const combinedContent = chunks.join(' ');
    
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especializado em criar cardápios. Com base nas informações extraídas do plano alimentar, crie um cardápio completo para 7 dias (segunda a domingo), seguindo EXATAMENTE as especificações do plano.

          REGRAS IMPORTANTES:
          1. O cardápio DEVE conter TODAS as refeições para os 7 dias da semana
          2. Cada dia DEVE ter todas as refeições especificadas no plano (café da manhã, almoço, jantar, etc.)
          3. Mantenha TODAS as quantidades e medidas exatamente como especificadas no plano
          4. Inclua TODOS os detalhes de ingredientes e suas quantidades
          5. Respeite TODAS as restrições alimentares mencionadas
          
          Retorne os dados no seguinte formato JSON:
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
                        "quantity": "Quantidade exata",
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
          content: `Crie um cardápio completo baseado nestas informações: ${combinedContent}`
        }
      ],
      response_format: { type: "json_object" }
    });

    console.log('Processamento do OpenAI concluído com sucesso');
    
    return new Response(
      JSON.stringify({ content: finalResponse.choices[0].message.content }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
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