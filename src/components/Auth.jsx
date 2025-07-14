import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Auth({ onLogin }) {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [role, setRole] = useState("student"); // Initial role for new users
    const [isNew, setIsNew] = useState(false);

    const handleSubmit = async () => {
        try {
            let userCredential;
            if (isNew) {
                userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const uid = userCredential.user.uid;
                // Set the user's role and email in Firestore for new registrations
                await setDoc(doc(db, "users", uid), { role, email });
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, pass);
            }

            const uid = userCredential.user.uid;
            const snap = await getDoc(doc(db, "users", uid));

            let userRole = "student"; // Default role if not found or no document
            if (snap.exists()) {
                const userData = snap.data();
                // Prioritize role from Firestore, fallback to default if missing
                userRole = userData.role || "student";
            } else {
                // This case handles existing users who might not have a Firestore profile yet,
                // or if the document creation somehow failed for a new user.
                console.warn(`User document not found for UID: ${uid}. Assigning default role 'student'.`);
                // Optionally, you might want to create the document here for existing users
                // who are logging in for the first time without a Firestore profile.
                // await setDoc(doc(db, "users", uid), { role: userRole, email });
            }

            // Call onLogin with the fetched (or default) role
            onLogin({ uid, email, role: userRole });

        } catch (error) {
            console.error("Authentication or Firestore operation failed:", error);
            // Provide user feedback based on the error
            if (error.code === 'auth/email-already-in-use') {
                alert("This email is already in use. Try logging in or use a different email.");
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert("Invalid email or password.");
            } else if (error.code === 'permission-denied') {
                alert("Access denied. Please check your Firebase security rules.");
            } else {
                alert("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="p-4 flex flex-col gap-4 max-w-sm mx-auto border rounded-lg shadow-md">
            <input
                className="p-2 border rounded"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                autoComplete="email"
            />
            <input
                className="p-2 border rounded"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Password"
                autoComplete={isNew ? "new-password" : "current-password"}
            />

            {isNew && (
                <div className="flex flex-col gap-2">
                    <label htmlFor="role-select" className="text-sm font-medium text-gray-700">Select Role:</label>
                    <select
                        id="role-select"
                        className="p-2 border rounded bg-white"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">House</option> {/* Changed "House" to "Teacher" for clarity */}
                    </select>
                </div>
            )}

            <button
                onClick={handleSubmit}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
            >
                {isNew ? "Register" : "Login"}
            </button>
            <p
                onClick={() => setIsNew(!isNew)}
                className="text-blue-500 text-sm cursor-pointer hover:underline text-center"
            >
                {isNew ? "Already have an account? Login" : "New to Pothichor? Register"}
            </p>
        </div>
    );
}