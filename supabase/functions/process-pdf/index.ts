import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    
    console.log('Iniciando processamento do PDF...');
    const pdfText = atob(pdfBase64);
    console.log('PDF decodificado, tamanho:', pdfText.length, 'caracteres');

    try {
      // First try with OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a nutrition expert specialized in analyzing meal plans and extracting patterns. Return all responses in JSON format.' },
            { role: 'user', content: pdfText }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error details:', errorData);
        
        // If it's a token limit error, try with Anthropic
        if (errorData.error?.message?.includes('maximum context length')) {
          console.log('Texto muito longo para OpenAI, alternando para Claude...');
          
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-opus-20240229',
              max_tokens: 4096,
              messages: [
                {
                  role: 'user',
                  content: `Analyze this meal plan and extract patterns. Return in JSON format:\n${pdfText}`
                }
              ]
            }),
          });

          if (!anthropicResponse.ok) {
            throw new Error('Anthropic API error: ' + await anthropicResponse.text());
          }

          const anthropicData = await anthropicResponse.json();
          return new Response(
            JSON.stringify({ content: anthropicData.content[0].text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error('OpenAI API error: ' + errorData.error?.message);
      }

      const data = await openaiResponse.json();
      return new Response(
        JSON.stringify({ content: data.choices[0].message.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error processing with AI:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in process-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});