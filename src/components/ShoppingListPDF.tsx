import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Menu } from "@/types/menu";

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  subtitle: { fontSize: 18, marginTop: 15, marginBottom: 10 },
  item: { fontSize: 12, marginBottom: 5, marginLeft: 10 },
  total: { fontSize: 16, marginTop: 20, fontWeight: "bold" },
});

export const ShoppingListPDF = ({ menu }: { menu: Menu }) => {
  // Aggregate ingredients across all meals
  const ingredients = menu.days
    .flatMap((day) => day.meals)
    .flatMap((meal) => meal.ingredients)
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.name);
      if (existing) {
        // Parse quantities to handle numbers and units properly
        const currentQuantity = curr.quantity.match(/(\d+)\s*(\D+)/);
        const existingQuantity = existing.quantity.match(/(\d+)\s*(\D+)/);
        
        if (currentQuantity && existingQuantity && currentQuantity[2] === existingQuantity[2]) {
          // If units match, add the numbers and keep the unit
          const sum = parseInt(currentQuantity[1]) + parseInt(existingQuantity[1]);
          existing.quantity = `${sum} ${currentQuantity[2]}`;
        } else {
          // If units don't match or can't parse, keep as is
          existing.quantity = existing.quantity;
        }
        existing.estimatedCost += curr.estimatedCost;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [] as Array<{ name: string; quantity: string; estimatedCost: number }>);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Lista de Compras</Text>
        <View>
          {ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.item}>
              • {ingredient.name} - {ingredient.quantity} (R$ 
              {ingredient.estimatedCost.toFixed(2)})
            </Text>
          ))}
        </View>
        <Text style={styles.total}>
          Custo Total Estimado: R$ {menu.totalCost.toFixed(2)}
        </Text>
      </Page>
    </Document>
  );
};
