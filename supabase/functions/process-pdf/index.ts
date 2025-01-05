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
    const { pdfContent } = await req.json();
    
    if (!pdfContent) {
      console.error('PDF content is missing');
      throw new Error('PDF content is required');
    }

    console.log('Iniciando análise do texto...');
    console.log('Tamanho do conteúdo recebido:', pdfContent.length, 'caracteres');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em nutrição analisando planos alimentares.
            
            IMPORTANTE:
            1. Analise TODOS os detalhes do plano nutricional fornecido
            2. Mantenha todas as informações sobre refeições, porções e requisitos
            3. NÃO faça suposições sobre restrições alimentares
            4. Extraia APENAS o que está explicitamente declarado no plano`
          },
          {
            role: 'user',
            content: `Analise cuidadosamente este plano nutricional completo e extraia todas as informações relevantes:
            ${pdfContent}`
          }
        ],
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API Error: ${errorText}`);
    }

    const data = await response.json();
    const extractedContent = data.choices[0].message.content;
    
    console.log('Análise concluída');
    console.log('Tamanho do conteúdo analisado:', extractedContent.length);
    console.log('Amostra do conteúdo:', extractedContent.substring(0, 200));

    return new Response(JSON.stringify({ content: extractedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-pdf function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});