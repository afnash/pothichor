import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { analyzeNutrition } from '../services/gemini';
import { Meal, FoodItem, PastOrder } from '../types';

interface MealFormData {
  mealTitle: string;
  price: string;
  pickupTime: string;
  pickupTimeHour: string;
  orderDeadline: string;
  orderDeadlineHour: string;
  quantityPrepared: string;
  foodItems: string[];
}

export default function HouseDashboard() {
  const { currentUser } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Set default dates
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defaultOrderDeadline = today.toISOString().slice(0, 10); // Just the date part 'YYYY-MM-DD'
  const defaultPickupTime = today.toISOString().slice(0, 10); // Just the date part 'YYYY-MM-DD'

  const [formData, setFormData] = useState<MealFormData>({
    mealTitle: '',
    price: '',
    pickupTime: defaultPickupTime,
    pickupTimeHour: '',
    orderDeadline: defaultOrderDeadline,
    orderDeadlineHour: '',
    quantityPrepared: '',
    foodItems: ['']
  });

  useEffect(() => {
    fetchMeals();
    fetchPastOrders();
    // Check for completed orders every minute
    const interval = setInterval(checkCompletedOrders, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchMeals = async () => {
    try {
      const mealsRef = collection(db, 'meals');
      const q = query(mealsRef, where('houseId', '==', currentUser?.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedMeals = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          pickupTime: data.pickupTime instanceof Timestamp 
            ? data.pickupTime.toDate() 
            : new Date(data.pickupTime),
          orderDeadline: data.orderDeadline instanceof Timestamp
            ? data.orderDeadline.toDate()
            : new Date(data.orderDeadline)
        };
      }) as Meal[];

      console.log('Fetched meals:', fetchedMeals);
      setMeals(fetchedMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPastOrders = async () => {
    try {
      const pastOrdersRef = collection(db, 'pastOrders');
      const q = query(
        pastOrdersRef,
        where('houseId', '==', currentUser?.uid),
        orderBy('pickupTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PastOrder[];

      setPastOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching past orders:', error);
    }
  };

  const checkCompletedOrders = async () => {
    const now = new Date();
    const completedMeals = meals.filter(meal => {
      const pickupTimePlusHour = new Date(meal.pickupTime.getTime() + 60 * 60000);
      return pickupTimePlusHour <= now && meal.isAvailable;
    });

    for (const meal of completedMeals) {
      try {
        // Add to past orders
        await addDoc(collection(db, 'pastOrders'), {
          houseId: meal.houseId,
          mealTitle: meal.mealTitle,
          pickupTime: Timestamp.fromDate(meal.pickupTime),
          totalOrders: meal.ordersAccepted,
          totalRevenue: meal.price * meal.ordersAccepted,
          foodItems: meal.foodItems.map(item => item.name)
        });

        // Update meal availability in Firestore
        await updateDoc(doc(db, 'meals', meal.id!), {
          isAvailable: false
        });

        // Update local state
        const updatedMeals = meals.map(m => 
          m.id === meal.id ? { ...m, isAvailable: false } : m
        );
        setMeals(updatedMeals);
      } catch (error) {
        console.error('Error processing completed order:', error);
      }
    }

    // Refresh past orders
    fetchPastOrders();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFoodItemChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      foodItems: prev.foodItems.map((item, i) => (i === index ? value : item))
    }));
  };

  const addFoodItem = () => {
    setFormData(prev => ({
      ...prev,
      foodItems: [...prev.foodItems, '']
    }));
  };

  const removeFoodItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      foodItems: prev.foodItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);

      // Combine date and time
      const pickupTime = new Date(`${formData.pickupTime}T${formData.pickupTimeHour}`);
      const orderDeadline = new Date(`${formData.orderDeadline}T${formData.orderDeadlineHour}`);
      const now = new Date();

      // Validate dates
      if (orderDeadline <= now) {
        alert('Order deadline must be in the future');
        return;
      }

      if (pickupTime <= orderDeadline) {
        alert('Pickup time must be after order deadline');
        return;
      }

      // Create food items array with nutrition info
      const foodItemsWithNutrition = await Promise.all(
        formData.foodItems.filter(item => item.trim()).map(async (name) => {
          const nutrition = await analyzeNutrition(name);
          return {
            name,
            ...nutrition
          } as FoodItem;
        })
      );

      // Calculate total nutrition values
      const totalCalories = foodItemsWithNutrition.reduce((sum, item) => sum + (item.calories || 0), 0);
      const totalProtein = foodItemsWithNutrition.reduce((sum, item) => sum + (item.protein || 0), 0);
      const isVeg = foodItemsWithNutrition.every(item => item.isVeg);

      // Create new meal
      const mealData = {
        houseId: currentUser.uid,
        mealTitle: formData.mealTitle,
        price: Number(formData.price),
        pickupTime: Timestamp.fromDate(pickupTime),
        orderDeadline: Timestamp.fromDate(orderDeadline),
        quantityPrepared: Number(formData.quantityPrepared),
        ordersAccepted: 0,
        isAvailable: true,
        foodItems: foodItemsWithNutrition,
        totalCalories,
        totalProtein,
        isVeg,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'meals'), mealData);

      // Reset form
      setFormData({
        mealTitle: '',
        price: '',
        pickupTime: defaultPickupTime,
        pickupTimeHour: '',
        orderDeadline: defaultOrderDeadline,
        orderDeadlineHour: '',
        quantityPrepared: '',
        foodItems: ['']
      });
      setShowForm(false);
      fetchMeals();
    } catch (error) {
      console.error('Error creating meal:', error);
      alert('Failed to create meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">House Dashboard</h1>
      
      {/* Add Meal Button/Form */}
      <div className="mb-8">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            + Add New Meal
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="mealTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meal Title
                </label>
                <input
                  type="text"
                  id="mealTitle"
                  name="mealTitle"
                  value={formData.mealTitle}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (Rs.)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pickup Date
                </label>
                <input
                  type="date"
                  id="pickupTime"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="pickupTimeHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pickup Time
                </label>
                <input
                  type="time"
                  id="pickupTimeHour"
                  name="pickupTimeHour"
                  value={formData.pickupTimeHour}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="orderDeadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order Deadline Date
                </label>
                <input
                  type="date"
                  id="orderDeadline"
                  name="orderDeadline"
                  value={formData.orderDeadline}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="orderDeadlineHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Order Deadline Time
                </label>
                <input
                  type="time"
                  id="orderDeadlineHour"
                  name="orderDeadlineHour"
                  value={formData.orderDeadlineHour}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label htmlFor="quantityPrepared" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantity Available
                </label>
                <input
                  type="number"
                  id="quantityPrepared"
                  name="quantityPrepared"
                  value={formData.quantityPrepared}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Food Items</label>
                {formData.foodItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleFoodItemChange(index, e.target.value)}
                      placeholder="Enter food item"
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeFoodItem(index)}
                      className="px-2 py-1 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFoodItem}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Food Item
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Meal'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active Meals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold p-6 border-b dark:border-gray-700">Active Meals</h2>
        <div className="divide-y dark:divide-gray-700">
          {meals.filter(meal => meal.isAvailable).map((meal) => (
            <div key={meal.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{meal.mealTitle}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rs. {meal.price} • {meal.ordersAccepted}/{meal.quantityPrepared} orders
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pickup: {meal.pickupTime.toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Food Items:</span>
                    <ul className="mt-1 space-y-1">
                      {meal.foodItems.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                          • {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-sm rounded bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
            </div>
          ))}
          {meals.filter(meal => meal.isAvailable).length === 0 && (
            <p className="p-6 text-center text-gray-500 dark:text-gray-400">
              No active meals
            </p>
          )}
        </div>
      </div>

      {/* Past Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold p-6 border-b dark:border-gray-700">Past Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Meal Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pastOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {order.mealTitle}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.foodItems.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.pickupTime.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.totalOrders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    Rs. {order.totalRevenue}
                  </td>
                </tr>
              ))}
              {pastOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No past orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 