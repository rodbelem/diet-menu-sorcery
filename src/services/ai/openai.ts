import OpenAI from 'openai';
import { getAIConfig } from "./config";

export const generateWithOpenAI = async (prompt: string) => {
  const config = await getAIConfig();
  
  const openai = new OpenAI({
    apiKey: config.openaiApiKey,
    dangerouslyAllowBrowser: true
  });

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o",
    response_format: { type: "json_object" }
  });

  return completion.choices[0].message.content;
};