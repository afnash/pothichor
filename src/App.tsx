import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useEffect, useState } from 'react';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import HouseDashboard from './pages/HouseDashboard';
import MyOrders from './pages/MyOrders';
import Navbar from './components/Navbar';
import BackgroundDecoration from './components/BackgroundDecoration';
import { startReminderService, stopReminderService } from './services/reminderService';
import type { UserRole } from './types';
import { AnimatePresence } from 'framer-motion';

function App() {
  const { currentUser, setUserRole } = useAuth();
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  useEffect(() => {
    if (currentUser && !currentUser.role && !currentUser.name) {
      setShowRoleDialog(true);
    } else {
      setShowRoleDialog(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'student') {
      startReminderService(currentUser.email!);
    }
    return () => {
      stopReminderService();
    };
  }, [currentUser]);

  const handleRoleSelect = async (role: UserRole) => {
    try {
      await setUserRole(role);
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Error setting user role:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <BackgroundDecoration />
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/auth" element={!currentUser ? <AuthPage /> : <Navigate to="/" />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                currentUser ? (
                  currentUser.role && currentUser.name ? (
                    currentUser.role === 'student' ? (
                      <StudentDashboard />
                    ) : (
                      <HouseDashboard />
                    )
                  ) : (
                    <AuthPage />
                  )
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            
            <Route
              path="/my-orders"
              element={
                currentUser?.role === 'student' ? (
                  <MyOrders />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        {/* Role Selection Dialog */}
        {showRoleDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Select Your Role</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please select your role to continue:
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleRoleSelect('student')}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Student
                </button>
                <button
                  onClick={() => handleRoleSelect('house')}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  House
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
