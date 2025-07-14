import { useState } from "react";
import Auth from "./components/Auth"
import Housedashboard from "./components/HouseDashboard";
import Studentdashboard from "./components/StudentDashboard";

export default function App(){
  const [user, setUser] = useState(null);
  if (!user) return <Auth onLogin={setUser} />;
  return (
    <>
      {user.role === "student" && <Studentdashboard user={user} />}
      {user.role === "house" && <Housedashboard user={user} />}
    </>
  );
}