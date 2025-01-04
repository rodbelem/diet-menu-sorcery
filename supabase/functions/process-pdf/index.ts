import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

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

    console.log('[3/4] Enviando para o Claude...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Analise este plano nutricional e extraia o padrão de cada refeição. Retorne apenas o padrão extraído em formato JSON, sem sugestões ou variações:

${pdfText}`
          }
        ],
        system: "Você é um nutricionista especializado em analisar planos alimentares. Sua tarefa é extrair o padrão de cada refeição do plano nutricional fornecido e retornar em formato JSON. Preste atenção aos alimentos permitidos, suas quantidades e horários específicos."
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[4/4] Resposta recebida do Claude');

    return new Response(
      JSON.stringify({ content: data.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro detalhado ao processar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});