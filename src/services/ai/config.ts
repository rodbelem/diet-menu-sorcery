import { supabase } from '@/integrations/supabase/client';

export const AI_CONFIG = {
  OPENAI_TOKEN_LIMIT: 128000,
  DEFAULT_MODEL: 'gpt-4-turbo-preview'
};

export const getAIConfig = async () => {
  const { data: { OPENAI_API_KEY, ANTHROPIC_API_KEY } } = await supabase.functions.invoke('get-secret', {
    body: { keys: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'] }
  });

  return {
    openaiApiKey: OPENAI_API_KEY,
    anthropicApiKey: ANTHROPIC_API_KEY
  };
};