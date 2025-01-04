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
    console.log('Iniciando processamento do PDF...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            
            Analise o conteúdo do PDF e extraia APENAS o padrão de cada refeição, com a quantidade exata indicada no planejamento`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: atob(pdfBase64)
              }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro na resposta da OpenAI:', error);
      throw new Error(error.error?.message || 'Erro ao processar o PDF');
    }

    const data = await response.json();
    console.log('Resposta da OpenAI recebida com sucesso');

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