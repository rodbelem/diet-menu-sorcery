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
    marginBottom: 10, 
    textAlign: "center",
    color: "#4CAF50",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
    color: "#666666",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: "#2E7D32",
    fontWeight: "bold",
    backgroundColor: "#E8F5E9",
    padding: 5,
    borderRadius: 4,
  },
  itemsContainer: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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

const normalizeQuantity = (quantity: string): string => {
  // Remove espaços extras
  quantity = quantity.trim();
  
  // Converte frações comuns
  quantity = quantity.replace('1/2', '½')
    .replace('1/4', '¼')
    .replace('3/4', '¾');

  // Padroniza unidades de medida
  quantity = quantity.replace('colher de sopa', 'colheres de sopa')
    .replace('colher de chá', 'colheres de chá')
    .replace('xícara', 'xícaras')
    .replace('unidade', 'unidades')
    .replace('ml', 'mL')
    .replace('g', 'g');

  // Ajusta quantidades para unidades de mercado
  if (quantity.includes('g') && !quantity.includes('kg')) {
    const grams = parseInt(quantity);
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1)}kg`;
    }
  }

  return quantity;
};

const groupIngredientsByCategory = (ingredients: Array<{ name: string; quantity: string; estimatedCost: number }>) => {
  const categories = {
    'Hortifruti': ['tomate', 'cebola', 'alho', 'batata', 'cenoura', 'banana', 'maçã', 'laranja', 'limão', 'abacaxi', 'melão', 'melancia'],
    'Carnes e Ovos': ['frango', 'carne', 'peixe', 'ovo', 'filé'],
    'Laticínios': ['leite', 'queijo', 'iogurte', 'requeijão'],
    'Mercearia': ['arroz', 'feijão', 'macarrão', 'pão', 'farinha', 'açúcar', 'café', 'azeite', 'óleo'],
  };

  const grouped = {
    'Hortifruti': [],
    'Carnes e Ovos': [],
    'Laticínios': [],
    'Mercearia': [],
    'Outros': [],
  } as Record<string, typeof ingredients>;

  ingredients.forEach(ingredient => {
    let categorized = false;
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => ingredient.name.toLowerCase().includes(keyword))) {
        grouped[category].push({
          ...ingredient,
          quantity: normalizeQuantity(ingredient.quantity)
        });
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      grouped['Outros'].push({
        ...ingredient,
        quantity: normalizeQuantity(ingredient.quantity)
      });
    }
  });

  return grouped;
};

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

  const groupedIngredients = groupIngredientsByCategory(ingredients);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Lista de Compras</Text>
        <Text style={styles.subtitle}>
          Lista organizada por seções do supermercado para facilitar suas compras
        </Text>

        {Object.entries(groupedIngredients).map(([category, items]) => 
          items.length > 0 && (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category}</Text>
              <View style={styles.itemsContainer}>
                {items.map((ingredient, index) => (
                  <View key={index} style={styles.item}>
                    <View style={styles.bullet} />
                    <Text style={styles.itemText}>
                      {ingredient.name} - {ingredient.quantity} (R$ {ingredient.estimatedCost.toFixed(2)})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )
        )}

        <Text style={styles.total}>
          Custo Total Estimado: R$ {menu.totalCost.toFixed(2)}
        </Text>
      </Page>
    </Document>
  );
};