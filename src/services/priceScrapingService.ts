import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

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
  private static firecrawlApp: FirecrawlApp | null = null;
  private static readonly SUPERMARKET_URL = 'https://www.paodeacucar.com/';

  private static async initFirecrawl() {
    if (!this.firecrawlApp) {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'FIRECRAWL_API_KEY' }
      });
      
      if (error || !data?.secret) {
        throw new Error('Falha ao obter chave da API Firecrawl');
      }
      
      this.firecrawlApp = new FirecrawlApp({ apiKey: data.secret });
    }
    return this.firecrawlApp;
  }

  static async scrapeProducts(): Promise<{ success: boolean; data?: ScrapedProduct[]; error?: string }> {
    try {
      const firecrawl = await this.initFirecrawl();
      
      const response = await firecrawl.crawlUrl(this.SUPERMARKET_URL, {
        limit: 100,
        waitForSelector: '.product-card',
        extractors: {
          products: {
            selector: '.product-card',
            type: 'list',
            data: {
              name: { selector: '.product-title', type: 'text' },
              price: { selector: '.product-price', type: 'number' },
              unit: { selector: '.product-unit', type: 'text' }
            }
          }
        }
      });

      if (!response.success) {
        return { success: false, error: 'Falha ao obter dados do site' };
      }

      return {
        success: true,
        data: response.data as ScrapedProduct[]
      };
    } catch (error) {
      console.error('Erro ao obter preços:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
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
            price_per_kg: product.unit.includes('kg') ? product.price : null,
            price_per_unit: !product.unit.includes('kg') ? product.price : null,
            measurement_unit: product.unit,
            last_update: new Date().toISOString()
          })),
          { onConflict: 'name' }
        ) as any; // Type assertion needed due to Supabase client typing limitations

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