import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const { pdfBase64 } = await req.json();
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em extrair e formatar informações de planos alimentares em PDF. Extraia todas as informações relevantes sobre refeições, porções, horários e restrições."
        },
        {
          role: "user",
          content: pdfBuffer.toString()
        }
      ],
    });

    const extractedContent = response.choices[0].message.content;

    return new Response(
      JSON.stringify({ content: extractedContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})