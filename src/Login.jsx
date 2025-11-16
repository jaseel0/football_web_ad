// components/Login.jsx
import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    //change password here
    if (loginData.username && loginData.password) {
      setTimeout(() => {
        if (loginData.username === 'admin' && loginData.password === 'admin123') {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify({
            username: loginData.username,
            role: 'admin'
          }));
          onLogin(true);
        } else {
          setError('Invalid username or password');
        }
        setIsLoading(false);
      }, 1000);
    } else {
      setError('Please enter both username and password');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-[#850cec] to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-[#850cec]/30">
              <span className="text-white text-3xl">⚽</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#850cec] to-purple-500 bg-clip-text text-transparent mb-3">
            eFootball Manager
          </h1>
          <p className="text-gray-400 text-lg">
            Admin Dashboard Login
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center space-x-2">
                <span>⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">👤</span>
                </div>
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-white placeholder-gray-400 transition duration-300"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔒</span>
                </div>
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-white placeholder-gray-400 transition duration-300"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition duration-300 transform hover:scale-105 ${
                isLoading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-purple-700 hover:to-[#850cec] text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                '🚀 Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Features List */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-[#850cec] text-lg mb-1">👥</div>
              <div className="text-xs text-gray-400">Manage Players</div>
            </div>
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-green-400 text-lg mb-1">⚽</div>
              <div className="text-xs text-gray-400">Update Scores</div>
            </div>
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-orange-400 text-lg mb-1">📅</div>
              <div className="text-xs text-gray-400">Schedule Matches</div>
            </div>
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-purple-400 text-lg mb-1">🏆</div>
              <div className="text-xs text-gray-400">League Management</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            eFootball Management System • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;