import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Menu } from "@/types/menu";

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  dayTitle: { fontSize: 18, marginTop: 15, marginBottom: 10 },
  mealTitle: { fontSize: 14, marginTop: 10, marginBottom: 5, fontWeight: "bold" },
  text: { fontSize: 12, marginBottom: 5 },
  ingredient: { fontSize: 12, marginLeft: 10 },
});

export const MenuPDF = ({ menu }: { menu: Menu }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Cardápio</Text>
      {menu.days.map((day, index) => (
        <View key={index}>
          <Text style={styles.dayTitle}>{day.day}</Text>
          {day.meals.map((meal, mealIndex) => (
            <View key={mealIndex}>
              <Text style={styles.mealTitle}>{meal.meal}</Text>
              <Text style={styles.text}>{meal.description}</Text>
              {meal.ingredients.map((ingredient, ingredientIndex) => (
                <Text key={ingredientIndex} style={styles.ingredient}>
                  • {ingredient.name} - {ingredient.quantity}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);