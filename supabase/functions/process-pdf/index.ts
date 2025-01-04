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
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: 'You are a nutrition expert specialized in analyzing meal plans and extracting patterns. Return all responses in JSON format.' 
        },
        { role: 'user', content: text }
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error details:', errorData);
    throw new Error(`OpenAI API error: ${response.statusText || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('OpenAI response received:', data);
  
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid OpenAI response format:', data);
    throw new Error('Invalid response format from OpenAI');
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

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Claude API error details:', errorData);
    throw new Error(`Claude API error: ${response.statusText || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('Claude response received:', data);
  
  if (!data.content?.[0]?.text) {
    console.error('Invalid Claude response format:', data);
    throw new Error('Invalid response format from Claude');
  }
  
  return data.content[0].text;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    if (!pdfBase64) {
      throw new Error('PDF content is required');
    }
    
    console.log('Iniciando processamento do PDF...');
    
    const pdfText = atob(pdfBase64);
    console.log('PDF decodificado, tamanho:', pdfText.length, 'caracteres');

    let content;
    try {
      content = await processWithOpenAI(pdfText);
    } catch (error) {
      console.error('Erro ao processar com OpenAI:', error);
      if (error.message.includes('maximum context length')) {
        content = await processWithClaude(pdfText);
      } else {
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ content }),
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
        },
      }
    );
  }
});