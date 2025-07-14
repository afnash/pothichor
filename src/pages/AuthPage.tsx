import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export default function AuthPage() {
  const { currentUser, signInWithGoogle, setUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is already logged in and has a role, redirect to dashboard
    if (currentUser?.role) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleRoleSubmit = async () => {
    try {
      await setUserRole(selectedRole);
      navigate('/');
    } catch (error) {
      console.error('Error setting role:', error);
    }
  };

  // Show role selection if user is logged in but has no role
  if (currentUser && !currentUser.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Choose your role
            </h2>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setSelectedRole('student')}
                className={`p-4 rounded-lg border-2 ${
                  selectedRole === 'student'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <h3 className="text-lg font-medium">Student</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Browse and order meals from houses
                </p>
              </button>
              <button
                onClick={() => setSelectedRole('house')}
                className={`p-4 rounded-lg border-2 ${
                  selectedRole === 'house'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <h3 className="text-lg font-medium">House</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create and manage meal offerings
                </p>
              </button>
            </div>
            <button
              onClick={handleRoleSubmit}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if user is not logged in
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to Pothichor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Connect and share meals with your community
          </p>
        </div>
        <div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.405,3.404-4.545,3.404c-2.627,0-4.545-2.127-4.545-4.545s2.127-4.545,4.545-4.545c1.127,0,2.163,0.386,2.981,1.031l2.982-2.982C17.309,4.935,14.976,4,12.545,4C7.018,4,4,7.018,4,12.545s3.018,8.545,8.545,8.545c4.407,0,8.545-3.382,8.545-8.545c0-0.568-0.059-1.123-0.173-1.658h-8.372V12.151z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
} 