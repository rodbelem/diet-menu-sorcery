import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      console.error('Conteúdo do PDF ausente');
      throw new Error('Conteúdo do PDF é obrigatório');
    }

    console.log('Processando conteúdo do PDF, tamanho:', pdfBase64.length);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('Chave da API OpenAI não encontrada nas variáveis de ambiente');
      throw new Error('Configuração da OpenAI ausente');
    }

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
            content: 'Você é um especialista em nutrição analisando planos alimentares. Extraia informações e padrões importantes do texto fornecido, focando em requisitos dietéticos, restrições e estrutura das refeições.'
          },
          { 
            role: 'user', 
            content: `Analise este conteúdo do PDF e extraia as informações nutricionais relevantes: ${pdfBase64}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API da OpenAI:', errorText);
      throw new Error(`Erro na API da OpenAI: ${errorText}`);
    }

    const data = await response.json();
    const processedContent = data.choices[0].message.content;

    if (!processedContent) {
      throw new Error('Resposta vazia da OpenAI');
    }

    console.log('Processamento concluído com sucesso');

    return new Response(
      JSON.stringify({ content: processedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função process-pdf:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno no processamento do PDF',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});