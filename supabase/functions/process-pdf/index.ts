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
    const { pdfBase64 } = await req.json();
    console.log('[1/4] Iniciando processamento do PDF...');
    
    const pdfText = atob(pdfBase64);
    console.log('[2/4] PDF decodificado, tamanho:', pdfText.length, 'caracteres');
    
    // Estimar o número de tokens (aproximadamente 4 caracteres por token)
    const estimatedTokens = Math.ceil(pdfText.length / 4);
    console.log(`[3/4] Tokens estimados: ${estimatedTokens}`);

    // Escolher o modelo baseado no tamanho do texto
    const model = estimatedTokens > 128000 ? "gpt-4o-mini" : "gpt-4o";
    console.log(`Usando modelo ${model} para processar o texto`);

    const openAIBody = {
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um nutricionista especializado em analisar planos alimentares. Extraia o padrão de cada refeição e retorne em formato JSON. A resposta deve ser um objeto JSON válido."
        },
        {
          role: "user",
          content: pdfText
        }
      ],
      response_format: { type: "json_object" }
    };

    console.log(`[4/4] Enviando requisição para OpenAI usando modelo ${model}...`);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIBody),
    });

    const data = await response.json();
    console.log('Resposta recebida da OpenAI');
    
    if (!response.ok) {
      console.error('Erro da OpenAI:', data);
      throw new Error(data.error?.message || 'Erro ao processar o PDF');
    }

    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Erro detalhado ao processar PDF:', error);
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