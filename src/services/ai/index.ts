import { generateWithOpenAI } from "./openai";

export const generateAIResponse = async (prompt: string) => {
  try {
    return await generateWithOpenAI(prompt);
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};