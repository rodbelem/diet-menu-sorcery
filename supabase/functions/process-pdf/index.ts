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
    
    if (!pdfBase64) {
      throw new Error('PDF content is required');
    }

    console.log('Processando PDF com Claude...');

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
        messages: [{
          role: 'user',
          content: `Analise este plano alimentar em PDF (codificado em base64) e extraia os padrões nutricionais importantes, restrições alimentares, e estrutura das refeições. Retorne apenas um objeto JSON com a análise:
          
          ${pdfBase64}`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API do Claude:', errorText);
      throw new Error(`Erro na API do Claude: ${errorText}`);
    }

    const data = await response.json();
    const analysis = data.content[0].text;

    return new Response(JSON.stringify({ content: analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função process-pdf:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});