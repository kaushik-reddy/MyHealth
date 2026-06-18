import type { FoodLibraryItem } from "./types";

/**
 * Common starter foods shown as suggestions in the food picker.
 * Macros are per single serving. When a user logs one of these it gets
 * persisted into their personal library (and remembered going forward).
 */
export const DEFAULT_FOODS: Omit<FoodLibraryItem, "id" | "times_used">[] = [
  { name: "Banana", serving_label: "1 medium", calories: 105, sugar_g: 14, protein_g: 1.3, category: "Fruit" },
  { name: "Apple", serving_label: "1 medium", calories: 95, sugar_g: 19, protein_g: 0.5, category: "Fruit" },
  { name: "Orange", serving_label: "1 medium", calories: 62, sugar_g: 12, protein_g: 1.2, category: "Fruit" },
  { name: "Boiled egg", serving_label: "1 egg", calories: 78, sugar_g: 0.6, protein_g: 6.3, category: "Protein" },
  { name: "Chicken breast", serving_label: "100 g", calories: 165, sugar_g: 0, protein_g: 31, category: "Protein" },
  { name: "White rice", serving_label: "1 cup cooked", calories: 205, sugar_g: 0.1, protein_g: 4.3, category: "Grains" },
  { name: "Roti / Chapati", serving_label: "1 piece", calories: 104, sugar_g: 0.4, protein_g: 3, category: "Grains" },
  { name: "Dal (lentils)", serving_label: "1 cup", calories: 230, sugar_g: 3.5, protein_g: 18, category: "Protein" },
  { name: "Paneer", serving_label: "100 g", calories: 265, sugar_g: 1.2, protein_g: 18, category: "Protein" },
  { name: "Idli", serving_label: "2 pieces", calories: 116, sugar_g: 0.3, protein_g: 4, category: "Grains" },
  { name: "Dosa", serving_label: "1 plain", calories: 133, sugar_g: 0.8, protein_g: 2.7, category: "Grains" },
  { name: "Oats", serving_label: "1/2 cup dry", calories: 150, sugar_g: 1, protein_g: 5, category: "Grains" },
  { name: "Milk", serving_label: "1 cup", calories: 103, sugar_g: 12, protein_g: 8, category: "Dairy" },
  { name: "Greek yogurt", serving_label: "1 cup", calories: 100, sugar_g: 6, protein_g: 17, category: "Dairy" },
  { name: "Coffee (with milk)", serving_label: "1 cup", calories: 40, sugar_g: 5, protein_g: 2, category: "Drink" },
  { name: "Tea (with sugar)", serving_label: "1 cup", calories: 50, sugar_g: 10, protein_g: 1, category: "Drink" },
  { name: "Almonds", serving_label: "10 nuts", calories: 70, sugar_g: 0.5, protein_g: 2.6, category: "Snack" },
  { name: "Salad bowl", serving_label: "1 bowl", calories: 120, sugar_g: 6, protein_g: 4, category: "Veg" },
  { name: "Cola can", serving_label: "330 ml", calories: 139, sugar_g: 35, protein_g: 0, category: "Drink" },
  { name: "Chocolate bar", serving_label: "1 bar", calories: 230, sugar_g: 24, protein_g: 3, category: "Snack" },
];
