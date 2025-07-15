import emailjs from '@emailjs/browser';
import { Meal } from '../types';

// Initialize EmailJS with your user ID
emailjs.init("vkkMaE1rgAMwrPBA9");

// Constants for EmailJS configuration
const EMAILJS_SERVICE_ID = "service_ybw20i4";
const EMAILJS_ORDER_TEMPLATE_ID = "template_bd11dcb";

export const sendOrderConfirmation = async (userEmail: string, meal: Meal) => {
  try {
    const templateParams = {
      to_email: userEmail,
      meal_title: meal.mealTitle,
      pickup_time: meal.pickupTime.toLocaleString(),
      price: `Rs. ${meal.price}`,
      food_items: meal.foodItems.map(item => item.name).join(", "),
      from_name: "Pothichor",
      message: `Your order for ${meal.mealTitle} has been confirmed! Please pick up your meal at ${meal.pickupTime.toLocaleString()}.`
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ORDER_TEMPLATE_ID,
      templateParams
    );

    if (response.status !== 200) {
      throw new Error(`EmailJS responded with status ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return false;
  }
};

export const schedulePickupReminder = async (userEmail: string, meal: Meal) => {
  try {
    // Store the reminder in Firestore
    const reminderTime = new Date(meal.pickupTime.getTime() - 15 * 60000); // 15 minutes before pickup
    
    const reminder = {
      userEmail,
      mealTitle: meal.mealTitle,
      pickupTime: meal.pickupTime,
      foodItems: meal.foodItems.map(item => item.name),
      reminderTime,
      sent: false
    };

    // We'll handle sending the actual reminder using client-side code
    await addReminderToFirestore(reminder);

    return true;
  } catch (error) {
    console.error('Error scheduling pickup reminder:', error);
    return false;
  }
};

// Function to add reminder to Firestore
const addReminderToFirestore = async (reminder: any) => {
  const { db } = await import('../config/firebase');
  const { collection, addDoc } = await import('firebase/firestore');
  
  await addDoc(collection(db, 'scheduledReminders'), reminder);
}; 