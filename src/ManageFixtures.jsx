// components/ManageFixtures.jsx
import React, { useState, useEffect } from 'react';

const ManageFixtures = ({ fixtures, onUpdate, showMessage }) => {
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [filteredHomeTeams, setFilteredHomeTeams] = useState([]);
  const [filteredAwayTeams, setFilteredAwayTeams] = useState([]);
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);
  const [showAwaySuggestions, setShowAwaySuggestions] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('all');
  
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    round: 1,
    leagueId: ''
  });

  // Fetch users and leagues
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/users');
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

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
    
    fetchUsers();
    fetchLeagues();
  }, []);

  // Filter fixtures based on selected league
  const filteredFixtures = selectedLeague === 'all' 
    ? fixtures 
    : fixtures.filter(fixture => fixture.leagueId === parseInt(selectedLeague));

  const completedFixtures = filteredFixtures.filter(f => f.status === 'completed');
  const scheduledFixtures = filteredFixtures.filter(f => f.status === 'scheduled');

  // Filter teams based on input
  useEffect(() => {
    if (formData.homeTeam) {
      const filtered = users
        .filter(user => 
          user.teamName?.toLowerCase().includes(formData.homeTeam.toLowerCase()) ||
          user.name?.toLowerCase().includes(formData.homeTeam.toLowerCase())
        )
        .slice(0, 5);
      setFilteredHomeTeams(filtered);
      setShowHomeSuggestions(true);
    } else {
      setFilteredHomeTeams([]);
      setShowHomeSuggestions(false);
    }
  }, [formData.homeTeam, users]);

  useEffect(() => {
    if (formData.awayTeam) {
      const filtered = users
        .filter(user => 
          user.teamName?.toLowerCase().includes(formData.awayTeam.toLowerCase()) ||
          user.name?.toLowerCase().includes(formData.awayTeam.toLowerCase())
        )
        .slice(0, 5);
      setFilteredAwayTeams(filtered);
      setShowAwaySuggestions(true);
    } else {
      setFilteredAwayTeams([]);
      setShowAwaySuggestions(false);
    }
  }, [formData.awayTeam, users]);

  const handleResetFixture = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to reset this fixture? This will remove the scores and mark it as scheduled.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/fixtures/${fixtureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeScore: null,
          awayScore: null,
          status: 'scheduled'
        }),
      });

      if (response.ok) {
        showMessage('success', 'Fixture reset successfully!');
        onUpdate();
      } else {
        throw new Error('Failed to reset fixture');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to reset fixture');
    }
  };

  const handleAddFixture = async (e) => {
    e.preventDefault();
    
    // Validate that home and away teams are different
    if (formData.homeTeam === formData.awayTeam) {
      showMessage('error', 'Home and away teams cannot be the same!');
      return;
    }

    // Find the actual team names from user data
    const homeUser = users.find(user => 
      user.teamName === formData.homeTeam || user.name === formData.homeTeam
    );
    const awayUser = users.find(user => 
      user.teamName === formData.awayTeam || user.name === formData.awayTeam
    );

    const homeTeamName = homeUser?.teamName || formData.homeTeam;
    const awayTeamName = awayUser?.teamName || formData.awayTeam;

    // Prepare fixture data
    const fixtureData = {
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      round: parseInt(formData.round),
      homeScore: null,
      awayScore: null,
      status: 'scheduled'
    };

    // Add leagueId if selected
    if (formData.leagueId) {
      fixtureData.leagueId = parseInt(formData.leagueId);
    }

    try {
      const response = await fetch('http://localhost:3001/fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixtureData),
      });

      if (response.ok) {
        showMessage('success', 'Fixture added successfully!');
        setIsAddFixtureOpen(false);
        setFormData({
          homeTeam: '',
          awayTeam: '',
          date: '',
          time: '',
          venue: '',
          round: 1,
          leagueId: ''
        });
        onUpdate();
      } else {
        throw new Error('Failed to add fixture');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to add fixture');
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSuggestionClick = (field, teamName, userName) => {
    setFormData(prev => ({
      ...prev,
      [field]: teamName || userName
    }));
    
    if (field === 'homeTeam') {
      setShowHomeSuggestions(false);
    } else {
      setShowAwaySuggestions(false);
    }
  };

  const handleDeleteFixture = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to delete this fixture? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/fixtures/${fixtureId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', 'Fixture deleted successfully!');
        onUpdate();
      } else {
        throw new Error('Failed to delete fixture');
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to delete fixture');
    }
  };

  // Get all registered users with their teams
  const registeredUsers = users.filter(user => user.teamName);
  
  // Get teams that are already scheduled in upcoming fixtures
  const scheduledTeams = new Set([
    ...scheduledFixtures.map(f => f.homeTeam),
    ...scheduledFixtures.map(f => f.awayTeam)
  ]);

  // Available users (not scheduled in upcoming matches)
  const availableUsers = registeredUsers.filter(user => !scheduledTeams.has(user.teamName));

  // Users currently scheduled
  const scheduledUsers = registeredUsers.filter(user => scheduledTeams.has(user.teamName));

  // Get league name for a fixture
  const getLeagueName = (fixture) => {
    if (!fixture.leagueId) return 'General';
    const league = leagues.find(l => l.id === fixture.leagueId);
    return league ? league.name : 'Unknown League';
  };

  // Get league badge color
  const getLeagueBadgeColor = (fixture) => {
    if (!fixture.leagueId) return 'from-gray-500 to-gray-600';
    const leagueColors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-blue-500'
    ];
    return leagueColors[fixture.leagueId % leagueColors.length];
  };

  return (
    <div className="space-y-8">
      {/* Header with League Filter */}
      <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Fixture Management</h2>
            <p className="text-gray-600">Schedule and manage matches across all leagues</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* League Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-semibold">Filter by League:</span>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Leagues</option>
                <option value="general">General Fixtures</option>
                {leagues.map(league => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddFixtureOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg"
            >
              ➕ Schedule New Match
            </button>
          </div>
        </div>

        {/* League Statistics */}
        <div className="grid grid-cols-1 md:grid-rows-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-blue-500 text-lg">📊</span>
              <h4 className="font-semibold text-gray-800">Total Matches</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filteredFixtures.length}</p>
            <p className="text-gray-500 text-sm">
              {selectedLeague === 'all' ? 'All leagues' : 
               selectedLeague === 'general' ? 'General fixtures' : 
               leagues.find(l => l.id === parseInt(selectedLeague))?.name}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-green-500 text-lg">✅</span>
              <h4 className="font-semibold text-gray-800">Completed</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedFixtures.length}</p>
            <p className="text-gray-500 text-sm">Matches played</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-orange-500 text-lg">⏰</span>
              <h4 className="font-semibold text-gray-800">Scheduled</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{scheduledFixtures.length}</p>
            <p className="text-gray-500 text-sm">Upcoming matches</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-purple-500 text-lg">🏆</span>
              <h4 className="font-semibold text-gray-800">Leagues</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{leagues.length}</p>
            <p className="text-gray-500 text-sm">Active competitions</p>
          </div>
        </div>
      </div>

      {/* Add Fixture Modal */}
      {isAddFixtureOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Schedule New Match</h3>
              <button
                onClick={() => setIsAddFixtureOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddFixture} className="space-y-4">
              {/* League Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  League Assignment
                </label>
                <select
                  name="leagueId"
                  value={formData.leagueId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">General Fixture (No League)</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name} ({league.teams?.length || 0}/{league.maxTeams} teams)
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Assign this match to a specific league or keep it as a general fixture
                </div>
              </div>

              {/* Home Team Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Home Team *
                </label>
                <input
                  type="text"
                  name="homeTeam"
                  value={formData.homeTeam}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search team or manager..."
                  autoComplete="off"
                />
                {showHomeSuggestions && filteredHomeTeams.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredHomeTeams.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleSuggestionClick('homeTeam', user.teamName, user.name)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition duration-200"
                      >
                        <div className="font-semibold text-gray-800">{user.teamName}</div>
                        <div className="text-sm text-gray-500 flex justify-between items-center">
                          <span>Manager: {user.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            availableUsers.some(u => u.id === user.id) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {availableUsers.some(u => u.id === user.id) ? 'Available' : 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {formData.homeTeam && availableUsers.some(user => 
                    user.teamName === formData.homeTeam || user.name === formData.homeTeam
                  ) ? (
                    <span className="text-green-600">✅ This team is available for scheduling</span>
                  ) : formData.homeTeam && scheduledUsers.some(user => 
                    user.teamName === formData.homeTeam || user.name === formData.homeTeam
                  ) ? (
                    <span className="text-orange-600">⚠️ This team is already scheduled</span>
                  ) : formData.homeTeam ? (
                    <span className="text-red-600">❌ Team not found in registered users</span>
                  ) : (
                    'Search for registered teams by team name or manager'
                  )}
                </div>
              </div>

              {/* Away Team Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Away Team *
                </label>
                <input
                  type="text"
                  name="awayTeam"
                  value={formData.awayTeam}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search team or manager..."
                  autoComplete="off"
                />
                {showAwaySuggestions && filteredAwayTeams.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredAwayTeams.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleSuggestionClick('awayTeam', user.teamName, user.name)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition duration-200"
                      >
                        <div className="font-semibold text-gray-800">{user.teamName}</div>
                        <div className="text-sm text-gray-500 flex justify-between items-center">
                          <span>Manager: {user.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            availableUsers.some(u => u.id === user.id) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {availableUsers.some(u => u.id === user.id) ? 'Available' : 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {formData.awayTeam && availableUsers.some(user => 
                    user.teamName === formData.awayTeam || user.name === formData.awayTeam
                  ) ? (
                    <span className="text-green-600">✅ This team is available for scheduling</span>
                  ) : formData.awayTeam && scheduledUsers.some(user => 
                    user.teamName === formData.awayTeam || user.name === formData.awayTeam
                  ) ? (
                    <span className="text-orange-600">⚠️ This team is already scheduled</span>
                  ) : formData.awayTeam ? (
                    <span className="text-red-600">❌ Team not found in registered users</span>
                  ) : (
                    'Search for registered teams by team name or manager'
                  )}
                </div>
              </div>

              {/* Match Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Match Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter match venue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Round Number *
                </label>
                <input
                  type="number"
                  name="round"
                  value={formData.round}
                  onChange={handleFormChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Validation Summary */}
              {(formData.homeTeam || formData.awayTeam) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Match Validation</h4>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center space-x-2 ${
                      formData.homeTeam && formData.awayTeam && formData.homeTeam !== formData.awayTeam 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      <span>{formData.homeTeam && formData.awayTeam && formData.homeTeam !== formData.awayTeam ? '✅' : '❌'}</span>
                      <span>Teams must be different</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${
                      !formData.homeTeam || availableUsers.some(user => 
                        user.teamName === formData.homeTeam || user.name === formData.homeTeam
                      ) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>{!formData.homeTeam || availableUsers.some(user => 
                        user.teamName === formData.homeTeam || user.name === formData.homeTeam
                      ) ? '✅' : '❌'}</span>
                      <span>Home team must be registered and available</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${
                      !formData.awayTeam || availableUsers.some(user => 
                        user.teamName === formData.awayTeam || user.name === formData.awayTeam
                      ) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>{!formData.awayTeam || availableUsers.some(user => 
                        user.teamName === formData.awayTeam || user.name === formData.awayTeam
                      ) ? '✅' : '❌'}</span>
                      <span>Away team must be registered and available</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFixtureOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-xl transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    formData.homeTeam === formData.awayTeam ||
                    !availableUsers.some(user => 
                      user.teamName === formData.homeTeam || user.name === formData.homeTeam
                    ) ||
                    !availableUsers.some(user => 
                      user.teamName === formData.awayTeam || user.name === formData.awayTeam
                    )
                  }
                >
                  Schedule Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Fixtures */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Completed Matches</h3>
              <p className="text-gray-600">Match results and statistics</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {completedFixtures.length} of {fixtures.filter(f => f.status === 'completed').length} completed matches
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {completedFixtures.map(fixture => (
            <div key={fixture.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 transition duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    COMPLETED
                  </span>
                  <span className={`bg-gradient-to-r ${getLeagueBadgeColor(fixture)} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                    {getLeagueName(fixture)}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Round {fixture.round}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResetFixture(fixture.id)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    🔄 Reset
                  </button>
                  <button
                    onClick={() => handleDeleteFixture(fixture.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
                  >
                    🗑️ Delete
                  </button>
                  <div className="text-sm text-gray-500">
                    {new Date(fixture.date).toLocaleDateString()} • {fixture.time}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="font-bold text-gray-900 text-xl mb-2">{fixture.homeTeam}</div>
                  <div className="text-3xl font-black text-green-600 bg-white py-3 rounded-xl shadow-inner border border-green-200">
                    {fixture.homeScore}
                  </div>
                </div>
                
                <div className="text-center mx-8">
                  <div className="text-4xl font-black text-gray-400 mb-2">VS</div>
                  <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    🏟️ {fixture.venue}
                  </div>
                </div>
                
                <div className="text-center flex-1">
                  <div className="font-bold text-gray-900 text-xl mb-2">{fixture.awayTeam}</div>
                  <div className="text-3xl font-black text-green-600 bg-white py-3 rounded-xl shadow-inner border border-green-200">
                    {fixture.awayScore}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {completedFixtures.length === 0 && (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">⚽</div>
            <h4 className="text-xl font-bold text-gray-600 mb-2">No Completed Matches</h4>
            <p className="text-gray-500">
              {selectedLeague === 'all' 
                ? 'Match results will appear here once games are completed.' 
                : `No completed matches found in ${selectedLeague === 'general' ? 'general fixtures' : 'this league'}.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Scheduled Fixtures */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 text-lg">⏰</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Upcoming Matches</h3>
              <p className="text-gray-600">Scheduled fixtures awaiting results</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {scheduledFixtures.length} of {fixtures.filter(f => f.status === 'scheduled').length} scheduled matches
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scheduledFixtures.map(fixture => (
            <div key={fixture.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-300 transition duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Round {fixture.round}
                  </span>
                  <span className={`bg-gradient-to-r ${getLeagueBadgeColor(fixture)} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                    {getLeagueName(fixture)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteFixture(fixture.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300"
                  title="Delete fixture"
                >
                  🗑️
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <div className="font-bold text-gray-900 text-lg">{fixture.homeTeam}</div>
                  <div className="text-blue-500 text-sm font-semibold">Home</div>
                </div>
                
                <div className="text-center mx-4">
                  <div className="text-2xl font-black text-gray-400 mb-1">VS</div>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                    {new Date(fixture.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{fixture.time}</div>
                </div>
                
                <div className="text-center flex-1">
                  <div className="font-bold text-gray-900 text-lg">{fixture.awayTeam}</div>
                  <div className="text-cyan-500 text-sm font-semibold">Away</div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 bg-white py-2 rounded-lg border border-blue-200">
                🏟️ {fixture.venue}
              </div>
            </div>
          ))}
        </div>

        {scheduledFixtures.length === 0 && (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🎉</div>
            <h4 className="text-xl font-bold text-gray-600 mb-2">
              {selectedLeague === 'all' 
                ? 'All Matches Completed' 
                : `No Scheduled Matches in ${selectedLeague === 'general' ? 'General Fixtures' : 'This League'}`
              }
            </h4>
            <p className="text-gray-500">
              {selectedLeague === 'all' 
                ? 'No scheduled matches remaining. Schedule new matches using the button above.'
                : 'All matches in this category have been completed or scheduled.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFixtures;