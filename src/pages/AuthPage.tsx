import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Location, UserDetails } from '../types';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const float = {
  initial: { y: 0 },
  animate: {
    y: [-10, 0, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function AuthPage() {
  const { currentUser, signInWithGoogle, setUserRole, setUserDetails } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role && currentUser?.name) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Indian phone number');
      return;
    }

    if (selectedRole === 'house' && (!address.trim() || !area.trim())) {
      setError('Please enter your complete address');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const userDetails: UserDetails = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        ...(selectedRole === 'house' && {
          location: {
            address: address.trim(),
            area: area.trim()
          }
        })
      };

      await setUserRole(selectedRole);
      await setUserDetails(userDetails);
    } catch (error) {
      console.error('Error updating user details:', error);
      setError('Unable to update user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-md w-full space-y-12">
          <motion.div variants={fadeIn} className="text-center">
            <motion.div
              variants={float}
              initial="initial"
              animate="animate"
              className="mb-8"
            >
              <span className="material-icons-outlined text-6xl text-amber-600 dark:text-amber-500">
                restaurant
              </span>
            </motion.div>
            <motion.h2 
              className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4"
              variants={fadeIn}
            >
              Welcome to Pothichor
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 dark:text-gray-400"
              variants={fadeIn}
            >
              Connect and share authentic Kerala meals with your community
            </motion.p>
          </motion.div>

          {error && (
            <motion.div 
              variants={fadeIn}
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          <motion.div variants={fadeIn}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex items-center justify-center px-4 py-3 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transform transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <motion.div 
                className="absolute left-0 inset-y-0 flex items-center pl-3"
                initial={{ x: 0 }}
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg
                  className="h-6 w-6 text-amber-100 group-hover:text-amber-200"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.405,3.404-4.545,3.404c-2.627,0-4.545-2.127-4.545-4.545s2.127-4.545,4.545-4.545c1.127,0,2.163,0.386,2.981,1.031l2.982-2.982C17.309,4.935,14.976,4,12.545,4C7.018,4,4,7.018,4,12.545s3.018,8.545,8.545,8.545c4.407,0,8.545-3.382,8.545-8.545c0-0.568-0.059-1.123-0.173-1.658h-8.372V12.151z" />
                </svg>
              </motion.div>
              {loading ? (
                <div className="flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Signing in...
                </div>
              ) : (
                <span className="pl-8">Sign in with Google</span>
              )}
            </motion.button>
          </motion.div>

          <motion.div 
            variants={fadeIn}
            className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <span className="material-icons-outlined text-amber-500">lock</span>
            <span>Secure authentication powered by Google</span>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Show role and details form if user is logged in but missing role or details
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <motion.div variants={fadeIn} className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
            Tell us a bit about yourself
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              I am a...
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole('student')}
                className={`px-4 py-3 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedRole === 'student'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-2 border-amber-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-transparent'
                }`}
              >
                <span className="material-icons-outlined">school</span>
                <span>Student</span>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole('house')}
                className={`px-4 py-3 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  selectedRole === 'house'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-2 border-amber-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-transparent'
                }`}
              >
                <span className="material-icons-outlined">home</span>
                <span>House</span>
              </motion.button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-amber-500 focus:ring-amber-500"
              required
            />
          </div>

          {selectedRole === 'house' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Area
                </label>
                <input
                  type="text"
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Complete Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transform transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Saving...
              </div>
            ) : (
              'Complete Profile'
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
} 