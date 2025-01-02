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

    console.log('Iniciando processamento do PDF...');

    // First, let's extract the content in smaller chunks
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em extrair informações EXATAS de planos alimentares.
          
          REGRAS CRÍTICAS:
          1. NUNCA altere ou substitua NENHUMA unidade de medida
          2. Mantenha EXATAMENTE as mesmas medidas (colher, grama, ml, etc) que estão no plano
          3. NUNCA converta unidades (ex: não converta colheres para xícaras)
          4. PRESERVE os tipos exatos de alimentos (ex: se diz arroz branco, não mude para integral)
          5. COPIE literalmente as quantidades como estão no plano
          6. Se uma medida específica é mencionada (ex: "colher de sopa"), use EXATAMENTE essa medida
          
          Retorne apenas o conteúdo extraído, mantendo fielmente todas as especificações originais.
          
          IMPORTANTE: Retorne o conteúdo de forma CONCISA, removendo qualquer texto desnecessário ou decorativo.`
        },
        {
          role: "user",
          content: `Extraia o conteúdo exato deste plano alimentar, mantendo todas as medidas originais: ${pdfBase64}`
        }
      ],
      max_tokens: 4000
    });

    const extractedContent = extractionResponse.choices[0].message.content;
    console.log('Conteúdo extraído com sucesso, gerando cardápio...');

    // Now generate the menu with the extracted content
    const menuResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um nutricionista especializado em criar cardápios.
          
          REGRAS CRÍTICAS para gerar o cardápio:
          1. Use SOMENTE as unidades de medida EXATAMENTE como especificadas no plano
          2. NUNCA faça conversões de unidades (ex: não converta colheres para xícaras)
          3. Mantenha os tipos específicos de alimentos (ex: arroz branco deve permanecer arroz branco)
          4. Use as medidas exatas mencionadas (ex: "colher de sopa" deve permanecer "colher de sopa")
          5. NUNCA substitua ingredientes ou suas medidas
          6. Se uma quantidade específica é mencionada (ex: "2 colheres de sopa"), use EXATAMENTE essa quantidade
          
          Retorne os dados no formato JSON especificado.`
        },
        {
          role: "user",
          content: `Com base neste plano alimentar extraído: ${extractedContent}
          
          Gere um cardápio completo que siga EXATAMENTE as especificações do plano.
          
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
      response_format: { type: "json_object" },
      max_tokens: 4000
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