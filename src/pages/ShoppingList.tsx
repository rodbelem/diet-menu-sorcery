import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Menu } from "@/types/menu";

const ShoppingList = () => {
  const location = useLocation();
  const menu: Menu = location.state?.menu;
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  if (!menu) {
    return (
      <div className="min-h-screen bg-nutri-gray p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Lista de compras não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agrupa ingredientes únicos de todas as refeições
  const uniqueIngredients = Array.from(
    new Set(
      menu.days.flatMap(day =>
        day.meals.flatMap(meal =>
          meal.ingredients.map(ingredient => ingredient.name)
        )
      )
    )
  ).sort();

  const handleCheckItem = (ingredient: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  return (
    <div className="min-h-screen bg-nutri-gray p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-nutri overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Lista de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uniqueIngredients.map((ingredient) => (
                <div
                  key={ingredient}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white shadow-sm"
                >
                  <Checkbox
                    id={ingredient}
                    checked={checkedItems[ingredient] || false}
                    onCheckedChange={() => handleCheckItem(ingredient)}
                  />
                  <Label
                    htmlFor={ingredient}
                    className={`flex-grow cursor-pointer ${
                      checkedItems[ingredient] ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {ingredient}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShoppingList;