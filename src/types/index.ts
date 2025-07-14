import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'house';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  isVeg: boolean;
  tags?: string[];
}

export interface Meal {
  id?: string;
  houseId: string;
  mealTitle: string;
  price: number;
  pickupTime: Date;
  orderDeadline: Date;
  quantityPrepared: number;
  ordersAccepted: number;
  isAvailable: boolean;
  foodItems: FoodItem[];
  totalProtein: number;
  totalCalories: number;
  isVeg: boolean;
}

export interface Order {
  id?: string;
  studentId: string;
  mealId: string;
  createdAt: Date;
}

export interface PastOrder {
  id: string;
  houseId: string;
  mealTitle: string;
  pickupTime: Timestamp;
  totalOrders: number;
  totalRevenue: number;
  foodItems: string[];
} 