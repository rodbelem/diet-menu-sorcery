import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    console.log('Iniciando processamento do PDF...');

    // First, extract only the relevant nutritional information
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Extraia apenas as informações nutricionais essenciais do plano alimentar: refeições, horários, alimentos permitidos e suas quantidades exatas. Mantenha as unidades de medida originais."
        },
        {
          role: "user",
          content: pdfBase64
        }
      ],
      max_tokens: 4000
    });

    const extractedContent = extractionResponse.choices[0].message.content;
    console.log('Conteúdo extraído, gerando cardápio...');

    // Now generate the menu with the extracted content
    const menuResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Crie um cardápio baseado nas informações nutricionais fornecidas. Mantenha EXATAMENTE as mesmas unidades de medida e quantidades especificadas no plano."
        },
        {
          role: "user",
          content: extractedContent
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    console.log('Cardápio gerado com sucesso');
    
    return new Response(
      JSON.stringify({ content: menuResponse.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});