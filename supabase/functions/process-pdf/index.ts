import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function chunkText(text: string, maxLength = 100000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs or sections
  const sections = text.split(/\n\n+/);
  
  for (const section of sections) {
    if ((currentChunk + section).length <= maxLength) {
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = section;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfContent } = await req.json();
    console.log('Received PDF content, length:', pdfContent.length);

    // Split content into manageable chunks
    const chunks = chunkText(pdfContent);
    console.log('Split content into', chunks.length, 'chunks');

    let processedContent = '';
    
    // Process each chunk
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
              content: 'You are a nutrition expert analyzing meal plans. Extract key information and patterns from the provided text. Focus on dietary requirements, restrictions, and meal structure.'
            },
            { role: 'user', content: chunk }
          ],
          response_format: { type: "text" }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${await response.text()}`);
      }

      const data = await response.json();
      processedContent += data.choices[0].message.content + '\n\n';
    }

    // Final analysis of the combined processed content
    const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a nutrition expert. Create a structured summary of the analyzed meal plan.'
          },
          { role: 'user', content: processedContent }
        ],
        response_format: { type: "text" }
      }),
    });

    if (!finalResponse.ok) {
      throw new Error(`OpenAI API error in final analysis: ${await finalResponse.text()}`);
    }

    const finalData = await finalResponse.json();
    
    return new Response(
      JSON.stringify({ content: finalData.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});