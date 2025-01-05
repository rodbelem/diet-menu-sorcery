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

    console.log('Processing PDF with GPT-4o...');
    console.log('Base64 content length:', pdfBase64.length);
    
    // Process the entire PDF content at once
    console.log('Processing complete PDF content...');

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
            content: `You are a PDF content extractor. Your task is to extract ALL text content from the provided PDF, maintaining all the important information about meals, portions, and dietary requirements. Do not summarize or modify the content. Return the complete extracted text.

IMPORTANT:
1. Extract and return ALL text content
2. Do not summarize or modify the content
3. Maintain all specific details about meals, portions, and requirements
4. If you see base64 encoded content, decode it first`
          },
          {
            role: 'user',
            content: `Extract and return the complete text content from this PDF (base64 encoded). Do not modify or summarize the content:
            ${pdfBase64}`
          }
        ],
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API Error: ${errorText}`);
    }

    const data = await response.json();
    const extractedContent = data.choices[0].message.content;
    
    console.log('Content extraction completed');
    console.log('Extracted content length:', extractedContent.length);
    console.log('Sample of extracted content:', extractedContent.substring(0, 200));

    return new Response(JSON.stringify({ content: extractedContent }), {
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