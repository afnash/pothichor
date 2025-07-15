import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'house';

export interface Location {
  address: string;
  area: string;
}

export interface UserDetails {
  name: string;
  phoneNumber: string;
  location?: Location; // Optional, only for house users
}

export interface FoodItem {
  name: string;
  calories?: number;
  protein?: number;
  isVeg?: boolean;
}

export interface OrderDetails {
  studentId: string;
  studentName: string;
  studentPhone: string;
  quantity: number;
}

export interface Meal {
  id?: string;
  houseId: string;
  houseName: string;
  houseLocation: Location;
  housePhone: string;
  mealTitle: string;
  price: number;
  pickupTime: Date;
  orderDeadline: Date;
  quantityPrepared: number;
  ordersAccepted: number;
  isAvailable: boolean;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  isVeg: boolean;
  createdAt: Timestamp;
  orders?: OrderDetails[];
}

export interface Order {
  id?: string;
  studentId: string;
  mealId: string;
  quantity: number;
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
  orders: OrderDetails[];
} 