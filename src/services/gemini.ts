import { GoogleGenerativeAI } from '@google/generative-ai';
import { Meal } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

interface NutritionInfo {
  protein: number;
  calories: number;
  tags: string[];
}

export const analyzeNutrition = async (foodItem: string): Promise<NutritionInfo> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Analyze the following food item and provide its nutritional information in a structured format:
  Food Item: ${foodItem}
  
  Please provide:
  1. Approximate protein content in grams
  2. Approximate calories
  3. Tags (e.g., veg, non-veg, gluten-free, etc.)
  
  Respond in JSON format only.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error analyzing nutrition:', error);
    return {
      protein: 0,
      calories: 0,
      tags: []
    };
  }
};

export const queryMeals = async (query: string, meals: Meal[]): Promise<Meal[]> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Given the following meals and a user query, return the IDs of the most relevant meals that match the query.
  
  Query: "${query}"
  
  Meals:
  ${JSON.stringify(meals, null, 2)}
  
  Return only an array of meal IDs in JSON format.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const relevantIds = JSON.parse(text);
    return meals.filter(meal => relevantIds.includes(meal.id));
  } catch (error) {
    console.error('Error querying meals:', error);
    return [];
  }
}; 