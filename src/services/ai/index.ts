import { generateWithOpenAI } from "./openai";
import { generateWithAnthropic } from "./anthropic";

export const generateAIResponse = async (prompt: string) => {
  try {
    // Tenta primeiro com OpenAI
    return await generateWithOpenAI(prompt);
  } catch (error) {
    // Se exceder o limite de tokens, usa Claude
    if (error.message === 'TOKEN_LIMIT_EXCEEDED') {
      return await generateWithAnthropic(prompt);
    }
    throw error;
  }
};