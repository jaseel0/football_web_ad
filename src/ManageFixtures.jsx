// components/ManageFixtures.jsx
import React, { useState, useEffect } from 'react';

const ManageFixtures = ({ fixtures, onUpdate, showMessage }) => {
  const API_BASE = "https://football-web-bd.onrender.com";
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [filteredHomeTeams, setFilteredHomeTeams] = useState([]);
  const [filteredAwayTeams, setFilteredAwayTeams] = useState([]);
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);
  const [showAwaySuggestions, setShowAwaySuggestions] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fixturesPerPage] = useState(6);
  
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
        const response = await fetch(`${API_BASE}/users`);
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
        const response = await fetch(`${API_BASE}/leagues`);
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

  // Filter fixtures based on selected filters
  const filteredFixtures = fixtures.filter(fixture => {
    // League filter
    const leagueMatch = selectedLeague === 'all' || 
      (selectedLeague === 'general' ? !fixture.leagueId : fixture.leagueId === parseInt(selectedLeague));
    
    // Status filter
    const statusMatch = statusFilter === 'all' || fixture.status === statusFilter;
    
    // Date filter
    const dateMatch = !dateFilter || fixture.date === dateFilter;
    
    // Search filter
    const searchMatch = !searchTerm || 
      fixture.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.venue.toLowerCase().includes(searchTerm.toLowerCase());

    return leagueMatch && statusMatch && dateMatch && searchMatch;
  });

  const completedFixtures = filteredFixtures.filter(f => f.status === 'completed');
  const scheduledFixtures = filteredFixtures.filter(f => f.status === 'scheduled');
  const liveFixtures = filteredFixtures.filter(f => f.status === 'live');

  // Filter teams based on input
  useEffect(() => {
    if (formData.homeTeam) {
      const filtered = users
        .filter(user => 
          user.teamName?.toLowerCase().includes(formData.homeTeam.toLowerCase()) ||
          user.username?.toLowerCase().includes(formData.homeTeam.toLowerCase())
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
          user.username?.toLowerCase().includes(formData.awayTeam.toLowerCase())
        )
        .slice(0, 5);
      setFilteredAwayTeams(filtered);
      setShowAwaySuggestions(true);
    } else {
      setFilteredAwayTeams([]);
      setShowAwaySuggestions(false);
    }
  }, [formData.awayTeam, users]);

  // Pagination logic
  const indexOfLastFixture = currentPage * fixturesPerPage;
  const indexOfFirstFixture = indexOfLastFixture - fixturesPerPage;
  const currentFixtures = filteredFixtures.slice(indexOfFirstFixture, indexOfLastFixture);
  const totalPages = Math.ceil(filteredFixtures.length / fixturesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLeague, statusFilter, dateFilter, searchTerm]);

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

  const handleResetFixture = async (fixtureId) => {
    if (!window.confirm('Are you sure you want to reset this fixture? This will remove the scores and mark it as scheduled.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/fixtures/${fixtureId}`, {
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
      user.teamName === formData.homeTeam || user.username === formData.homeTeam
    );
    const awayUser = users.find(user => 
      user.teamName === formData.awayTeam || user.username === formData.awayTeam
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
      fixtureData.leagueId = formData.leagueId;
    }

    try {
      const response = await fetch(`${API_BASE}/fixtures`, {
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
      const response = await fetch(`${API_BASE}/fixtures/${fixtureId}`, {
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

  // Function to get initials from team name
  const getInitials = (teamName) => {
    if (!teamName) return 'TM';
    return teamName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Function to generate random color based on team name
  const getTeamColor = (teamName) => {
    const colors = [
      'bg-[#850cec]', 'bg-purple-600', 'bg-blue-600', 'bg-green-600',
      'bg-red-600', 'bg-yellow-600', 'bg-pink-600', 'bg-indigo-600'
    ];
    const index = (teamName?.length || 0) % colors.length;
    return colors[index];
  };

  // Get league name for a fixture
  const getLeagueName = (fixture) => {
    if (!fixture.leagueId) return 'General';
    const league = leagues.find(l => l.id === fixture.leagueId);
    return league ? league.name : 'Unknown League';
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'live': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'scheduled': return '⏰';
      case 'live': return '🔴';
      default: return '⚫';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">Fixture Management</h2>
            <p className="text-gray-400">Schedule and manage matches across all leagues</p>
          </div>
          
          <button
            onClick={() => setIsAddFixtureOpen(true)}
            className="bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-purple-700 hover:to-[#850cec] text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg shadow-[#850cec]/30"
          >
            ➕ Schedule New Match
          </button>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* League Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              League
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
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

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
            />
          </div>

          {/* Search Filter */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teams or venue..."
                className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-[#850cec] mb-1">{filteredFixtures.length}</div>
            <div className="text-gray-400 text-sm">Total Matches</div>
          </div>
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-green-400 mb-1">{completedFixtures.length}</div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-blue-400 mb-1">{scheduledFixtures.length}</div>
            <div className="text-gray-400 text-sm">Scheduled</div>
          </div>
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-red-400 mb-1">{liveFixtures.length}</div>
            <div className="text-gray-400 text-sm">Live</div>
          </div>
        </div>
      </div>

      {/* Add Fixture Modal */}
      {isAddFixtureOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Schedule New Match</h3>
              <button
                onClick={() => setIsAddFixtureOpen(false)}
                className="text-gray-400 hover:text-white text-2xl transition duration-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddFixture} className="space-y-4">
              {/* League Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  League Assignment
                </label>
                <select
                  name="leagueId"
                  value={formData.leagueId}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                >
                  <option value="">General Fixture (No League)</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Home Team Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Home Team *
                </label>
                <input
                  type="text"
                  name="homeTeam"
                  value={formData.homeTeam}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                  placeholder="Search team or manager..."
                  autoComplete="off"
                />
                {showHomeSuggestions && filteredHomeTeams.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredHomeTeams.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleSuggestionClick('homeTeam', user.teamName, user.username)}
                        className="px-4 py-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0 transition duration-200"
                      >
                        <div className="font-semibold text-white">{user.teamName}</div>
                        <div className="text-sm text-gray-400">@{user.username}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Away Team Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Away Team *
                </label>
                <input
                  type="text"
                  name="awayTeam"
                  value={formData.awayTeam}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                  placeholder="Search team or manager..."
                  autoComplete="off"
                />
                {showAwaySuggestions && filteredAwayTeams.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredAwayTeams.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleSuggestionClick('awayTeam', user.teamName, user.username)}
                        className="px-4 py-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0 transition duration-200"
                      >
                        <div className="font-semibold text-white">{user.teamName}</div>
                        <div className="text-sm text-gray-400">@{user.username}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Match Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Match Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                  placeholder="Enter match venue"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Round Number *
                </label>
                <input
                  type="number"
                  name="round"
                  value={formData.round}
                  onChange={handleFormChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFixtureOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#850cec] hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formData.homeTeam === formData.awayTeam}
                >
                  Schedule Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Count and Pagination Info */}
      <div className="flex justify-between items-center">
        <p className="text-gray-400">
          Showing <span className="text-[#850cec] font-semibold">
            {filteredFixtures.length === 0 ? 0 : indexOfFirstFixture + 1}-{Math.min(indexOfLastFixture, filteredFixtures.length)}
          </span> of{' '}
          <span className="text-purple-400 font-semibold">{filteredFixtures.length}</span> fixtures
        </p>
        
        {totalPages > 1 && (
          <div className="text-gray-400 text-sm">
            Page <span className="text-[#850cec] font-semibold">{currentPage}</span> of{' '}
            <span className="text-purple-400 font-semibold">{totalPages}</span>
          </div>
        )}
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-1 gap-6">
        {currentFixtures.map(fixture => (
          <div key={fixture.id} className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700 hover:border-[#850cec] transition duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeColor(fixture.status)}`}>
                  {getStatusIcon(fixture.status)} {fixture.status.toUpperCase()}
                </span>
                <span className="bg-[#850cec]/20 text-[#850cec] px-3 py-1 rounded-full text-sm font-semibold border border-[#850cec]/30">
                  {getLeagueName(fixture)}
                </span>
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                  Round {fixture.round}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {fixture.status === 'completed' && (
                  <button
                    onClick={() => handleResetFixture(fixture.id)}
                    className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-lg transition duration-300 border border-yellow-500/30"
                  >
                    🔄 Reset
                  </button>
                )}
                <button
                  onClick={() => handleDeleteFixture(fixture.id)}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition duration-300 border border-red-500/30"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getTeamColor(fixture.homeTeam)}`}>
                    {getInitials(fixture.homeTeam)}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{fixture.homeTeam}</div>
                    <div className="text-sm text-gray-400">Home</div>
                  </div>
                </div>
                {fixture.status === 'completed' && (
                  <div className="text-2xl font-black text-green-400 bg-gray-700 py-2 rounded-xl">
                    {fixture.homeScore}
                  </div>
                )}
              </div>
              
              <div className="text-center mx-4">
                <div className="text-2xl font-black text-gray-400 mb-2">VS</div>
                <div className="text-sm text-gray-500">
                  {new Date(fixture.date).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">{fixture.time}</div>
                <div className="text-xs text-gray-500 mt-1">🏟️ {fixture.venue}</div>
              </div>
              
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div>
                    <div className="text-lg font-bold text-white">{fixture.awayTeam}</div>
                    <div className="text-sm text-gray-400">Away</div>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getTeamColor(fixture.awayTeam)}`}>
                    {getInitials(fixture.awayTeam)}
                  </div>
                </div>
                {fixture.status === 'completed' && (
                  <div className="text-2xl font-black text-green-400 bg-gray-700 py-2 rounded-xl">
                    {fixture.awayScore}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-semibold transition duration-300 ${
              currentPage === 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-[#850cec]'
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
                  ? 'bg-[#850cec] text-white shadow-lg shadow-[#850cec]/30'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
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
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-[#850cec]'
            }`}
          >
            Next →
          </button>
        </div>
      )}

      {filteredFixtures.length === 0 && (
        <div className="text-center py-16 bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600">
          <div className="text-6xl mb-4">🔍</div>
          <h4 className="text-2xl font-bold text-gray-400 mb-2">No Fixtures Found</h4>
          <p className="text-gray-500">
            {searchTerm || selectedLeague !== 'all' || statusFilter !== 'all' || dateFilter
              ? 'Try adjusting your filters to see more results.'
              : 'No fixtures scheduled yet. Schedule your first match using the button above.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageFixtures;