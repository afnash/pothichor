import React from 'react';
import { Meal } from '../types';

interface OrderConfirmationModalProps {
  meal: Meal;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function OrderConfirmationModal({ meal, onConfirm, onCancel }: OrderConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Confirm Your Order</h2>
        
        <div className="mb-6">
          <p className="text-lg mb-2">{meal.mealTitle}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Pickup at: {meal.pickupTime.toLocaleString()}
          </p>
          <p className="text-xl font-semibold mb-4">Rs. {meal.price}</p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg mb-4">
            <p className="text-yellow-800 dark:text-yellow-200 italic">
              {getRandomHungryText()}
            </p>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>• You'll receive an email reminder 15 minutes before pickup</p>
            <p>• Please be on time for the best experience</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Confirm Order
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function getRandomHungryText(): string {
  const texts = [
    "Your taste buds are about to go on an adventure! 🚀",
    "Get ready for a flavor explosion! 💥",
    "Time to satisfy that craving! 😋",
    "Your stomach will thank you later! 🙏",
    "Warning: Extreme deliciousness ahead! ⚠️",
    "The countdown to yummy begins! ⏰",
    "Your food journey awaits! 🌟",
    "Prepare for a feast fit for royalty! 👑",
    "Get ready to experience food nirvana! 🎯",
    "Your hunger's worst nightmare is about to end! 🌙"
  ];
  return texts[Math.floor(Math.random() * texts.length)];
} 