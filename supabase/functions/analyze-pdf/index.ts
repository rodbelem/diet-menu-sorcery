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
      throw new Error('PDF content is required');
    }

    console.log('Starting PDF analysis...');
    console.log('Raw PDF Content:', pdfContent);
    
    // Split content into chunks to handle large PDFs
    const chunkSize = 50000;
    const chunks = [];
    for (let i = 0; i < pdfContent.length; i += chunkSize) {
      chunks.push(pdfContent.slice(i, i + chunkSize));
    }

    const initialChunk = chunks[0];
    console.log('Processing PDF content of length:', initialChunk.length);
    console.log('First 1000 characters of PDF content:', initialChunk.substring(0, 1000));

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
            content: `You are a nutrition expert specialized in analyzing meal plans and extracting patterns. 
            IMPORTANT: Do not make assumptions about dietary restrictions. Only extract what is explicitly stated in the plan.
            Return all responses in JSON format with the following structure:
            {
              "meal_types": {
                "meal_name": {
                  "allowed_foods": [],
                  "portions": [],
                  "restrictions": []
                }
              },
              "dietary_restrictions": [],
              "allowed_proteins": [],
              "allowed_carbs": [],
              "allowed_vegetables": [],
              "allowed_fruits": [],
              "allowed_dairy": [],
              "timing": {}
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

            Plano nutricional:
            ${initialChunk}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from OpenAI API:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    console.log('Extracted Analysis:', analysis);

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