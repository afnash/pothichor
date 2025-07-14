import { db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// Constants for EmailJS configuration
const EMAILJS_SERVICE_ID = "service_ybw20i4";
const EMAILJS_REMINDER_TEMPLATE_ID = "template_bd11dcb";

let reminderCheckInterval: NodeJS.Timeout | null = null;

export const startReminderService = (userEmail: string) => {
  // Request notification permission
  if ('Notification' in window) {
    Notification.requestPermission();
  }

  // Check for reminders every minute
  reminderCheckInterval = setInterval(() => {
    checkReminders(userEmail);
  }, 60000); // every minute
};

export const stopReminderService = () => {
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval);
    reminderCheckInterval = null;
  }
};

const checkReminders = async (userEmail: string) => {
  try {
    const now = new Date();
    const remindersRef = collection(db, 'scheduledReminders');
    const q = query(
      remindersRef,
      where('userEmail', '==', userEmail),
      where('sent', '==', false),
      where('reminderTime', '<=', now)
    );

    const reminders = await getDocs(q);

    for (const reminderDoc of reminders.docs) {
      const reminder = reminderDoc.data();
      
      // Send email reminder
      await sendReminderEmail(reminder);

      // Show browser notification
      showNotification(reminder);

      // Mark reminder as sent
      await updateDoc(doc(db, 'scheduledReminders', reminderDoc.id), {
        sent: true
      });
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

const sendReminderEmail = async (reminder: any) => {
  try {
    const pickupTime = new Date(reminder.pickupTime.seconds * 1000);
    const templateParams = {
      to_email: reminder.userEmail,
      meal_title: reminder.mealTitle,
      pickup_time: pickupTime.toLocaleString(),
      food_items: reminder.foodItems.join(", "),
      from_name: "Pothichor",
      message: `Your meal "${reminder.mealTitle}" is ready for pickup in 15 minutes! Please pick up your meal at ${pickupTime.toLocaleString()}.`
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_REMINDER_TEMPLATE_ID,
      templateParams
    );

    if (response.status !== 200) {
      throw new Error(`EmailJS responded with status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
};

const showNotification = (reminder: any) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const pickupTime = new Date(reminder.pickupTime.seconds * 1000);
    
    new Notification('Food Pickup Reminder', {
      body: `Your order "${reminder.mealTitle}" is ready for pickup in 15 minutes!\nPickup time: ${pickupTime.toLocaleString()}`,
      icon: '/favicon.ico', // Add your app icon path here
      badge: '/favicon.ico',
      vibrate: [200, 100, 200]
    });
  }
}; 