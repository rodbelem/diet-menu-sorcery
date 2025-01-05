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

    console.log('Iniciando análise do PDF...');
    console.log('Tamanho total do conteúdo recebido:', pdfContent.length, 'caracteres');
    
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
            content: `Você é um especialista em nutrição focado em analisar planos alimentares e extrair padrões.
            IMPORTANTE: NÃO faça suposições sobre restrições alimentares. Extraia APENAS o que está explicitamente declarado no plano.
            
            Analise o plano nutricional fornecido e extraia EXATAMENTE:
            1. Todos os tipos de refeições mencionadas (café da manhã, almoço, etc)
            2. Alimentos permitidos e suas porções para cada refeição
            3. Restrições alimentares EXPLICITAMENTE mencionadas
            4. Horários específicos de refeições, se mencionados
            5. Variações permitidas de alimentos
            
            Retorne a análise em formato JSON com a seguinte estrutura:
            {
              "meal_types": {
                "nome_da_refeicao": {
                  "allowed_foods": ["lista de alimentos permitidos"],
                  "portions": ["porções especificadas"],
                  "restrictions": ["restrições específicas"]
                }
              },
              "dietary_restrictions": ["apenas restrições EXPLICITAMENTE mencionadas"],
              "allowed_proteins": ["todas as proteínas permitidas"],
              "allowed_carbs": ["todos os carboidratos permitidos"],
              "allowed_vegetables": ["todos os vegetais permitidos"],
              "allowed_fruits": ["todas as frutas permitidas"],
              "allowed_dairy": ["todos os laticínios permitidos"],
              "timing": {"refeicao": "horário"}
            }`
          },
          {
            role: 'user',
            content: `Analise cuidadosamente este plano nutricional e extraia todas as informações relevantes sobre:
            1) Horários e tipos de refeições permitidas
            2) Alimentos permitidos e suas quantidades
            3) Restrições alimentares (APENAS as explicitamente mencionadas)
            4) Variações permitidas de alimentos
            5) Qualquer outra informação relevante para a montagem de um cardápio

            IMPORTANTE: NÃO faça suposições sobre restrições alimentares. Extraia APENAS o que está explicitamente mencionado no plano.

            Plano nutricional completo:
            ${pdfContent}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta da OpenAI:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    console.log('Análise do plano nutricional concluída com sucesso');
    console.log('Estrutura da análise:', JSON.stringify(analysis, null, 2));

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função analyze-pdf:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});