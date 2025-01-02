import { useState } from "react";
import { PdfUploader } from "@/components/PdfUploader";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Card, CardContent } from "@/components/ui/card";
import { generateMenu, regenerateMeal } from "@/services/openai";
import { Menu } from "@/types/menu";
import { useToast } from "@/hooks/use-toast";
import { GenerateMenuButton } from "@/components/GenerateMenuButton";
import { MenuDisplay } from "@/components/MenuDisplay";
import { PriceScraper } from "@/components/PriceScraper";

const Index = () => {
  const [period, setPeriod] = useState<"weekly" | "biweekly">("weekly");
  const [pdfContent, setPdfContent] = useState<string>("");
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateMenu = async () => {
    if (!pdfContent) {
      toast({
        title: "Erro",
        description: "Por favor, faça upload do PDF com o plano nutricional",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const generatedMenu = await generateMenu(pdfContent, period);
      setMenu(generatedMenu);
      toast({
        title: "Sucesso!",
        description: "Cardápio gerado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o cardápio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, mealIndex: number, mealType: string) => {
    if (!menu || !pdfContent) return;
    
    setRegeneratingMeal(`${dayIndex}-${mealIndex}`);
    try {
      const newMeal = await regenerateMeal(pdfContent, mealType);
      
      const updatedMenu = { ...menu };
      updatedMenu.days[dayIndex].meals[mealIndex] = newMeal;
      
      updatedMenu.totalCost = updatedMenu.days.reduce((total, day) => {
        return total + day.meals.reduce((dayTotal, meal) => {
          return dayTotal + meal.ingredients.reduce((mealTotal, ingredient) => {
            return mealTotal + ingredient.estimatedCost;
          }, 0);
        }, 0);
      }, 0);
      
      setMenu(updatedMenu);
      toast({
        title: "Sucesso!",
        description: "Nova opção de refeição gerada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar nova opção de refeição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingMeal(null);
    }
  };

  return (
    <div className="min-h-screen bg-nutri-gray">
      <div className="container py-6 md:py-12 px-4 md:px-8">
        <header className="text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Planejador de Cardápio
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-light">
            Monte seu cardápio personalizado baseado no seu plano nutricional
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <PriceScraper />

          <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-8">
              <PdfUploader onContentExtracted={setPdfContent} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-8">
              <PeriodSelector selected={period} onSelect={setPeriod} />
            </CardContent>
          </Card>

          <div className="text-center">
            <GenerateMenuButton onClick={handleGenerateMenu} isLoading={isLoading} />
          </div>

          {menu && (
            <MenuDisplay 
              menu={menu} 
              onRegenerateMeal={handleRegenerateMeal}
              regeneratingMeal={regeneratingMeal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;