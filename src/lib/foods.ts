import type { FoodLibraryItem } from "./types";

/**
 * Common starter foods shown as suggestions in the food picker.
 * Macros are per single serving. When a user logs one of these it gets
 * persisted into their personal library (and remembered going forward).
 * The personal library grows automatically as the user adds new items.
 */
export const DEFAULT_FOODS: Omit<FoodLibraryItem, "id" | "times_used">[] = [
  // ---------- Everyday basics ----------
  { name: "Banana", serving_label: "1 medium", calories: 105, sugar_g: 14, protein_g: 1.3, category: "Fruit" },
  { name: "Apple", serving_label: "1 medium", calories: 95, sugar_g: 19, protein_g: 0.5, category: "Fruit" },
  { name: "Orange", serving_label: "1 medium", calories: 62, sugar_g: 12, protein_g: 1.2, category: "Fruit" },
  { name: "Boiled egg", serving_label: "1 egg", calories: 78, sugar_g: 0.6, protein_g: 6.3, category: "Protein" },
  { name: "Chicken breast", serving_label: "100 g", calories: 165, sugar_g: 0, protein_g: 31, category: "Protein" },
  { name: "White rice", serving_label: "1 cup cooked", calories: 205, sugar_g: 0.1, protein_g: 4.3, category: "Grains" },
  { name: "Roti / Chapati", serving_label: "1 piece", calories: 104, sugar_g: 0.4, protein_g: 3, category: "Grains" },
  { name: "Dal (lentils)", serving_label: "1 cup", calories: 230, sugar_g: 3.5, protein_g: 18, category: "Protein" },
  { name: "Paneer", serving_label: "100 g", calories: 265, sugar_g: 1.2, protein_g: 18, category: "Protein" },
  { name: "Oats", serving_label: "1/2 cup dry", calories: 150, sugar_g: 1, protein_g: 5, category: "Grains" },
  { name: "Milk", serving_label: "1 cup", calories: 103, sugar_g: 12, protein_g: 8, category: "Dairy" },
  { name: "Greek yogurt", serving_label: "1 cup", calories: 100, sugar_g: 6, protein_g: 17, category: "Dairy" },
  { name: "Coffee (with milk)", serving_label: "1 cup", calories: 40, sugar_g: 5, protein_g: 2, category: "Drink" },
  { name: "Tea (with sugar)", serving_label: "1 cup", calories: 50, sugar_g: 10, protein_g: 1, category: "Drink" },
  { name: "Almonds", serving_label: "10 nuts", calories: 70, sugar_g: 0.5, protein_g: 2.6, category: "Snack" },
  { name: "Salad bowl", serving_label: "1 bowl", calories: 120, sugar_g: 6, protein_g: 4, category: "Veg" },
  { name: "Cola can", serving_label: "330 ml", calories: 139, sugar_g: 35, protein_g: 0, category: "Drink" },
  { name: "Chocolate bar", serving_label: "1 bar", calories: 230, sugar_g: 24, protein_g: 3, category: "Snack" },

  // ---------- South Indian regular (home / mess style) ----------
  { name: "Idli", serving_label: "2 pieces", calories: 116, sugar_g: 0.3, protein_g: 4, category: "South Indian" },
  { name: "Plain Dosa", serving_label: "1 dosa", calories: 133, sugar_g: 0.8, protein_g: 2.7, category: "South Indian" },
  { name: "Masala Dosa", serving_label: "1 dosa", calories: 250, sugar_g: 2, protein_g: 5, category: "South Indian" },
  { name: "Rava Dosa", serving_label: "1 dosa", calories: 205, sugar_g: 1.5, protein_g: 4, category: "South Indian" },
  { name: "Set Dosa", serving_label: "3 pieces", calories: 300, sugar_g: 2, protein_g: 8, category: "South Indian" },
  { name: "Uttapam", serving_label: "1 piece", calories: 180, sugar_g: 3, protein_g: 5, category: "South Indian" },
  { name: "Medu Vada", serving_label: "2 pieces", calories: 180, sugar_g: 0.5, protein_g: 5, category: "South Indian" },
  { name: "Ven Pongal", serving_label: "1 bowl", calories: 280, sugar_g: 1, protein_g: 8, category: "South Indian" },
  { name: "Khara Bath / Upma", serving_label: "1 bowl", calories: 230, sugar_g: 2, protein_g: 6, category: "South Indian" },
  { name: "Kesari Bath", serving_label: "1 bowl", calories: 300, sugar_g: 28, protein_g: 4, category: "South Indian" },
  { name: "Lemon Rice", serving_label: "1 bowl", calories: 290, sugar_g: 1, protein_g: 5, category: "South Indian" },
  { name: "Curd Rice", serving_label: "1 bowl", calories: 250, sugar_g: 5, protein_g: 7, category: "South Indian" },
  { name: "Bisi Bele Bath", serving_label: "1 bowl", calories: 320, sugar_g: 3, protein_g: 9, category: "South Indian" },
  { name: "Vangi Bath", serving_label: "1 bowl", calories: 300, sugar_g: 3, protein_g: 6, category: "South Indian" },
  { name: "Puliyogare", serving_label: "1 bowl", calories: 310, sugar_g: 4, protein_g: 6, category: "South Indian" },
  { name: "Ragi Mudde", serving_label: "2 balls", calories: 220, sugar_g: 0.5, protein_g: 5, category: "South Indian" },
  { name: "Akki Rotti", serving_label: "1 piece", calories: 200, sugar_g: 1, protein_g: 4, category: "South Indian" },
  { name: "Neer Dosa", serving_label: "3 pieces", calories: 180, sugar_g: 1, protein_g: 4, category: "South Indian" },
  { name: "Sambar", serving_label: "1 bowl", calories: 130, sugar_g: 4, protein_g: 6, category: "South Indian" },
  { name: "Rasam", serving_label: "1 bowl", calories: 70, sugar_g: 3, protein_g: 3, category: "South Indian" },
  { name: "Coconut Chutney", serving_label: "2 tbsp", calories: 90, sugar_g: 1, protein_g: 1.5, category: "South Indian" },
  { name: "Filter Coffee", serving_label: "1 cup", calories: 90, sugar_g: 10, protein_g: 3, category: "South Indian" },
  { name: "South Indian Veg Meals", serving_label: "1 plate", calories: 650, sugar_g: 8, protein_g: 18, category: "South Indian" },
  { name: "Mysore Pak", serving_label: "1 piece", calories: 180, sugar_g: 16, protein_g: 2, category: "South Indian" },

  // ---------- Bengaluru — Swiggy / Zomato / Dine-in favourites ----------
  { name: "Meghana Foods Chicken Biryani", serving_label: "1 plate", calories: 720, sugar_g: 4, protein_g: 38, category: "Bengaluru", default_source: "swiggy", default_cost: 360 },
  { name: "Nagarjuna Andhra Meals", serving_label: "1 plate", calories: 850, sugar_g: 6, protein_g: 28, category: "Bengaluru", default_source: "dinein", default_cost: 400 },
  { name: "Empire Chicken Kebab", serving_label: "1 plate", calories: 480, sugar_g: 2, protein_g: 35, category: "Bengaluru", default_source: "zomato", default_cost: 280 },
  { name: "Empire Butter Chicken + Rumali", serving_label: "1 combo", calories: 780, sugar_g: 8, protein_g: 36, category: "Bengaluru", default_source: "swiggy", default_cost: 420 },
  { name: "CTR Benne Masala Dosa", serving_label: "1 dosa", calories: 420, sugar_g: 2, protein_g: 7, category: "Bengaluru", default_source: "dinein", default_cost: 90 },
  { name: "Vidyarthi Bhavan Masala Dosa", serving_label: "1 dosa", calories: 400, sugar_g: 2, protein_g: 7, category: "Bengaluru", default_source: "dinein", default_cost: 85 },
  { name: "MTR Rava Idli", serving_label: "2 pieces", calories: 260, sugar_g: 2, protein_g: 7, category: "Bengaluru", default_source: "dinein", default_cost: 120 },
  { name: "Brahmin's Idli Vada", serving_label: "1 plate", calories: 300, sugar_g: 1, protein_g: 8, category: "Bengaluru", default_source: "dinein", default_cost: 70 },
  { name: "Truffles Burger", serving_label: "1 burger", calories: 650, sugar_g: 8, protein_g: 30, category: "Bengaluru", default_source: "zomato", default_cost: 320 },
  { name: "Corner House Death by Chocolate", serving_label: "1 sundae", calories: 600, sugar_g: 55, protein_g: 9, category: "Bengaluru", default_source: "dinein", default_cost: 280 },
  { name: "Veena Stores Idli", serving_label: "2 pieces", calories: 150, sugar_g: 0.5, protein_g: 5, category: "Bengaluru", default_source: "dinein", default_cost: 50 },
  { name: "Sri Sairam Donne Biryani", serving_label: "1 donne", calories: 700, sugar_g: 3, protein_g: 32, category: "Bengaluru", default_source: "swiggy", default_cost: 250 },
  { name: "A2B Veg Thali", serving_label: "1 thali", calories: 780, sugar_g: 10, protein_g: 20, category: "Bengaluru", default_source: "swiggy", default_cost: 300 },
  { name: "Domino's Margherita Pizza", serving_label: "1 medium", calories: 800, sugar_g: 10, protein_g: 28, category: "Bengaluru", default_source: "zomato", default_cost: 350 },
  { name: "Filter Coffee (cafe)", serving_label: "1 cup", calories: 110, sugar_g: 12, protein_g: 3, category: "Bengaluru", default_source: "dinein", default_cost: 40 },
];

