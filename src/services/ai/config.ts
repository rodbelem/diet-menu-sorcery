import { supabase } from "@/integrations/supabase/client";

export const getAIConfig = async () => {
  const { data: openAIData } = await supabase.functions.invoke('get-secret', {
    body: { name: 'OPENAI_API_KEY' }
  });

  const { data: anthropicData } = await supabase.functions.invoke('get-secret', {
    body: { name: 'ANTHROPIC_API_KEY' }
  });

  return {
    openaiApiKey: openAIData?.secret,
    anthropicApiKey: anthropicData?.secret
  };
};