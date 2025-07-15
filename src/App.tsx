import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import HouseDashboard from './pages/HouseDashboard';
import MyOrders from './pages/MyOrders';
import Navbar from './components/Navbar';
import BackgroundDecoration from './components/BackgroundDecoration';
import { startReminderService, stopReminderService } from './services/reminderService';
import { AnimatePresence } from 'framer-motion';

function App() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.role === 'student') {
      startReminderService(currentUser.email!);
    }
    return () => {
      stopReminderService();
    };
  }, [currentUser]);

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
      </main>
    </div>
  );
}

export default App;
