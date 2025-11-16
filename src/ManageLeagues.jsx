// components/ManageLeagues.jsx
import React, { useState, useEffect } from 'react';

const ManageLeagues = ({ users, onUpdate, showMessage }) => {
  const API_BASE = "https://football-web-bd.onrender.com";
  const [leagues, setLeagues] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [isCreateLeagueOpen, setIsCreateLeagueOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [viewMode, setViewMode] = useState('leagues'); // 'leagues', 'fixtures'
  const [newLeague, setNewLeague] = useState({
    name: '',
    description: '',
    maxTeams: 8
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [leaguesPerPage] = useState(6);

  // Fetch leagues and fixtures
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leaguesRes, fixturesRes] = await Promise.all([
        fetch(`${API_BASE}/leagues`),
        fetch(`${API_BASE}/fixtures`)
      ]);

      if (leaguesRes.ok) {
        const leaguesData = await leaguesRes.json();
        setLeagues(leaguesData);
      }

      if (fixturesRes.ok) {
        const fixturesData = await fixturesRes.json();
        setFixtures(fixturesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/leagues`, {
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
        fetchData();
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
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}`, {
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
        fetchData();
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
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}`, {
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
        fetchData();
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
      const response = await fetch(`${API_BASE}/leagues/${leagueId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', 'League deleted successfully!');
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to delete league');
    }
  };

  const generateFixturesForLeague = async (league) => {
    if (league.teams.length < 2) {
      showMessage('error', 'Need at least 2 teams to generate fixtures');
      return;
    }

    try {
      // Delete existing fixtures for this league
      const leagueFixtures = fixtures.filter(f => f.leagueId === league.id);
      await Promise.all(
        leagueFixtures.map(fixture => 
          fetch(`${API_BASE}/fixtures/${fixture.id}`, { method: 'DELETE' })
        )
      );

      // Generate new fixtures (round-robin)
      const teams = league.teams;
      const newFixtures = [];
      let fixtureId = Date.now();

      // Generate home and away matches
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          // Home match
          newFixtures.push({
            id: `f_${fixtureId++}`,
            homeTeam: teams[i],
            awayTeam: teams[j],
            homeScore: null,
            awayScore: null,
            date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '20:00',
            venue: 'Main Arena',
            round: 1,
            status: 'scheduled',
            leagueId: league.id
          });

          // Away match
          newFixtures.push({
            id: `f_${fixtureId++}`,
            homeTeam: teams[j],
            awayTeam: teams[i],
            homeScore: null,
            awayScore: null,
            date: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '20:00',
            venue: 'Main Arena',
            round: 2,
            status: 'scheduled',
            leagueId: league.id
          });
        }
      }

      // Post new fixtures
      await Promise.all(
        newFixtures.map(fixture =>
          fetch(`${API_BASE}/fixtures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fixture)
          })
        )
      );

      showMessage('success', `Generated ${newFixtures.length} fixtures for ${league.name}`);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Error generating fixtures:', error);
      showMessage('error', 'Failed to generate fixtures');
    }
  };

  const viewFixturesForLeague = (league) => {
    setSelectedLeague(league);
    setViewMode('fixtures');
  };

  const getLeagueFixtures = (leagueId) => {
    return fixtures.filter(f => f.leagueId === leagueId);
  };

  const updateFixtureScore = async (fixtureId, homeScore, awayScore) => {
    try {
      const response = await fetch(`${API_BASE}/fixtures/${fixtureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
          status: 'completed'
        })
      });

      if (response.ok) {
        showMessage('success', 'Fixture score updated!');
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating fixture:', error);
      showMessage('error', 'Failed to update fixture score');
    }
  };

  // Pagination logic
  const indexOfLastLeague = currentPage * leaguesPerPage;
  const indexOfFirstLeague = indexOfLastLeague - leaguesPerPage;
  const currentLeagues = leagues.slice(indexOfFirstLeague, indexOfLastLeague);
  const totalPages = Math.ceil(leagues.length / leaguesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

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

  const registeredUsers = users.filter(user => user.teamName);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 pt-16">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {viewMode === 'fixtures' ? `${selectedLeague?.name} Fixtures` : 'League Management'}
          </h1>
          <p className="text-xl text-gray-300">
            {viewMode === 'fixtures' 
              ? 'Manage fixtures and update scores' 
              : 'Create and manage multiple leagues for your eFootball competition'
            }
          </p>
        </div>

        {/* Navigation */}
        {viewMode === 'fixtures' && (
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setViewMode('leagues')}
              className="flex items-center text-[#850cec] hover:text-purple-400 transition duration-300"
            >
              ← Back to Leagues
            </button>
            <div className="text-gray-400">
              {getLeagueFixtures(selectedLeague?.id)?.length} Fixtures
            </div>
          </div>
        )}

        {/* View Mode: Leagues */}
        {viewMode === 'leagues' && (
          <div className="space-y-8">
            {/* Create League Section */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">🏆 League Management</h2>
              <p className="text-gray-400 mb-6 text-lg">Create and organize competitive eFootball leagues</p>
              
              <button
                onClick={() => setIsCreateLeagueOpen(true)}
                className="bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-purple-700 hover:to-[#850cec] text-white font-bold py-4 px-8 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg shadow-[#850cec]/30"
              >
                Create New League
              </button>
            </div>

            {/* Create League Modal */}
            {isCreateLeagueOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Create New League</h3>
                    <button
                      onClick={() => setIsCreateLeagueOpen(false)}
                      className="text-gray-400 hover:text-white text-2xl transition duration-300"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleCreateLeague} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        League Name *
                      </label>
                      <input
                        type="text"
                        value={newLeague.name}
                        onChange={(e) => setNewLeague({...newLeague, name: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter league name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newLeague.description}
                        onChange={(e) => setNewLeague({...newLeague, description: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Enter league description"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Maximum Teams
                      </label>
                      <input
                        type="number"
                        value={newLeague.maxTeams}
                        onChange={(e) => setNewLeague({...newLeague, maxTeams: parseInt(e.target.value)})}
                        min="4"
                        max="20"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white"
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsCreateLeagueOpen(false)}
                        className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-[#850cec] hover:bg-purple-700 text-white font-semibold rounded-xl transition duration-300"
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
              {currentLeagues.map(league => (
                <div key={league.id} className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700 hover:border-[#850cec] transition duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#850cec] transition duration-300">
                        {league.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{league.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteLeague(league.id)}
                      className="text-red-400 hover:text-red-300 transition duration-300 p-2"
                      title="Delete league"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Teams: {league.teams.length}/{league.maxTeams}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        league.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {league.status}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                      <div 
                        className="bg-[#850cec] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(league.teams.length / league.maxTeams) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Teams List */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-gray-300 text-sm">Teams in League:</h4>
                    {league.teams.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {league.teams.map((team, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-700/50 px-3 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getTeamColor(team)}`}>
                                {getInitials(team)}
                              </div>
                              <span className="text-sm text-gray-200">{team}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveTeamFromLeague(league.id, team)}
                              className="text-red-400 hover:text-red-300 text-xs transition duration-300"
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
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Add Team to League
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTeamToLeague(league.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-sm text-white"
                      >
                        <option value="">Select a team...</option>
                        {registeredUsers
                          .filter(user => !league.teams.includes(user.teamName))
                          .map(user => (
                            <option key={user.id} value={user.teamName}>
                              {user.teamName} (@{user.username})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  )}

                  {/* League Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewFixturesForLeague(league)}
                      className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 text-sm font-semibold rounded-lg transition duration-300 border border-blue-500/30"
                    >
                      View Fixtures
                    </button>
                    <button
                      onClick={() => generateFixturesForLeague(league)}
                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 text-sm font-semibold rounded-lg transition duration-300 border border-green-500/30"
                    >
                      Generate Fixtures
                    </button>
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

            {leagues.length === 0 && (
              <div className="text-center py-16 bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600">
                <div className="text-6xl mb-4">🏆</div>
                <h4 className="text-2xl font-bold text-gray-400 mb-2">No Leagues Created Yet</h4>
                <p className="text-gray-500 mb-6">Create your first league to organize teams and matches.</p>
                <button
                  onClick={() => setIsCreateLeagueOpen(true)}
                  className="bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-purple-700 hover:to-[#850cec] text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg"
                >
                  Create Your First League
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Mode: Fixtures */}
        {viewMode === 'fixtures' && selectedLeague && (
          <div className="space-y-6">
            {/* Fixtures List */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">📅 League Fixtures</h3>
              
              <div className="space-y-4">
                {getLeagueFixtures(selectedLeague.id).map(fixture => (
                  <div key={fixture.id} className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-[#850cec] transition duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-center flex-1">
                          <div className="flex items-center justify-center gap-3">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getTeamColor(fixture.homeTeam)}`}>
                              {getInitials(fixture.homeTeam)}
                            </div>
                            <div>
                              <div className="text-lg font-bold text-white">{fixture.homeTeam}</div>
                              <div className="text-sm text-gray-400">Home</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center mx-4">
                          {fixture.status === 'completed' ? (
                            <div className="text-2xl font-bold text-white">
                              {fixture.homeScore} - {fixture.awayScore}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-gray-300">VS</div>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(fixture.date).toLocaleDateString()} {fixture.time}
                          </div>
                          <div className="text-xs text-gray-500">{fixture.venue}</div>
                        </div>
                        
                        <div className="text-center flex-1">
                          <div className="flex items-center justify-center gap-3">
                            <div>
                              <div className="text-lg font-bold text-white">{fixture.awayTeam}</div>
                              <div className="text-sm text-gray-400">Away</div>
                            </div>
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getTeamColor(fixture.awayTeam)}`}>
                              {getInitials(fixture.awayTeam)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          fixture.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : fixture.status === 'live'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {fixture.status.toUpperCase()}
                        </span>
                        
                        {fixture.status === 'scheduled' && (
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              placeholder="H"
                              className="w-12 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-center"
                              onBlur={(e) => {
                                if (e.target.value && fixture.awayScore !== null) {
                                  updateFixtureScore(fixture.id, e.target.value, fixture.awayScore);
                                }
                              }}
                            />
                            <input
                              type="number"
                              min="0"
                              max="20"
                              placeholder="A"
                              className="w-12 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-center"
                              onBlur={(e) => {
                                if (e.target.value && fixture.homeScore !== null) {
                                  updateFixtureScore(fixture.id, fixture.homeScore, e.target.value);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {getLeagueFixtures(selectedLeague.id).length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-4">📅</div>
                  <p>No fixtures generated yet. Click "Generate Fixtures" to create matches.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => generateFixturesForLeague(selectedLeague)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl transition duration-300"
              >
                🔄 Generate Fixtures
              </button>
              <button
                onClick={() => setViewMode('leagues')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-2xl transition duration-300"
              >
                ← Back to Leagues
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLeagues;