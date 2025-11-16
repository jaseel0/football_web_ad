// components/ManageLeagues.jsx
import React, { useState, useEffect } from 'react';

const ManageLeagues = ({ users,  onUpdate, showMessage }) => {
  const [leagues, setLeagues] = useState([]);
  const [isCreateLeagueOpen, setIsCreateLeagueOpen] = useState(false);
  const [newLeague, setNewLeague] = useState({
    name: '',
    description: '',
    maxTeams: 8
  });

  // Fetch leagues
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const response = await fetch('http://localhost:3001/leagues');
        if (response.ok) {
          const leaguesData = await response.json();
          setLeagues(leaguesData);
        }
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
      }
    };
    
    fetchLeagues();
  }, []);

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLeague,
          teams: [],
          fixtures: [],
          status: 'active',
          createdAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        showMessage('success', 'League created successfully!');
        setIsCreateLeagueOpen(false);
        setNewLeague({ name: '', description: '', maxTeams: 8 });
        onUpdate();
      } else {
        throw new Error('Failed to create league');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to create league');
    }
  };

  const handleAddTeamToLeague = async (leagueId, teamName) => {
    try {
      const league = leagues.find(l => l.id === leagueId);
      if (!league) return;

      const updatedTeams = [...league.teams, teamName];
      
      const response = await fetch(`http://localhost:3001/leagues/${leagueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teams: updatedTeams
        }),
      });

      if (response.ok) {
        showMessage('success', `Team ${teamName} added to league!`);
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to add team to league');
    }
  };

  const handleRemoveTeamFromLeague = async (leagueId, teamName) => {
    try {
      const league = leagues.find(l => l.id === leagueId);
      if (!league) return;

      const updatedTeams = league.teams.filter(team => team !== teamName);
      
      const response = await fetch(`http://localhost:3001/leagues/${leagueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teams: updatedTeams
        }),
      });

      if (response.ok) {
        showMessage('success', `Team ${teamName} removed from league!`);
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to remove team from league');
    }
  };

  const handleDeleteLeague = async (leagueId) => {
    if (!window.confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/leagues/${leagueId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', 'League deleted successfully!');
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to delete league');
    }
  };

  const registeredUsers = users.filter(user => user.teamName);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">League Management</h2>
        <p className="text-gray-600 mb-4">Create and manage multiple leagues for your eFootball competition</p>
        
        <button
          onClick={() => setIsCreateLeagueOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg"
        >
          🏆 Create New League
        </button>
      </div>

      {/* Create League Modal */}
      {isCreateLeagueOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Create New League</h3>
              <button
                onClick={() => setIsCreateLeagueOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  League Name *
                </label>
                <input
                  type="text"
                  value={newLeague.name}
                  onChange={(e) => setNewLeague({...newLeague, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter league name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newLeague.description}
                  onChange={(e) => setNewLeague({...newLeague, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter league description"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Teams
                </label>
                <input
                  type="number"
                  value={newLeague.maxTeams}
                  onChange={(e) => setNewLeague({...newLeague, maxTeams: parseInt(e.target.value)})}
                  min="4"
                  max="20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateLeagueOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-xl transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition duration-300"
                >
                  Create League
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leagues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues.map(league => (
          <div key={league.id} className="bg-white rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-300 transition duration-300 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{league.name}</h3>
                <p className="text-gray-600 text-sm">{league.description}</p>
              </div>
              <button
                onClick={() => handleDeleteLeague(league.id)}
                className="text-red-500 hover:text-red-700 transition duration-300"
                title="Delete league"
              >
                🗑️
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Teams: {league.teams.length}/{league.maxTeams}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  league.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {league.status}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(league.teams.length / league.maxTeams) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Teams List */}
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-gray-800 text-sm">Teams in League:</h4>
              {league.teams.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {league.teams.map((team, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-gray-700">{team}</span>
                      <button
                        onClick={() => handleRemoveTeamFromLeague(league.id, team)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No teams added yet</p>
              )}
            </div>

            {/* Add Team Dropdown */}
            {league.teams.length < league.maxTeams && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Team to League
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddTeamToLeague(league.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a team...</option>
                  {registeredUsers
                    .filter(user => !league.teams.includes(user.teamName))
                    .map(user => (
                      <option key={user.id} value={user.teamName}>
                        {user.teamName} ({user.name})
                      </option>
                    ))
                  }
                </select>
              </div>
            )}

            {/* League Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Navigate to league fixtures (to be implemented)
                  showMessage('info', `Viewing ${league.name} fixtures`);
                }}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition duration-300"
              >
                View Fixtures
              </button>
              <button
                onClick={() => {
                  // Generate fixtures for league (to be implemented)
                  showMessage('info', `Generating fixtures for ${league.name}`);
                }}
                className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition duration-300"
              >
                Generate Fixtures
              </button>
            </div>
          </div>
        ))}
      </div>

      {leagues.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🏆</div>
          <h4 className="text-2xl font-bold text-gray-600 mb-2">No Leagues Created Yet</h4>
          <p className="text-gray-500 mb-6">Create your first league to organize teams and matches.</p>
          <button
            onClick={() => setIsCreateLeagueOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Create Your First League
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageLeagues;