import { supabase } from "@/integrations/supabase/client";
import OpenAI from 'openai';

interface ScrapedProduct {
  name: string;
  price: number;
  unit: string;
}

interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string;
          name: string;
          price_per_kg: number | null;
          price_per_unit: number | null;
          measurement_unit: string;
          last_update: string;
          created_at: string;
        };
        Insert: {
          name: string;
          price_per_kg?: number | null;
          price_per_unit?: number | null;
          measurement_unit: string;
          last_update?: string;
        };
      };
    };
  };
}

export class PriceScrapingService {
  private static async getOpenAIClient() {
    const { data, error } = await supabase.functions.invoke('get-secret', {
      body: { name: 'OPENAI_API_KEY' }
    });
    
    if (error || !data?.secret) {
      throw new Error('Failed to get OpenAI API key');
    }
    
    return new OpenAI({
      apiKey: data.secret,
      dangerouslyAllowBrowser: true
    });
  }

  static async scrapeProducts(): Promise<{ success: boolean; data?: ScrapedProduct[]; error?: string }> {
    try {
      const openai = await this.getOpenAIClient();
      
      const prompt = `Pesquise e retorne os preços atuais dos seguintes ingredientes comuns em supermercados brasileiros:
      - Arroz branco (kg)
      - Feijão carioca (kg)
      - Batata (kg)
      - Cenoura (kg)
      - Tomate (kg)
      - Cebola (kg)
      - Alho (kg)
      - Banana (kg)
      - Maçã (kg)
      - Laranja (kg)
      - Frango (kg)
      - Carne bovina (kg)
      - Peixe (kg)
      - Leite (L)
      - Ovos (dúzia)
      - Pão francês (kg)
      
      Retorne os dados no seguinte formato JSON:
      {
        "products": [
          {
            "name": "nome do produto",
            "price": 0.00,
            "unit": "kg ou L ou dúzia"
          }
        ]
      }
      
      Use preços médios do mercado brasileiro atual. Seja preciso e realista com os valores.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      if (!response) throw new Error("Não foi possível obter os preços");
      
      const data = JSON.parse(response);
      return { 
        success: true, 
        data: data.products as ScrapedProduct[]
      };
    } catch (error) {
      console.error("Erro ao obter preços:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      };
    }
  }

  static async updatePrices(products: ScrapedProduct[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ingredients')
        .upsert(
          products.map(product => ({
            name: product.name.toLowerCase(),
            price_per_kg: product.unit === 'kg' ? product.price : null,
            price_per_unit: product.unit !== 'kg' ? product.price : null,
            measurement_unit: product.unit,
            last_update: new Date().toISOString()
          })),
          { onConflict: 'name' }
        );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao atualizar preços'
      };
    }
  }
}