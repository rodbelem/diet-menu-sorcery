import { Menu, MenuItem } from '@/types/menu';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export const generateMenu = async (pdfContent: string, period: "weekly" | "biweekly") => {
  if (!pdfContent) {
    throw new Error('PDF content is required');
  }

  try {
    // First, analyze the PDF with Claude
    console.log('Analyzing PDF with Claude...');
    const { data: analysisResponse, error: analysisError } = await supabase.functions.invoke('analyze-pdf', {
      body: { pdfContent }
    });

    if (analysisError) {
      console.error('Error analyzing PDF:', analysisError);
      throw analysisError;
    }

    // Store the pattern and analysis
    const { data: patternData, error: patternError } = await supabase
      .from('meal_patterns')
      .insert([{ 
        content: pdfContent,
        analyzed_content: analysisResponse.analysis
      }])
      .select()
      .single();

    if (patternError) {
      console.error('Error storing meal pattern:', patternError);
      throw patternError;
    }

    // Generate menu with OpenAI using the analysis
    console.log('Generating menu with OpenAI...');
    const { data: menuResponse, error: menuError } = await supabase.functions.invoke('generate-menu', {
      body: { 
        analyzedPattern: patternData.analyzed_content,
        period 
      }
    });

    if (menuError) {
      console.error('Error generating menu:', menuError);
      throw menuError;
    }

    const menuData = JSON.parse(menuResponse.menu) as Menu;

    // Store the generated menu
    const { data: menuRecord, error: menuStoreError } = await supabase
      .from('menus')
      .insert([{
        pattern_id: patternData.id,
        content: menuData as unknown as Json,
        period: period,
        total_cost: menuData.totalCost
      }])
      .select()
      .single();

    if (menuStoreError) {
      console.error('Error storing menu:', menuStoreError);
      throw menuStoreError;
    }
    
    return menuData;
  } catch (error) {
    console.error("Erro ao gerar cardápio:", error);
    throw error;
  }
};

export const regenerateMeal = async (pdfContent: string, mealType: string) => {
  try {
    // Primeiro, analisar o PDF para obter o padrão
    const { data: analysisResponse, error: analysisError } = await supabase.functions.invoke('analyze-pdf', {
      body: { pdfContent }
    });

    if (analysisError) {
      console.error('Error analyzing PDF:', analysisError);
      throw analysisError;
    }

    // Gerar nova refeição usando o padrão analisado
    const { data: response, error } = await supabase.functions.invoke('generate-menu', {
      body: { 
        analyzedPattern: analysisResponse.analysis,
        singleMeal: true,
        mealType 
      }
    });

    if (error) throw error;
    return JSON.parse(response.menu) as MenuItem;
  } catch (error) {
    console.error("Erro ao gerar nova opção de refeição:", error);
    throw error;
  }
};