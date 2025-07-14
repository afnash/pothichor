import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { queryMeals } from '../services/gemini';
import { Meal } from '../types';

export default function AskGemini() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Meal[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);

  useEffect(() => {
    fetchAllMeals();
  }, []);

  const fetchAllMeals = async () => {
    try {
      const mealsRef = collection(db, 'meals');
      const querySnapshot = await getDocs(mealsRef);
      const fetchedMeals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        pickupTime: doc.data().pickupTime.toDate(),
        orderDeadline: doc.data().orderDeadline.toDate()
      })) as Meal[];
      setAllMeals(fetchedMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const matchedMeals = await queryMeals(query, allMeals);
      setResults(matchedMeals);
    } catch (error) {
      console.error('Error querying meals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Ask Gemini</h1>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Where can I get maximum protein today? or Which is the cheapest lunch?"
              className="flex-1 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {results.map((meal) => (
            <div
              key={meal.id}
              className="border dark:border-gray-700 rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold mb-2">{meal.mealTitle}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Price</p>
                  <p className="font-medium">Rs. {meal.price}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Protein</p>
                  <p className="font-medium">{meal.totalProtein}g</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Calories</p>
                  <p className="font-medium">{meal.totalCalories}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium">{meal.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Food Items:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                  {meal.foodItems.map((item, index) => (
                    <li key={index}>{item.name}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>Pickup: {meal.pickupTime.toLocaleString()}</p>
                <p>Order by: {meal.orderDeadline.toLocaleString()}</p>
              </div>
            </div>
          ))}

          {query && !loading && results.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No meals found matching your query
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 