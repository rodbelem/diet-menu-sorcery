import { AnalyzedPattern, Menu } from "./types.ts";

export const validateGeneratedMenu = (
  result: Menu,
  numDias: number,
  analyzedPattern: AnalyzedPattern
) => {
  // Verificar número de dias
  if (result.days.length !== numDias) {
    console.error(`Número incorreto de dias gerado: ${result.days.length}, esperado: ${numDias}`);
    throw new Error('Número incorreto de dias gerado');
  }

  // Verificar se todas as refeições estão presentes
  const refeicoesPadrao = Object.keys(analyzedPattern.meal_types || {});
  for (const day of result.days) {
    const refeicoesGeradas = day.meals.map(m => m.meal);
    const faltando = refeicoesPadrao.filter(r => !refeicoesGeradas.includes(r));
    if (faltando.length > 0) {
      console.error(`Refeições faltando no dia ${day.day}:`, faltando);
      throw new Error(`Refeições faltando no cardápio: ${faltando.join(', ')}`);
    }
  }

  return result;
};