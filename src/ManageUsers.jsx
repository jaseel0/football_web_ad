// components/ManageUsers.jsx
import React, { useState } from 'react';

const ManageUsers = ({ users, onUpdate, showMessage }) => {
  const [newUser, setNewUser] = useState({
    username: '',
    teamName: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6);

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.teamName) {
      showMessage('error', 'Username and Team Name are required');
      return;
    }

    const userData = {
      ...newUser,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      form: [],
      rank: users.length + 1
    };

    try {
      const response = await fetch('https://football-web-bd.onrender.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        showMessage('success', 'User added successfully!');
        setNewUser({ username: '', teamName: '' });
        onUpdate();
      } else {
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to add user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`https://football-web-bd.onrender.com/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', 'User deleted successfully!');
        onUpdate();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to delete user');
    }
  };

  const handleResetStats = async (userId) => {
    if (!window.confirm('Are you sure you want to reset this user\'s statistics?')) {
      return;
    }

    try {
      const response = await fetch(`https://football-web-bd.onrender.com/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          form: []
        }),
      });

      if (response.ok) {
        showMessage('success', 'User statistics reset successfully!');
        onUpdate();
      } else {
        throw new Error('Failed to reset statistics');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to reset statistics');
    }
  };

  // Function to get initials from team name (like WhatsApp)
  const getInitials = (teamName) => {
    if (!teamName) return 'TM';
    return teamName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Function to generate color based on team name
  const getTeamColor = (teamName) => {
    const colors = [
      'bg-[#850cec]', 'bg-purple-600', 'bg-blue-600', 'bg-green-600',
      'bg-red-600', 'bg-yellow-600', 'bg-pink-600', 'bg-indigo-600'
    ];
    const index = (teamName?.length || 0) % colors.length;
    return colors[index];
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Add User Form */}
      <div className="bg-gray-800 rounded-2xl p-8 border-2 border-gray-700 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-[#850cec] to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">➕</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Add New Player</h3>
            <p className="text-gray-400">Register a new competitor</p>
          </div>
        </div>
        
        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-white placeholder-gray-400 transition duration-300"
                placeholder="Enter player username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newUser.teamName}
                onChange={(e) => setNewUser({...newUser, teamName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-white placeholder-gray-400 transition duration-300"
                placeholder="Enter team name"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-[#7600d8] hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
          >
            🎮 Add Player to Competition
          </button>
        </form>
      </div>

      {/* Users List */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-[#850cec] to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">👥</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Current Players</h3>
            <p className="text-gray-400">{users.length} registered competitors</p>
          </div>
        </div>

        {/* Users List with Pagination */}
        <div className="space-y-4 mb-6">
          {currentUsers.map((user, index) => (
            <div key={user.id} className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700 hover:border-[#850cec] shadow-lg hover:shadow-xl transition duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-[#850cec]/25 transition duration-300 ${getTeamColor(user.teamName)}`}>
                      {getInitials(user.teamName)}
                    </div>
                    {index < 3 && (
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg group-hover:text-[#850cec] transition duration-300">
                      {user.teamName}
                    </div>
                    <div className="text-gray-400 text-sm">@{user.username}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResetStats(user.id)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 shadow-md border border-yellow-500"
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 shadow-md border border-red-500"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="bg-gradient-to-r from-[#850cec]/20 to-purple-600/20 p-3 rounded-lg text-center border border-[#850cec]/30">
                  <div className="text-[#850cec] font-bold text-lg">{user.points}</div>
                  <div className="text-gray-400 text-xs font-semibold">PTS</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center border border-gray-600">
                  <div className="text-white font-bold text-lg">{user.played}</div>
                  <div className="text-gray-400 text-xs font-semibold">PLD</div>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 p-3 rounded-lg text-center border border-green-500/30">
                  <div className="text-green-400 font-bold text-lg">{user.won}</div>
                  <div className="text-gray-400 text-xs font-semibold">WON</div>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-3 rounded-lg text-center border border-red-500/30">
                  <div className="text-red-400 font-bold text-lg">{user.lost}</div>
                  <div className="text-gray-400 text-xs font-semibold">LOST</div>
                </div>
              </div>

              {/* Goals and Form */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 font-medium">
                  Goals: <span className="text-white">{user.goalsFor || 0}:{user.goalsAgainst || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400 font-medium">Form:</span>
                  <div className="flex space-x-1">
                    {user.form && user.form.map((result, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold text-white ${
                          result === 'W' ? 'bg-green-500' :
                          result === 'D' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                    {(!user.form || user.form.length === 0) && (
                      <span className="text-gray-500 text-xs">No matches</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${
                currentPage === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                  : 'bg-gray-700 text-white hover:bg-[#850cec] hover:text-white border border-gray-600'
              }`}
            >
              ← Prev
            </button>

            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${
                  currentPage === number
                    ? 'bg-[#850cec] text-white shadow-lg shadow-[#850cec]/30 border border-[#850cec]'
                    : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${
                currentPage === totalPages
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                  : 'bg-gray-700 text-white hover:bg-[#850cec] hover:text-white border border-gray-600'
              }`}
            >
              Next →
            </button>
          </div>
        )}

        {/* Page Info */}
        {users.length > 0 && (
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              Showing <span className="text-[#850cec] font-semibold">
                {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)}
              </span> of{' '}
              <span className="text-purple-400 font-semibold">{users.length}</span> players
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;