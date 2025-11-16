// App.jsx
import React, { useState } from 'react';
import Admin from './Admin';
import Login from './Login';

export default function App() {
  // Initialize state directly from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = (status) => {
    setIsAuthenticated(status);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition duration-300 shadow-lg"
            >
              🚪 Logout
            </button>
          </div>
          <Admin />
        </div>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}