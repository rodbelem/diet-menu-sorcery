import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const { pdfBase64 } = await req.json();

    // First, let's get a concise summary of the PDF content
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a specialized nutritionist assistant. Your task is to extract and summarize the key information from nutrition plans, focusing only on the essential details about meals, portions, and restrictions."
        },
        {
          role: "user",
          content: `Extract and summarize the key nutritional information from this PDF content, focusing only on meals, portions, and restrictions: ${pdfBase64.substring(0, 60000)}`
        }
      ],
    });

    const summary = summaryResponse.choices[0].message.content;

    // Now, let's process the summary to extract structured information
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist assistant that helps format nutrition plans into structured data. Format the information into clear, specific meal plans with exact portions and ingredients."
        },
        {
          role: "user",
          content: `Based on this nutrition plan summary, create a structured meal plan: ${summary}`
        }
      ],
    });

    console.log('OpenAI processing completed successfully');
    
    return new Response(
      JSON.stringify({ content: response.choices[0].message.content }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});