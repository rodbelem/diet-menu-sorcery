import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.204.0/encoding/base64.ts";

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

    // Convert base64 to a data URL that OpenAI can process
    const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
    
    console.log('Enviando para Vision API...');

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
            
            Analise o plano alimentar e extraia APENAS:
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
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500
      }),
    });

    const result = await visionResponse.json();
    console.log('Resposta da Vision API recebida:', result);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return new Response(
      JSON.stringify({ content: result.choices[0].message.content }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});