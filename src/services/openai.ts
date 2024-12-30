import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateMenu = async (pdfContent: string, period: "weekly" | "biweekly") => {
  const prompt = `Com base no seguinte plano nutricional:
  
  ${pdfContent}
  
  Gere um cardápio ${period === "weekly" ? "semanal" : "quinzenal"} detalhado com as seguintes informações:
  - Refeições para cada dia
  - Lista de ingredientes necessários para cada refeição
  - Estimativa de custo para cada ingrediente (em reais)
  
  Retorne os dados no seguinte formato JSON:
  {
    "days": [
      {
        "day": "Segunda-feira",
        "meals": [
          {
            "meal": "Café da manhã",
            "description": "Descrição da refeição",
            "ingredients": [
              {
                "name": "Nome do ingrediente",
                "quantity": "Quantidade necessária",
                "estimatedCost": 0.00
              }
            ]
          }
        ]
      }
    ],
    "totalCost": 0.00
  }`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("Não foi possível gerar o cardápio");
    
    return JSON.parse(response) as Menu;
  } catch (error) {
    console.error("Erro ao gerar cardápio:", error);
    throw error;
  }
};