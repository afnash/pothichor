import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDoc, addDoc, Timestamp } from "firebase/firestore";

export default function StudentDashboard({ user }) {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "meals"), snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.isAvailable && m.orderDeadline.toDate() > new Date());
      setMeals(data);
    });

    return () => unsub();
  }, []);

  const handleOrder = async meal => {
    const mealRef = doc(db, "meals", meal.id);
    const mealSnap = await getDoc(mealRef);
    const mealData = mealSnap.data();

    if (mealData.ordersAccepted >= mealData.quantityPrepared) {
      alert("Meal is already full!");
      return;
    }

    await updateDoc(mealRef, {
      ordersAccepted: mealData.ordersAccepted + 1,
      isAvailable: mealData.ordersAccepted + 1 < mealData.quantityPrepared
    });

    await addDoc(collection(db, "orders"), {
      studentId: user.uid,
      mealId: meal.id,
      createdAt: Timestamp.now(),
    });

    alert("Order placed!");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Student Dashboard</h2>

      {meals.length === 0 && <p>No meals available now.</p>}

      {meals.map((meal, i) => (
        <div key={i} className="border p-2 my-2 rounded shadow">
          <h3 className="font-bold">{meal.mealTitle} — ₹{meal.price}</h3>
          <p>Pickup: {meal.pickupTime}</p>
          <p>Items: {meal.foodItems.map(i => i.name).join(", ")}</p>
          <p>Protein: {meal.totalProtein}g | Calories: {meal.totalCalories} kcal</p>
          <p>Type: {meal.isVeg ? "Veg" : "Non-Veg"}</p>
          <p>{meal.quantityPrepared - meal.ordersAccepted} left</p>

          <button onClick={() => handleOrder(meal)} disabled={meal.ordersAccepted >= meal.quantityPrepared}>
            {meal.ordersAccepted >= meal.quantityPrepared ? "Sold Out" : "Order"}
          </button>
        </div>
      ))}
    </div>
  );
}
