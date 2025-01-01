import { Menu, MenuItem } from "@/types/menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MenuPDF } from "@/components/MenuPDF";
import { ShoppingListPDF } from "@/components/ShoppingListPDF";
import { Download, ShoppingBag } from "lucide-react";

interface MenuDisplayProps {
  menu: Menu;
  onRegenerateMeal: (dayIndex: number, mealIndex: number, mealType: string) => void;
  regeneratingMeal: string | null;
}

export const MenuDisplay = ({ menu, onRegenerateMeal, regeneratingMeal }: MenuDisplayProps) => {
  return (
    <>
      <div className="space-y-4 md:space-y-6">
        {menu.days.map((day, dayIndex) => (
          <Card
            key={dayIndex}
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
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg md:text-xl text-primary-dark">
                      {meal.meal}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRegenerateMeal(dayIndex, mealIndex, meal.meal)}
                      disabled={regeneratingMeal === `${dayIndex}-${mealIndex}`}
                      className="text-xs md:text-sm"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingMeal === `${dayIndex}-${mealIndex}` ? 'animate-spin' : ''}`} />
                      {regeneratingMeal === `${dayIndex}-${mealIndex}` ? "Gerando..." : "Gerar outra opção"}
                    </Button>
                  </div>
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
          className="w-full md:w-auto"
        >
          {({ loading }) => (
            <Button
              disabled={loading}
              className="w-full md:w-auto rounded-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all duration-300"
              type="button"
            >
              <Download className="w-5 h-5 mr-2" />
              {loading ? "Gerando PDF..." : "Baixar Cardápio em PDF"}
            </Button>
          )}
        </PDFDownloadLink>

        <PDFDownloadLink
          document={<ShoppingListPDF menu={menu} />}
          fileName="lista-de-compras.pdf"
          className="w-full md:w-auto"
        >
          {({ loading }) => (
            <Button
              disabled={loading}
              className="w-full md:w-auto rounded-full bg-gradient-to-r from-accent to-accent-dark hover:opacity-90 transition-all duration-300"
              type="button"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              {loading ? "Gerando PDF..." : "Baixar Lista de Compras em PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
    </>
  );
};