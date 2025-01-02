import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, ShoppingBag } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { MenuPDF } from "@/components/MenuPDF";
import { ShoppingListPDF } from "@/components/ShoppingListPDF";
import { Menu } from "@/types/menu";
import React from "react";

interface MenuDisplayProps {
  menu: Menu;
  onRegenerateMeal: (dayIndex: number, mealIndex: number, mealType: string) => void;
  regeneratingMeal: string | null;
}

export const MenuDisplay = ({ menu, onRegenerateMeal, regeneratingMeal }: MenuDisplayProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4">
          <PDFDownloadLink
            document={<MenuPDF menu={menu} />}
            fileName="cardapio.pdf"
          >
            {({ loading }) => (
              <div>
                <Button disabled={loading} className="gap-2">
                  <Download className="w-4 h-4" />
                  {loading ? "Gerando PDF..." : "Baixar Cardápio"}
                </Button>
              </div>
            )}
          </PDFDownloadLink>

          <PDFDownloadLink
            document={<ShoppingListPDF menu={menu} />}
            fileName="lista-compras.pdf"
          >
            {({ loading }) => (
              <div>
                <Button disabled={loading} variant="outline" className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  {loading ? "Gerando PDF..." : "Lista de Compras"}
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
              <h2 className="text-xl font-bold mb-4">{day.day}</h2>
              <div className="space-y-4">
                {day.meals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">{meal.meal}</h3>
                      <Button
                        onClick={() => onRegenerateMeal(dayIndex, mealIndex, meal.meal)}
                        disabled={regeneratingMeal === `${dayIndex}-${mealIndex}`}
                        variant="outline"
                        size="sm"
                      >
                        {regeneratingMeal === `${dayIndex}-${mealIndex}` ? (
                          <RefreshCw className="animate-spin w-4 h-4" />
                        ) : (
                          "Regenerar"
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-600 mb-2">{meal.description}</p>
                    <div className="space-y-1">
                      {meal.ingredients.map((ingredient, index) => (
                        <div key={index} className="text-sm text-gray-500 flex justify-between">
                          <span>{ingredient.name}</span>
                          <span>{ingredient.quantity}</span>
                        </div>
                      ))}
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