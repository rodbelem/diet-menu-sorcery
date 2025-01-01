import { useState } from "react";
import { PdfUploader } from "@/components/PdfUploader";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMenu } from "@/services/openai";
import { Menu } from "@/types/menu";
import { useToast } from "@/hooks/use-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MenuPDF } from "@/components/MenuPDF";
import { ShoppingListPDF } from "@/components/ShoppingListPDF";
import { Download, Utensils, ShoppingBag } from "lucide-react";

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
          <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-8">
              <PdfUploader onContentExtracted={handlePdfContent} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 md:p-8">
              <PeriodSelector selected={period} onSelect={setPeriod} />
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={handleGenerateMenu}
              disabled={isLoading}
              className="w-full md:w-auto text-lg py-6 px-8 rounded-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all duration-300"
            >
              <Utensils className="w-5 h-5 mr-2" />
              {isLoading ? "Gerando..." : "Gerar Cardápio"}
            </Button>
          </div>

          {menu && (
            <>
              <div className="space-y-4 md:space-y-6">
                {menu.days.map((day, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300"
                  >
                    <CardHeader className="bg-gradient-to-r from-nutri-green to-nutri-blue p-4 md:p-6">
                      <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800">
                        {day.day}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                      {day.meals.map((meal, mealIndex) => (
                        <div
                          key={mealIndex}
                          className="space-y-3 md:space-y-4 p-4 rounded-lg bg-white/70"
                        >
                          <h3 className="font-semibold text-lg md:text-xl text-primary-dark">
                            {meal.meal}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600">
                            {meal.description}
                          </p>
                          <div className="space-y-2 md:space-y-3">
                            <h4 className="font-medium text-gray-700">
                              Ingredientes:
                            </h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                              {meal.ingredients.map((ingredient, ingredientIndex) => (
                                <li
                                  key={ingredientIndex}
                                  className="flex items-center space-x-2 text-xs md:text-sm"
                                >
                                  <span className="w-2 h-2 rounded-full bg-primary-light flex-shrink-0"></span>
                                  <span className="flex-1">
                                    {ingredient.name} - {ingredient.quantity}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-nutri-yellow to-nutri-orange p-4 md:p-6">
                    <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800">
                      Custo Total Estimado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      R$ {menu.totalCost.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center pt-6 md:pt-8">
                <PDFDownloadLink
                  document={<MenuPDF menu={menu} />}
                  fileName="cardapio.pdf"
                >
                  <Button
                    className="w-full md:w-auto rounded-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all duration-300"
                    type="button"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Baixar Cardápio em PDF
                  </Button>
                </PDFDownloadLink>

                <PDFDownloadLink
                  document={<ShoppingListPDF menu={menu} />}
                  fileName="lista-de-compras.pdf"
                >
                  <Button
                    className="w-full md:w-auto rounded-full bg-gradient-to-r from-accent to-accent-dark hover:opacity-90 transition-all duration-300"
                    type="button"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Baixar Lista de Compras em PDF
                  </Button>
                </PDFDownloadLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
