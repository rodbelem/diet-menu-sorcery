import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processWithOpenAI(text: string) {
  console.log('Tentando processar com OpenAI...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a nutrition expert specialized in analyzing meal plans and extracting patterns. Return all responses in JSON format.' 
        },
        { role: 'user', content: text }
      ],
    }),
  });

  const data = await response.json();
  
  if (data.error?.message?.includes('maximum context length')) {
    throw new Error('TOKEN_LIMIT_EXCEEDED');
  }
  
  return data.choices[0].message.content;
}

async function processWithClaude(text: string) {
  console.log('Processando com Claude devido ao tamanho do texto...');
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
      messages: [{ role: 'user', content: text }],
      system: "You are a nutrition expert specialized in analyzing meal plans and extracting patterns. Return all responses in JSON format."
    })
  });

  const data = await response.json();
  return data.content[0].text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    console.log('Iniciando processamento do PDF...');
    
    const pdfText = atob(pdfBase64);
    console.log('PDF decodificado, tamanho:', pdfText.length, 'caracteres');

    let content;
    try {
      content = await processWithOpenAI(pdfText);
    } catch (error) {
      if (error.message === 'TOKEN_LIMIT_EXCEEDED') {
        content = await processWithClaude(pdfText);
      } else {
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});