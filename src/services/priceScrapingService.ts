import { supabase } from "@/integrations/supabase/client";
import FirecrawlApp from '@mendable/firecrawl-js';

interface ScrapedProduct {
  name: string;
  price: number;
  unit: string;
}

export class PriceScrapingService {
  private static firecrawlApp: FirecrawlApp | null = null;

  private static async initFirecrawl() {
    if (!this.firecrawlApp) {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'FIRECRAWL_API_KEY' }
      });
      
      if (error || !data?.secret) {
        throw new Error('Failed to get Firecrawl API key');
      }
      
      this.firecrawlApp = new FirecrawlApp({ apiKey: data.secret });
    }
    return this.firecrawlApp;
  }

  static async scrapeProducts(url: string): Promise<{ success: boolean; data?: ScrapedProduct[]; error?: string }> {
    try {
      const firecrawl = await this.initFirecrawl();
      
      const response = await firecrawl.crawlUrl(url, {
        limit: 100,
        scrapeOptions: {
          selectors: {
            products: {
              selector: '.product-card',
              type: 'list',
              properties: {
                name: '.product-title',
                price: {
                  selector: '.product-price',
                  type: 'number'
                },
                unit: '.product-unit'
              }
            }
          }
        }
      });

      if (!response.success) {
        return { success: false, error: 'Failed to scrape website' };
      }

      return {
        success: true,
        data: response.data.products as ScrapedProduct[]
      };
    } catch (error) {
      console.error('Error scraping products:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
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
        );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating prices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update prices'
      };
    }
  }
}