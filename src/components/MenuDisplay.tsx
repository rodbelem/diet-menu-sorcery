import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShoppingBag, FileDown } from "lucide-react";
import { Menu } from "@/types/menu";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MenuPDF } from "./MenuPDF";
import React from "react";

interface MenuDisplayProps {
  menu: Menu;
  onRegenerateMeal: (dayIndex: number, mealIndex: number, mealType: string) => void;
  regeneratingMeal: string | null;
}

export const MenuDisplay = ({ menu, onRegenerateMeal, regeneratingMeal }: MenuDisplayProps) => {
  const navigate = useNavigate();

  if (!menu?.days?.length) {
    return null;
  }

  const handleShoppingListClick = () => {
    navigate("/lista-compras", { state: { menu } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleShoppingListClick}
            className="flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Lista de Compras
          </Button>
          <PDFDownloadLink
            document={<MenuPDF menu={menu} />}
            fileName="cardapio.pdf"
          >
            {({ loading }) => (
              <div>
                <Button
                  variant="outline"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  {loading ? "Gerando PDF..." : "Baixar Cardápio PDF"}
                </Button>
              </div>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Refeições</CardTitle>
        </CardHeader>
        <CardContent>
          {menu.days.map((day, dayIndex) => (
            <div key={dayIndex} className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-black bg-nutri-green p-3 rounded-md">
                {day.day}
              </h2>
              <div className="space-y-4">
                {day.meals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="bg-white p-4 rounded-lg shadow-nutri">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-primary">{meal.meal}</h3>
                      <Button
                        onClick={() => onRegenerateMeal(dayIndex, mealIndex, meal.meal)}
                        disabled={regeneratingMeal === `${dayIndex}-${mealIndex}`}
                        variant="outline"
                        size="sm"
                      >
                        {regeneratingMeal === `${dayIndex}-${mealIndex}` ? (
                          <RefreshCw className="animate-spin w-4 h-4" />
                        ) : (
                          "Gerar outra opção"
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-600 mb-4">{meal.description}</p>
                    <div className="bg-nutri-gray p-3 rounded-md">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredientes:</h4>
                      <div className="space-y-2">
                        {meal.ingredients.map((ingredient, index) => (
                          <div key={index} className="text-sm text-gray-600 flex justify-between items-center">
                            <span>{ingredient.name}</span>
                            <span className="text-black">{ingredient.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};