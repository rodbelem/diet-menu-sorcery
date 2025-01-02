import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceScrapingService } from '@/services/priceScrapingService';
import { RefreshCw } from 'lucide-react';

export const PriceScraper = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpdatePrices = async () => {
    setIsLoading(true);
    setProgress(25);

    try {
      const scrapeResult = await PriceScrapingService.scrapeProducts();
      setProgress(50);

      if (!scrapeResult.success || !scrapeResult.data) {
        throw new Error(scrapeResult.error || 'Falha ao obter preços dos produtos');
      }

      setProgress(75);
      const updateResult = await PriceScrapingService.updatePrices(scrapeResult.data);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Falha ao atualizar preços');
      }

      setProgress(100);
      toast({
        title: "Sucesso",
        description: "Preços atualizados com sucesso!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar preços",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-nutri-green to-nutri-blue p-4 md:p-6">
        <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800">
          Atualizar Preços
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {isLoading && (
          <Progress value={progress} className="w-full mb-4" />
        )}
        <Button
          onClick={handleUpdatePrices}
          disabled={isLoading}
          className="w-full md:w-auto rounded-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all duration-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? "Atualizando preços..." : "Atualizar Preços"}
        </Button>
      </CardContent>
    </Card>
  );
};