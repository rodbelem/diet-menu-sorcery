import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function truncateText(text: string, maxTokens = 100000): string {
  // Approximate tokens by characters (1 token ≈ 4 characters)
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  
  // Find the last complete sentence before the limit
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  
  return lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    console.log('[1/4] Iniciando processamento do PDF...');
    
    const pdfText = atob(pdfBase64);
    console.log('[2/4] PDF decodificado, tamanho:', pdfText.length, 'caracteres');
    
    // Truncate text to fit within token limits
    const truncatedText = truncateText(pdfText);
    console.log('[3/4] Texto truncado para:', truncatedText.length, 'caracteres');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um nutricionista especializado em analisar planos alimentares. Sua tarefa é extrair o padrão de cada refeição do plano nutricional fornecido e retornar em formato JSON. Preste atenção aos alimentos permitidos, suas quantidades e horários específicos. Retorne apenas o padrão extraído, sem sugestões ou variações."
          },
          {
            role: "user",
            content: truncatedText
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    console.log('[4/4] Resposta recebida da OpenAI');

    if (!response.ok) {
      console.error('Erro da OpenAI:', data);
      throw new Error(data.error?.message || 'Erro ao processar o PDF');
    }

    return new Response(
      JSON.stringify({ content: data.choices[0].message.content }),
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