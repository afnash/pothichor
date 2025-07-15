import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Order, Meal } from '../types';
import GlassCard from '../components/GlassCard';
import { motion } from 'framer-motion';

interface OrderWithMeal extends Order {
  meal: Meal;
  quantity: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function MyOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<OrderWithMeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate total amount
  const totalAmount = orders.reduce((sum, order) => sum + (order.meal.price * (order.quantity || 1)), 0);

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const fetchOrders = async () => {
    if (!currentUser) return;

    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('studentId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const ordersPromises = querySnapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        
        // Fetch associated meal using doc()
        const mealRef = doc(db, 'meals', orderData.mealId);
        const mealDoc = await getDoc(mealRef);
        
        if (!mealDoc.exists()) {
          console.error(`Meal ${orderData.mealId} not found`);
          return null;
        }
        
        const mealData = mealDoc.data();
        
        return {
          id: orderDoc.id,
          studentId: orderData.studentId,
          mealId: orderData.mealId,
          quantity: orderData.quantity || 1,
          createdAt: orderData.createdAt instanceof Timestamp 
            ? orderData.createdAt.toDate() 
            : new Date(orderData.createdAt),
          meal: {
            id: mealDoc.id,
            ...mealData,
            pickupTime: mealData.pickupTime instanceof Timestamp 
              ? mealData.pickupTime.toDate() 
              : new Date(mealData.pickupTime),
            orderDeadline: mealData.orderDeadline instanceof Timestamp
              ? mealData.orderDeadline.toDate()
              : new Date(mealData.orderDeadline)
          } as Meal
        } as OrderWithMeal;
      });

      const fetchedOrders = (await Promise.all(ordersPromises)).filter((order): order is OrderWithMeal => order !== null);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
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
        My Orders
      </h1>

      {/* Total Amount Card */}
      {orders.length > 0 && (
        <GlassCard className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="material-icons-outlined text-2xl text-amber-600 dark:text-amber-400 mr-3">
                account_balance_wallet
              </span>
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                  Total Spent
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              Rs. {totalAmount}
            </div>
          </div>
        </GlassCard>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {orders.map((order) => (
          <GlassCard key={order.id} className="p-6 transform hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                  {order.meal.mealTitle}
                </h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">schedule</span>
                    <span className="font-medium">
                      {order.meal.pickupTime.toLocaleString()}
                    </span>
                  </p>
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">shopping_cart</span>
                    <span className="font-medium">Quantity: {order.quantity}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">payments</span>
                    <span className="font-medium">
                      Rs. {order.meal.price} × {order.quantity} = Rs. {order.meal.price * order.quantity}
                    </span>
                  </p>
                  <p className="flex items-center">
                    <span className="material-icons-outlined text-lg mr-2">event</span>
                    <span className="font-medium">
                      {order.createdAt.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                {isUpcoming(order.meal.pickupTime) ? (
                  <span className="px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                    <span className="material-icons-outlined text-sm mr-1">upcoming</span>
                    Upcoming
                  </span>
                ) : (
                  <span className="px-4 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center">
                    <span className="material-icons-outlined text-sm mr-1">history</span>
                    Past
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-200 flex items-center">
                <span className="material-icons-outlined text-lg mr-2">restaurant_menu</span>
                Food Items
              </h4>
              <ul className="grid grid-cols-2 gap-2">
                {order.meal.foodItems.map((item, index) => (
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

            {isUpcoming(order.meal.pickupTime) && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <span className="material-icons-outlined text-amber-500 text-lg mr-2">
                    notifications_active
                  </span>
                  {getRandomReminderText()}
                </p>
              </div>
            )}
          </GlassCard>
        ))}

        {orders.length === 0 && (
          <GlassCard className="py-12 text-center">
            <span className="material-icons-outlined text-4xl text-gray-400 mb-3">
              receipt_long
            </span>
            <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
          </GlassCard>
        )}
      </motion.div>
    </motion.div>
  );
}

function isUpcoming(date: Date): boolean {
  return date > new Date();
}

function getRandomReminderText(): string {
  const texts = [
    "Don't forget to pick up your delicious meal! 🍽️",
    "Your taste buds are counting down the minutes! ⏰",
    "Get ready for a flavor-packed experience! 🌟",
    "Your meal is being prepared with love! ❤️",
    "Adventure awaits your taste buds! 🚀",
    "Time to get excited about your upcoming feast! 🎉"
  ];
  return texts[Math.floor(Math.random() * texts.length)];
} 