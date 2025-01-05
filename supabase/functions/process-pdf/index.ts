import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    if (!pdfBase64) {
      console.error('PDF content is missing');
      throw new Error('PDF content is required');
    }

    console.log('Processing PDF content, length:', pdfBase64.length);

    // Split content into chunks of 100k characters
    const chunkSize = 100000;
    const chunks = [];
    for (let i = 0; i < pdfBase64.length; i += chunkSize) {
      chunks.push(pdfBase64.slice(i, i + chunkSize));
    }

    console.log(`Split PDF content into ${chunks.length} chunks`);

    let processedContent = '';
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // Process each chunk with OpenAI
    for (const chunk of chunks) {
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
              content: 'You are a nutrition expert analyzing meal plans. Extract key information and patterns from the provided text, focusing on dietary requirements, restrictions, and meal structure.'
            },
            { 
              role: 'user', 
              content: `Analyze this part of a PDF content (base64 encoded) and extract relevant nutritional information: ${chunk}`
            }
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      processedContent += data.choices[0].message.content + '\n\n';
    }

    console.log('Successfully processed all chunks');

    return new Response(
      JSON.stringify({ content: processedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});