import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { analyzeNutrition } from "../GeminiService";

export default function HouseDashboard({ user }) {
  const [mealTitle, setMealTitle] = useState("");
  const [price, setPrice] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [itemNames, setItemNames] = useState([""]);
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => setItemNames([...itemNames, ""]);
  const handleItemChange = (val, i) => {
    const updated = [...itemNames];
    updated[i] = val;
    setItemNames(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const nutrition = await analyzeNutrition(itemNames);
    const totalProtein = nutrition.reduce((s, i) => s + (i.protein || 0), 0);
    const totalCalories = nutrition.reduce((s, i) => s + (i.calories || 0), 0);
    const isVeg = !nutrition.some(i => i.tags?.includes("non-veg"));

    await addDoc(collection(db, "meals"), {
      houseId: user.uid,
      mealTitle,
      price: parseFloat(price),
      pickupTime,
      orderDeadline: Timestamp.fromDate(new Date(deadline)),
      quantityPrepared: parseInt(quantity),
      ordersAccepted: 0,
      isAvailable: true,
      foodItems: nutrition,
      totalProtein,
      totalCalories,
      isVeg,
      createdAt: Timestamp.now()
    });

    setMealTitle(""); setPrice(""); setPickupTime(""); setDeadline("");
    setQuantity(1); setItemNames([""]); setLoading(false);
    alert("Meal added!");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">House Dashboard</h2>
      <input value={mealTitle} onChange={e=>setMealTitle(e.target.value)} placeholder="Meal Title" />
      <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price (Rs)" />
      <input value={pickupTime} onChange={e=>setPickupTime(e.target.value)} placeholder="Pickup Time" />
      <input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} placeholder="Order Deadline" />
      <input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Quantity Available" />

      {itemNames.map((item, i) => (
        <input key={i} value={item} onChange={e=>handleItemChange(e.target.value, i)} placeholder={`Item ${i+1}`} />
      ))}
      <button onClick={handleAddItem}>+ Add Food Item</button>
      <button onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save Meal"}</button>
    </div>
  );
}
