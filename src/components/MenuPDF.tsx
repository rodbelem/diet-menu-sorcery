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
  dayCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
  },
  dayTitle: { 
    fontSize: 18, 
    marginBottom: 15,
    color: "#388E3C",
    backgroundColor: "#F2FCE2",
    padding: 10,
    borderRadius: 4,
  },
  mealContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  mealTitle: { 
    fontSize: 14, 
    marginBottom: 8,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  description: { 
    fontSize: 12, 
    marginBottom: 10,
    color: "#666666",
  },
  ingredientsTitle: {
    fontSize: 12,
    marginBottom: 5,
    color: "#666666",
    fontWeight: "bold",
  },
  ingredient: { 
    fontSize: 11,
    marginBottom: 3,
    marginLeft: 10,
    color: "#666666",
    flexDirection: 'row',
  },
  bullet: {
    width: 4,
    height: 4,
    marginRight: 5,
    backgroundColor: "#81C784",
  },
});

export const MenuPDF = ({ menu }: { menu: Menu }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Cardápio</Text>
      {menu.days.map((day, index) => (
        <View key={index} style={styles.dayCard}>
          <Text style={styles.dayTitle}>{day.day}</Text>
          {day.meals.map((meal, mealIndex) => (
            <View key={mealIndex} style={styles.mealContainer}>
              <Text style={styles.mealTitle}>{meal.meal}</Text>
              <Text style={styles.description}>{meal.description}</Text>
              <Text style={styles.ingredientsTitle}>Ingredientes:</Text>
              {meal.ingredients.map((ingredient, ingredientIndex) => (
                <View key={ingredientIndex} style={styles.ingredient}>
                  <View style={styles.bullet} />
                  <Text>
                    {ingredient.name} - {ingredient.quantity}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);