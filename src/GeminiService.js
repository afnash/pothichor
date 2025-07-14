export async function analyzeNutrition(items) {
    return items.map(item => ({
      name: item,
      protein: Math.floor(Math.random() * 15),
      calories: Math.floor(Math.random() * 300),
      tags: item.toLowerCase().includes("egg") ? ["non-veg"] : ["veg"]
    }));
  }
