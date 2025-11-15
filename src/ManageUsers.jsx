// components/ManageUsers.jsx
import React, { useState } from 'react';

const ManageUsers = ({ users, onUpdate, showMessage }) => {
  const [newUser, setNewUser] = useState({
    username: '',
    teamName: '',
    avatar: ''
  });

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
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        showMessage('success', 'User added successfully!');
        setNewUser({ username: '', teamName: '', avatar: '' });
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
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
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
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Add User Form */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 border border-blue-100 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-blue-600 text-lg">➕</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Add New Player</h3>
            <p className="text-gray-600">Register a new competitor</p>
          </div>
        </div>
        
        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
                placeholder="Enter player username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newUser.teamName}
                onChange={(e) => setNewUser({...newUser, teamName: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
                placeholder="Enter team name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Avatar URL <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="url"
                value={newUser.avatar}
                onChange={(e) => setNewUser({...newUser, avatar: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
          >
            🎮 Add Player to Competition
          </button>
        </form>
      </div>

      {/* Users List */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-green-600 text-lg">👥</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Current Players</h3>
            <p className="text-gray-600">{users.length} registered competitors</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {users.map((user, index) => (
            <div key={user.id} className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={user.avatar || 'https://via.placeholder.com/50?text=TM'}
                      alt={user.teamName}
                      className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/50?text=TM';
                      }}
                    />
                    {index < 3 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{user.teamName}</div>
                    <div className="text-gray-500 text-sm">@{user.username}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResetStats(user.id)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center border border-green-200">
                  <div className="text-green-700 font-bold text-lg">{user.points}</div>
                  <div className="text-green-600 text-xs font-semibold">PTS</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center border border-blue-200">
                  <div className="text-blue-700 font-bold text-lg">{user.played}</div>
                  <div className="text-blue-600 text-xs font-semibold">PLD</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center border border-green-200">
                  <div className="text-green-700 font-bold text-lg">{user.won}</div>
                  <div className="text-green-600 text-xs font-semibold">WON</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg text-center border border-red-200">
                  <div className="text-red-700 font-bold text-lg">{user.lost}</div>
                  <div className="text-red-600 text-xs font-semibold">LOST</div>
                </div>
              </div>

              {/* Form Indicator */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">Recent Form:</div>
                <div className="flex space-x-1">
                  {user.form.map((result, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold text-white ${
                        result === 'W' ? 'bg-green-500' :
                        result === 'D' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                  {user.form.length === 0 && (
                    <span className="text-gray-400 text-sm">No matches</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;