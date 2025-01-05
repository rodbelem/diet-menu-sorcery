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
    
    if (!pdfBase64) {
      throw new Error('PDF content is required');
    }

    console.log('Processing PDF with GPT-4...');
    
    // Split the base64 content into chunks to handle large PDFs
    const chunkSize = 100000; // Adjust based on testing
    const chunks = [];
    for (let i = 0; i < pdfBase64.length; i += chunkSize) {
      chunks.push(pdfBase64.slice(i, i + chunkSize));
    }
    
    // Process first chunk to get main patterns
    const initialChunk = chunks[0];
    console.log(`Processing initial chunk of size: ${initialChunk.length}`);

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
            content: 'You are a nutrition expert analyzing meal plans. Extract important patterns from the provided text, focusing on dietary requirements, restrictions, and meal structure. Return a concise JSON object with the analysis.'
          },
          {
            role: 'user',
            content: `Analyze this meal plan PDF content (base64 encoded) and extract the key nutritional patterns:
            ${initialChunk}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API Error: ${errorText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(JSON.stringify({ content: analysis }), {
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