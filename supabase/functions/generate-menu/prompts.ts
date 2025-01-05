export const getSystemPrompt = () => `Você é um nutricionista brasileiro especializado em criar cardápios personalizados.
    
ATENÇÃO - REGRAS CRÍTICAS:
1. NÃO FAÇA SUPOSIÇÕES SOBRE RESTRIÇÕES ALIMENTARES!
   - NÃO assuma que o cardápio deve ser vegano ou vegetariano
   - NÃO exclua alimentos que não foram explicitamente proibidos
   - INCLUA proteínas animais se permitidas no plano

2. USE OS ALIMENTOS EXATAMENTE COMO ESPECIFICADOS!
   - Se o plano menciona "arroz", use arroz comum, NÃO use arroz integral
   - Se o plano menciona "pão", use pão comum, NÃO use pão integral
   - NÃO substitua alimentos por versões integrais ou diet sem especificação
   - Use APENAS os alimentos EXPLICITAMENTE listados no plano
   
3. IMPORTANTE: Você DEVE gerar EXATAMENTE o mesmo número de refeições por dia que está especificado no plano analisado.
   - Analise cuidadosamente o padrão para identificar todas as refeições diárias
   - Inclua TODAS as refeições mencionadas no plano (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia, etc)
   - NÃO omita nenhuma refeição que esteja no plano original`;

export const getUserPrompt = (analyzedPattern: any, period: string | undefined, singleMeal: boolean, mealType?: string) => {
  if (singleMeal && mealType) {
    return `Com base nesta análise de padrão alimentar:
    ${JSON.stringify(analyzedPattern, null, 2)}
    
    IMPORTANTE:
    1. NÃO assuma restrições que não foram especificadas
    2. Use TODOS os grupos alimentares permitidos
    3. Inclua proteínas animais se permitidas no plano
    4. Use os alimentos EXATAMENTE como listados (não substitua por versões integrais)
    
    Gere UMA NOVA opção para a refeição "${mealType}".
    
    Retorne um objeto JSON no seguinte formato:
    {
      "meal": "Nome da refeição",
      "description": "Descrição detalhada",
      "ingredients": [
        {
          "name": "Nome do ingrediente",
          "quantity": "Quantidade com unidade",
          "estimatedCost": 0.00
        }
      ]
    }`;
  }

  const numDias = period === 'weekly' ? 7 : 14;
  return `Com base nesta análise de padrão alimentar:
    ${JSON.stringify(analyzedPattern, null, 2)}
    
    IMPORTANTE:
    1. NÃO assuma restrições que não foram especificadas
    2. Use TODOS os grupos alimentares permitidos
    3. Inclua proteínas animais se permitidas no plano
    4. Use os alimentos EXATAMENTE como listados (não substitua por versões integrais)
    5. INCLUA TODAS as refeições mencionadas no plano analisado (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia, etc)
    
    Crie um cardápio para ${numDias} dias, incluindo TODAS as refeições especificadas no plano.
    
    Retorne um objeto JSON no seguinte formato:
    {
      "days": [
        {
          "day": "Nome do dia",
          "meals": [
            {
              "meal": "Nome da refeição",
              "description": "Descrição detalhada",
              "ingredients": [
                {
                  "name": "Nome do ingrediente",
                  "quantity": "Quantidade com unidade",
                  "estimatedCost": 0.00
                }
              ]
            }
          ]
        }
      ],
      "totalCost": 0.00
    }`;
};