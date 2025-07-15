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
  orderBy,
  getDoc,
  arrayUnion
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
      
      // Get all meals with future deadlines
      const q = query(
        mealsRef,
        where('orderDeadline', '>', now),
        orderBy('orderDeadline', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Fetch house details for each meal
      const mealsWithHouseDetails = await Promise.all(querySnapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        
        // Fetch house user details
        const houseRef = doc(db, 'users', data.houseId);
        const houseDoc = await getDoc(houseRef);
        const houseData = houseDoc.data() || {};
        const houseName = typeof houseData.email === 'string' ? houseData.email.split('@')[0] : 'Unknown House';
        
        return {
          id: docSnapshot.id,
          ...data,
          houseName,
          houseLocation: houseData.location,
          housePhone: houseData.phoneNumber,
          pickupTime: data.pickupTime instanceof Timestamp 
            ? data.pickupTime.toDate() 
            : new Date(data.pickupTime),
          orderDeadline: data.orderDeadline instanceof Timestamp
            ? data.orderDeadline.toDate()
            : new Date(data.orderDeadline)
        } as unknown as Meal;
      }));

      setMeals(mealsWithHouseDetails);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setError('Failed to fetch meals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const [orderQuantity, setOrderQuantity] = useState(1);

  const handleOrderClick = (meal: Meal) => {
    setOrderQuantity(1); // Reset quantity when selecting a new meal
    setSelectedMeal(meal);
  };

  const handleOrderConfirm = async () => {
    if (!currentUser || !selectedMeal) return;

    try {
      setLoading(true);
      setError(null);

      // Create order with student details
      const orderData = {
        studentId: currentUser.uid,
        studentName: currentUser.name || currentUser.email?.split('@')[0] || 'Unknown',
        studentPhone: currentUser.phoneNumber || '',
        mealId: selectedMeal.id,
        quantity: orderQuantity,
        createdAt: Timestamp.now()
      };

      // Add order to orders collection
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Update meal's ordersAccepted count and orders array
      const mealRef = doc(db, 'meals', selectedMeal.id!);
      const newOrdersAccepted = selectedMeal.ordersAccepted + orderQuantity;
      const isAvailable = newOrdersAccepted < selectedMeal.quantityPrepared;

      await updateDoc(mealRef, {
        ordersAccepted: newOrdersAccepted,
        isAvailable,
        orders: arrayUnion({
          ...orderData,
          id: orderRef.id
        })
      });

      // Send confirmation email and schedule reminder
      await sendOrderConfirmation(currentUser.email!, selectedMeal).catch(error => {
        console.error('Email confirmation failed:', error);
      });
      
      await schedulePickupReminder(currentUser.email!, selectedMeal).catch(error => {
        console.error('Reminder scheduling failed:', error);
      });

      setSelectedMeal(null);
      navigate('/my-orders');
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
                <h3 className="text-xl font-semibold mb-2">{meal.mealTitle}</h3>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    by {meal.houseName}
                  </p>
                  <div className="mt-2 space-y-1">
                    {meal.houseLocation && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="material-icons-outlined text-sm mr-1">location_on</span>
                        {meal.houseLocation.area}
                        <span className="mx-1">•</span>
                        {meal.houseLocation.address}
                      </p>
                    )}
                    {meal.housePhone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="material-icons-outlined text-sm mr-1">phone</span>
                        <a href={`tel:${meal.housePhone}`} className="hover:underline">
                          {meal.housePhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <span className="material-icons-outlined text-sm mr-1">schedule</span>
                    Pickup: {meal.pickupTime.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <span className="material-icons-outlined text-sm mr-1">timer</span>
                    Order by: {meal.orderDeadline.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <span className="material-icons-outlined text-sm mr-1">people</span>
                    {meal.ordersAccepted}/{meal.quantityPrepared} orders
                  </div>
                </div>
              </div>
              <div>
                {meal.ordersAccepted >= meal.quantityPrepared ? (
                  <span className="px-2 py-1 text-sm rounded bg-red-100 text-red-800">
                    Fully Booked
                  </span>
                ) : (
                  <span className="px-2 py-1 text-sm rounded bg-green-100 text-green-800">
                    Available
                  </span>
                )}
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
                disabled={loading || meal.ordersAccepted >= meal.quantityPrepared}
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
          quantity={orderQuantity}
          setQuantity={setOrderQuantity}
          maxQuantity={selectedMeal.quantityPrepared - selectedMeal.ordersAccepted}
        />
      )}
    </motion.div>
  );
} 