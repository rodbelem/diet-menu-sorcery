import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Menu } from "@/types/menu";

const styles = StyleSheet.create({
  page: { 
    padding: 30,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    textAlign: "center",
    color: "#4CAF50",
    fontWeight: "bold",
  },
  itemsContainer: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  item: { 
    fontSize: 12,
    marginBottom: 8,
    color: "#666666",
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 4,
    height: 4,
    marginRight: 5,
    backgroundColor: "#81C784",
  },
  itemText: {
    flex: 1,
  },
  total: { 
    fontSize: 16,
    marginTop: 20,
    color: "#4CAF50",
    fontWeight: "bold",
    backgroundColor: "#FEF7CD",
    padding: 15,
    borderRadius: 4,
    textAlign: "center",
  },
});

export const ShoppingListPDF = ({ menu }: { menu: Menu }) => {
  const ingredients = menu.days
    .flatMap((day) => day.meals)
    .flatMap((meal) => meal.ingredients)
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.name);
      if (existing) {
        const currentQuantity = curr.quantity.match(/(\d+)\s*(\D+)/);
        const existingQuantity = existing.quantity.match(/(\d+)\s*(\D+)/);
        
        if (currentQuantity && existingQuantity && currentQuantity[2] === existingQuantity[2]) {
          const sum = parseInt(currentQuantity[1]) + parseInt(existingQuantity[1]);
          existing.quantity = `${sum} ${currentQuantity[2]}`;
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
        <View style={styles.itemsContainer}>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.bullet} />
              <Text style={styles.itemText}>
                {ingredient.name} - {ingredient.quantity} (R$ {ingredient.estimatedCost.toFixed(2)})
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.total}>
          Custo Total Estimado: R$ {menu.totalCost.toFixed(2)}
        </Text>
      </Page>
    </Document>
  );
};