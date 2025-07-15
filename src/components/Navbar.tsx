import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center px-2 py-2 text-gray-700 dark:text-white text-lg font-bold"
            >
              Pothichor
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {currentUser.role === 'student' && (
              <Link
                to="/my-orders"
                className="px-2 sm:px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white flex items-center"
              >
                <span className="material-icons-outlined text-lg mr-1">receipt_long</span>
                <span className="hidden sm:inline">My Orders</span>
              </Link>
            )}
            
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-200 text-sm mr-2 sm:mr-4">
                {currentUser.name || currentUser.email.split('@')[0]} ({currentUser.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm flex items-center"
              >
                <span className="material-icons-outlined text-lg mr-1">logout</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 