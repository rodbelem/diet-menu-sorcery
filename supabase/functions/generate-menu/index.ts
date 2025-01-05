import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSystemPrompt, getUserPrompt } from "./prompts.ts";
import { validateGeneratedMenu } from "./validators.ts";
import { Menu } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const diasSemana = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyzedPattern, period, singleMeal, mealType } = await req.json();
    
    if (!analyzedPattern) {
      throw new Error('Analyzed pattern is required');
    }

    console.log('Generating menu with OpenAI...');
    console.log('Analyzed Pattern:', JSON.stringify(analyzedPattern, null, 2));
    console.log('Single Meal:', singleMeal);
    console.log('Meal Type:', mealType);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: getUserPrompt(analyzedPattern, period, singleMeal, mealType) }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from OpenAI API:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0].message.content.trim();
    console.log('Raw content:', content);
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing direct content:', error);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('Error parsing extracted JSON:', innerError);
          throw new Error('Failed to parse OpenAI response as JSON');
        }
      } else {
        throw new Error('No JSON object found in OpenAI response');
      }
    }

    console.log('Parsed Result:', JSON.stringify(result, null, 2));

    if (!singleMeal) {
      const numDias = period === 'weekly' ? 7 : 14;
      result = validateGeneratedMenu(result, numDias, analyzedPattern);

      result.days = result.days.map((day: any, index: number) => {
        const dayIndex = index % 7;
        return {
          ...day,
          day: diasSemana[dayIndex]
        };
      });
    }

    return new Response(JSON.stringify({ menu: JSON.stringify(result) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-menu function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});