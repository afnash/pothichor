import { Meal } from '../types';
import { getRandomHungryText } from '../utils/textUtils';

export default function OrderConfirmationModal({
  meal,
  onConfirm,
  onCancel,
  quantity,
  setQuantity,
  maxQuantity
}: {
  meal: Meal;
  onConfirm: () => void;
  onCancel: () => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  maxQuantity: number;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">{getRandomHungryText()}</h3>
          <p className="text-gray-600 dark:text-gray-400">Please confirm your order details</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-lg font-semibold mb-2">{meal.mealTitle}</h4>
            <p className="text-gray-600 dark:text-gray-400">by {meal.houseName}</p>
            
            {/* House Contact Info */}
            {(meal.houseLocation || meal.housePhone) && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                <h5 className="font-medium text-sm">House Contact Information:</h5>
                {meal.houseLocation && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p className="flex items-center">
                      <span className="material-icons-outlined text-sm mr-1">location_on</span>
                      {meal.houseLocation.area}
                    </p>
                    <p className="ml-5 text-xs">{meal.houseLocation.address}</p>
                  </div>
                )}
                {meal.housePhone && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                    <span className="material-icons-outlined text-sm mr-1">phone</span>
                    <a href={`tel:${meal.housePhone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {meal.housePhone}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Pickup: {meal.pickupTime.toLocaleString()}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Price:</span>
                <span className="text-lg text-orange-600 dark:text-orange-400">
                  ₹{meal.price} × {quantity} = ₹{meal.price * quantity}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity (max: {maxQuantity})
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQuantity))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
} 