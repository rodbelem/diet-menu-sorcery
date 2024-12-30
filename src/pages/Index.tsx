import { useState } from "react";
import { PdfUploader } from "@/components/PdfUploader";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMenu } from "@/services/openai";
import { Menu } from "@/types/menu";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [period, setPeriod] = useState<"weekly" | "biweekly">("weekly");
  const [pdfContent, setPdfContent] = useState<string>("");
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePdfContent = (content: string) => {
    setPdfContent(content);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planejador de Cardápio
          </h1>
          <p className="text-lg text-gray-600">
            Monte seu cardápio personalizado baseado no seu plano nutricional
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-12">
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <PdfUploader onContentExtracted={handlePdfContent} />
          </section>

          <section className="bg-white p-8 rounded-lg shadow-sm">
            <PeriodSelector selected={period} onSelect={setPeriod} />
          </section>

          <section className="text-center">
            <Button
              onClick={handleGenerateMenu}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? "Gerando..." : "Gerar Cardápio"}
            </Button>
          </section>

          {menu && (
            <section className="space-y-8">
              {menu.days.map((day, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{day.day}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {day.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="space-y-4">
                        <h3 className="font-semibold text-lg">{meal.meal}</h3>
                        <p className="text-gray-600">{meal.description}</p>
                        <div className="space-y-2">
                          <h4 className="font-medium">Ingredientes:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {meal.ingredients.map((ingredient, ingredientIndex) => (
                              <li key={ingredientIndex}>
                                {ingredient.name} - {ingredient.quantity} (R$ 
                                {ingredient.estimatedCost.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardHeader>
                  <CardTitle>Custo Total Estimado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    R$ {menu.totalCost.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;