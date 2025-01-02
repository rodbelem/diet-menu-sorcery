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

  // Agrupa ingredientes e soma suas quantidades
  const groupedIngredients = menu.days.flatMap(day =>
    day.meals.flatMap(meal =>
      meal.ingredients.map(ingredient => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
      }))
    )
  ).reduce((acc, curr) => {
    const existingIngredient = acc.find(item => item.name === curr.name);
    if (existingIngredient) {
      // Se a quantidade já inclui uma unidade de medida, apenas agrupe sem somar
      if (isNaN(parseFloat(curr.quantity))) {
        existingIngredient.quantities.add(curr.quantity);
      } else {
        // Se for um número, tente somar
        const currentNum = parseFloat(curr.quantity);
        const unit = curr.quantity.replace(/[\d.]/g, '').trim();
        existingIngredient.total += currentNum;
        existingIngredient.unit = unit;
      }
    } else {
      const quantity = curr.quantity;
      const numericValue = parseFloat(quantity);
      if (isNaN(numericValue)) {
        // Se não for um número, apenas armazene como string
        acc.push({
          name: curr.name,
          quantities: new Set([quantity]),
          total: 0,
          unit: ''
        });
      } else {
        // Se for um número, extraia a unidade e o valor
        const unit = quantity.replace(/[\d.]/g, '').trim();
        acc.push({
          name: curr.name,
          quantities: new Set(),
          total: numericValue,
          unit: unit
        });
      }
    }
    return acc;
  }, [] as Array<{
    name: string;
    quantities: Set<string>;
    total: number;
    unit: string;
  }>);

  const sortedIngredients = groupedIngredients
    .map(ingredient => ({
      name: ingredient.name,
      displayQuantity: ingredient.total > 0
        ? `${ingredient.total}${ingredient.unit}`
        : Array.from(ingredient.quantities).join(', ')
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
              {sortedIngredients.map(({ name, displayQuantity }) => (
                <div
                  key={name}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-white shadow-sm"
                >
                  <Checkbox
                    id={name}
                    checked={checkedItems[name] || false}
                    onCheckedChange={() => handleCheckItem(name)}
                  />
                  <Label
                    htmlFor={name}
                    className={`flex-grow cursor-pointer ${
                      checkedItems[name] ? "line-through text-gray-400" : ""
                    }`}
                  >
                    <span className="font-medium">{name}</span>
                    <span className="ml-2 text-gray-600">({displayQuantity})</span>
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