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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const { pdfBase64 } = await req.json();

    console.log('Iniciando processamento do PDF...');

    // Primeiro, vamos extrair o conteúdo exato do plano alimentar
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em extrair informações precisas de planos alimentares.
          
          REGRAS CRÍTICAS:
          1. EXTRAIA EXATAMENTE os alimentos e quantidades mencionados no plano, sem substituições
          2. NUNCA sugira alternativas ou variações que não estejam explicitamente no plano
          3. MANTENHA os tipos exatos de alimentos (ex: se diz arroz branco, não mude para integral)
          4. PRESERVE todas as medidas e quantidades exatamente como especificadas
          5. LISTE todas as refeições do dia com seus horários exatos
          
          Retorne apenas o conteúdo extraído, sem interpretações ou sugestões.`
        },
        {
          role: "user",
          content: `Extraia o conteúdo exato deste plano alimentar: ${pdfBase64}`
        }
      ],
    });

    const extractedContent = extractionResponse.choices[0].message.content;
    console.log('Conteúdo extraído com sucesso, gerando cardápio...');

    // Agora, vamos gerar o cardápio baseado no conteúdo extraído
    const menuResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especializado em criar cardápios.
          
          REGRAS CRÍTICAS para gerar o cardápio:
          1. Use SOMENTE os alimentos e quantidades EXATAMENTE como especificados no plano
          2. NUNCA faça substituições ou sugestões alternativas
          3. MANTENHA os tipos específicos de alimentos (ex: arroz branco deve permanecer arroz branco)
          4. PRESERVE todas as medidas e quantidades exatamente como indicadas
          5. INCLUA todas as refeições para os 7 dias da semana
          6. RESPEITE os horários especificados para cada refeição
          
          Retorne os dados no formato JSON especificado.`
        },
        {
          role: "user",
          content: `Com base neste plano alimentar extraído: ${extractedContent}
          
          Gere um cardápio completo para 7 dias que siga EXATAMENTE as especificações do plano.
          
          O cardápio deve ser retornado no seguinte formato JSON:
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
                        "name": "Nome do ingrediente (EXATAMENTE como está no plano)",
                        "quantity": "Quantidade exata do plano",
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