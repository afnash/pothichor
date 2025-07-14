import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { Meal } from '../types';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import { sendOrderConfirmation, schedulePickupReminder } from '../services/emailService';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableMeals();
  }, []);

  const fetchAvailableMeals = async () => {
    try {
      setError(null);
      const mealsRef = collection(db, 'meals');
      const now = new Date();
      
      // Get all available meals ordered by pickup time
      const q = query(
        mealsRef,
        where('isAvailable', '==', true),
        where('orderDeadline', '>', now),
        orderBy('orderDeadline', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Total meals found:', querySnapshot.size);
      
      const fetchedMeals = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Meal data:', data);
        
        // Convert Firestore Timestamps to JavaScript Dates
        const pickupTime = data.pickupTime instanceof Timestamp 
          ? data.pickupTime.toDate() 
          : new Date(data.pickupTime);
          
        const orderDeadline = data.orderDeadline instanceof Timestamp
          ? data.orderDeadline.toDate()
          : new Date(data.orderDeadline);

        return {
          id: doc.id,
          ...data,
          pickupTime,
          orderDeadline
        } as Meal;
      });

      console.log('Processed meals:', fetchedMeals);
      setMeals(fetchedMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setError('Failed to fetch meals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (meal: Meal) => {
    setSelectedMeal(meal);
  };

  const handleOrderConfirm = async () => {
    if (!currentUser || !selectedMeal) return;

    try {
      setLoading(true);
      setError(null);

      // Create order
      await addDoc(collection(db, 'orders'), {
        studentId: currentUser.uid,
        mealId: selectedMeal.id,
        createdAt: Timestamp.now()
      });

      // Update meal's ordersAccepted count
      const mealRef = doc(db, 'meals', selectedMeal.id!);
      const newOrdersAccepted = selectedMeal.ordersAccepted + 1;
      const isAvailable = newOrdersAccepted < selectedMeal.quantityPrepared;

      await updateDoc(mealRef, {
        ordersAccepted: newOrdersAccepted,
        isAvailable
      });

      // Send confirmation email and schedule reminder
      // Don't throw errors if these fail
      await sendOrderConfirmation(currentUser.email!, selectedMeal).catch(error => {
        console.error('Email confirmation failed:', error);
      });
      
      await schedulePickupReminder(currentUser.email!, selectedMeal).catch(error => {
        console.error('Reminder scheduling failed:', error);
      });

      // Reset selected meal
      setSelectedMeal(null);

      // Navigate to My Orders page
      navigate('/my-orders');

      // Refresh meals list
      fetchAvailableMeals();
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCancel = () => {
    setSelectedMeal(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
        Available Meals
      </h1>

      {error && (
        <GlassCard className="bg-red-50/50 mb-6 p-4">
          <p className="text-red-700 flex items-center">
            <span className="material-icons-outlined mr-2">error</span>
            {error}
          </p>
        </GlassCard>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 grid-cols-1 md:grid-cols-2"
      >
        {meals.map((meal) => (
          <GlassCard
            key={meal.id}
            className="p-6 transform hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                  {meal.mealTitle}
                </h2>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">schedule</span>
                    Pickup: {meal.pickupTime.toLocaleString()}
                  </p>
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">event</span>
                    Order by: {meal.orderDeadline.toLocaleString()}
                  </p>
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">payments</span>
                    Rs. {meal.price}
                  </p>
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">people</span>
                    {meal.quantityPrepared - meal.ordersAccepted} slots left
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200 flex items-center">
                <span className="material-icons-outlined text-lg mr-2">restaurant_menu</span>
                Food Items
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                {meal.foodItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center text-gray-600 dark:text-gray-300"
                  >
                    <span className="material-icons-outlined text-amber-500 text-sm mr-2">
                      lunch_dining
                    </span>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleOrderClick(meal)}
                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                disabled={loading}
              >
                <span className="material-icons-outlined">shopping_cart</span>
                <span>{loading ? 'Ordering...' : 'Order Now'}</span>
              </button>
            </div>
          </GlassCard>
        ))}

        {meals.length === 0 && !error && (
          <GlassCard className="col-span-full py-12 text-center">
            <span className="material-icons-outlined text-4xl text-gray-400 mb-3">
              restaurant
            </span>
            <p className="text-gray-600 dark:text-gray-400">
              No meals available at the moment. Check back later!
            </p>
          </GlassCard>
        )}
      </motion.div>

      {selectedMeal && (
        <OrderConfirmationModal
          meal={selectedMeal}
          onConfirm={handleOrderConfirm}
          onCancel={handleOrderCancel}
        />
      )}
    </motion.div>
  );
} 