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
    const { pdfContent } = await req.json();
    
    if (!pdfContent) {
      throw new Error('PDF content is required');
    }

    console.log('Analyzing PDF content with Claude...');
    
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
            content: `Analise cuidadosamente este plano nutricional e extraia todas as informações relevantes sobre:
            1) Horários e tipos de refeições permitidas
            2) Alimentos permitidos e suas quantidades
            3) Restrições alimentares
            4) Variações permitidas de alimentos
            5) Qualquer outra informação relevante para a montagem de um cardápio

            Plano nutricional:
            ${pdfContent}

            Retorne a análise em formato JSON estruturado que possa ser usado posteriormente para gerar cardápios.`
          }
        ],
        system: "Você é um nutricionista especializado em analisar planos alimentares e extrair padrões. Retorne todas as respostas em formato JSON."
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from Claude API:', errorText);
      throw new Error(`Claude API error: ${errorText}`);
    }

    const data = await response.json();
    const analysis = data.content[0].text;

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-pdf function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});