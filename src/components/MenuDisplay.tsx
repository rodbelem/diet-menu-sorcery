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
              <Button disabled={loading} className="gap-2">
                <Download className="w-4 h-4" />
                {loading ? "Gerando PDF..." : "Baixar Cardápio"}
              </Button>
            )}
          </PDFDownloadLink>

          <PDFDownloadLink
            document={<ShoppingListPDF menu={menu} />}
            fileName="lista-compras.pdf"
          >
            {({ loading }) => (
              <Button disabled={loading} variant="outline" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                {loading ? "Gerando PDF..." : "Lista de Compras"}
              </Button>
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
            <div key={dayIndex} className="mb-4">
              <h2 className="text-xl font-bold">{day.day}</h2>
              <div className="space-y-2">
                {day.meals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="flex justify-between items-center">
                    <span>{meal.meal}</span>
                    <Button
                      onClick={() => onRegenerateMeal(dayIndex, mealIndex, meal.meal)}
                      disabled={regeneratingMeal === `${dayIndex}-${mealIndex}`}
                      variant="outline"
                    >
                      {regeneratingMeal === `${dayIndex}-${mealIndex}` ? (
                        <RefreshCw className="animate-spin w-4 h-4" />
                      ) : (
                        "Regenerar"
                      )}
                    </Button>
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