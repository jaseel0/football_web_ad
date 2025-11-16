// components/UpdateScores.jsx
import React, { useState, useEffect } from 'react';

const UpdateScores = ({ users, fixtures, onUpdate, showMessage }) => {
  const API_BASE = "http://localhost:3001";
  const [scoreUpdate, setScoreUpdate] = useState({
    fixtureId: '',
    homeScore: '',
    awayScore: ''
  });
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [fixturesPerPage] = useState(5);

  // Fetch leagues
  useEffect(() => {
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
    
    fetchLeagues();
  }, []);

  // FIXED: Filter fixtures based on selected league
  const scheduledFixtures = fixtures.filter(fixture => {
    // Only show scheduled fixtures
    if (fixture.status !== 'scheduled') return false;

    // Handle league filtering
    if (selectedLeague === 'all') return true;
    if (selectedLeague === 'general') return !fixture.leagueId;
    
    // Handle both string and number league IDs
    const fixtureLeagueId = fixture.leagueId?.toString();
    const selectedLeagueId = selectedLeague.toString();
    
    return fixtureLeagueId === selectedLeagueId;
  });

  // Pagination logic
  const indexOfLastFixture = currentPage * fixturesPerPage;
  const indexOfFirstFixture = indexOfLastFixture - fixturesPerPage;
  const currentFixtures = scheduledFixtures.slice(indexOfFirstFixture, indexOfLastFixture);
  const totalPages = Math.ceil(scheduledFixtures.length / fixturesPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Reset to first page when league changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLeague]);

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

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    
    if (!scoreUpdate.fixtureId || scoreUpdate.homeScore === '' || scoreUpdate.awayScore === '') {
      showMessage('error', 'Please select a fixture and enter both scores');
      return;
    }

    const homeScore = parseInt(scoreUpdate.homeScore);
    const awayScore = parseInt(scoreUpdate.awayScore);

    if (homeScore < 0 || awayScore < 0) {
      showMessage('error', 'Scores cannot be negative');
      return;
    }

    try {
      // Update fixture
      const fixtureResponse = await fetch(`${API_BASE}/fixtures/${scoreUpdate.fixtureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeScore: homeScore,
          awayScore: awayScore,
          status: 'completed'
        }),
      });

      if (!fixtureResponse.ok) {
        throw new Error('Failed to update fixture');
      }

      const fixture = fixtures.find(f => f.id === scoreUpdate.fixtureId);
      if (fixture) {
        await updateUserStats(fixture.homeTeam, fixture.awayTeam, homeScore, awayScore);
      }

      showMessage('success', 'Score updated successfully!');
      setScoreUpdate({ fixtureId: '', homeScore: '', awayScore: '' });
      onUpdate();
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to update score');
    }
  };

  const updateUserStats = async (homeTeam, awayTeam, homeScore, awayScore) => {
    const homeUser = users.find(u => u.teamName === homeTeam);
    const awayUser = users.find(u => u.teamName === awayTeam);

    if (!homeUser || !awayUser) {
      throw new Error('Users not found');
    }

    const homeUpdates = calculateUserUpdates(homeUser, homeScore, awayScore, homeScore > awayScore, homeScore === awayScore);
    const awayUpdates = calculateUserUpdates(awayUser, awayScore, homeScore, awayScore > homeScore, homeScore === awayScore);

    await fetch(`${API_BASE}/users/${homeUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(homeUpdates),
    });

    await fetch(`${API_BASE}/users/${awayUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(awayUpdates),
    });
  };

  const calculateUserUpdates = (user, goalsFor, goalsAgainst, isWin, isDraw) => {
    const newForm = [isWin ? 'W' : isDraw ? 'D' : 'L', ...(user.form || []).slice(0, 4)];
    
    return {
      played: (user.played || 0) + 1,
      won: (user.won || 0) + (isWin ? 1 : 0),
      drawn: (user.drawn || 0) + (isDraw ? 1 : 0),
      lost: (user.lost || 0) + (!isWin && !isDraw ? 1 : 0),
      goalsFor: (user.goalsFor || 0) + goalsFor,
      goalsAgainst: (user.goalsAgainst || 0) + goalsAgainst,
      goalDifference: ((user.goalsFor || 0) + goalsFor) - ((user.goalsAgainst || 0) + goalsAgainst),
      points: (user.points || 0) + (isWin ? 3 : isDraw ? 1 : 0),
      form: newForm
    };
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
    const league = leagues.find(l => l.id.toString() === fixture.leagueId.toString());
    return league ? league.name : 'Unknown League';
  };

  // Debug: Log the filtering results
  useEffect(() => {
    console.log('Filtered fixtures:', {
      selectedLeague,
      totalFixtures: fixtures.length,
      scheduledFixtures: scheduledFixtures.length,
      leagues: leagues.map(l => ({ id: l.id, name: l.name }))
    });
  }, [selectedLeague, fixtures, leagues]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Update Score Form */}
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <span className="text-green-400 text-lg">⚽</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Update Match Score</h3>
            <p className="text-gray-400">Record match results and update player stats</p>
          </div>
        </div>

        <form onSubmit={handleUpdateScore} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Select Fixture <span className="text-red-400">*</span>
              </label>
              <select
                value={scoreUpdate.fixtureId}
                onChange={(e) => setScoreUpdate({...scoreUpdate, fixtureId: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-white transition duration-300"
                required
              >
                <option value="" className="text-gray-400">Choose a scheduled match...</option>
                {scheduledFixtures.map(fixture => (
                  <option key={fixture.id} value={fixture.id} className="text-white">
                    {getLeagueName(fixture)} - Round {fixture.round}: {fixture.homeTeam} vs {fixture.awayTeam}
                  </option>
                ))}
              </select>
            </div>
            
            {scoreUpdate.fixtureId && (
              <div className="bg-gray-700 rounded-xl p-6 border-2 border-[#850cec]">
                <div className="text-center mb-4">
                  <span className="bg-[#850cec] text-white px-3 py-1 rounded-full text-sm font-bold">
                    Selected Match
                  </span>
                </div>
                
                {/* Selected Match Preview */}
                {(() => {
                  const selectedFixture = scheduledFixtures.find(f => f.id === scoreUpdate.fixtureId);
                  return selectedFixture ? (
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getTeamColor(selectedFixture.homeTeam)}`}>
                            {getInitials(selectedFixture.homeTeam)}
                          </div>
                          <div className="font-bold text-white text-sm">{selectedFixture.homeTeam}</div>
                        </div>
                        <div className="text-gray-400 text-xs">Home</div>
                      </div>
                      
                      <div className="text-center mx-4">
                        <div className="text-lg font-black text-gray-400 mb-1">VS</div>
                        <div className="text-xs text-gray-500">
                          {new Date(selectedFixture.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">{selectedFixture.time}</div>
                      </div>
                      
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="font-bold text-white text-sm">{selectedFixture.awayTeam}</div>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getTeamColor(selectedFixture.awayTeam)}`}>
                            {getInitials(selectedFixture.awayTeam)}
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">Away</div>
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 text-center">
                      Home Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scoreUpdate.homeScore}
                      onChange={(e) => setScoreUpdate({...scoreUpdate, homeScore: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-600 border-2 border-[#850cec] rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-center text-lg font-bold text-white transition duration-300"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 text-center">
                      Away Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={scoreUpdate.awayScore}
                      onChange={(e) => setScoreUpdate({...scoreUpdate, awayScore: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-600 border-2 border-[#850cec] rounded-xl focus:outline-none focus:border-[#850cec] focus:ring-2 focus:ring-[#850cec]/20 text-center text-lg font-bold text-white transition duration-300"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!scoreUpdate.fixtureId}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition duration-300 transform hover:scale-105 ${
              scoreUpdate.fixtureId
                ? 'bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-purple-700 hover:to-[#850cec] text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            🎯 Update Match Result
          </button>
        </form>
      </div>

      {/* Scheduled Fixtures */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <span className="text-blue-400 text-lg">📅</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Scheduled Fixtures</h3>
              <p className="text-gray-400">
                {scheduledFixtures.length} upcoming matches
                {selectedLeague !== 'all' && ` in ${selectedLeague === 'general' ? 'General' : leagues.find(l => l.id.toString() === selectedLeague)?.name || selectedLeague}`}
              </p>
            </div>
          </div>

          {/* League Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 text-sm font-semibold">Filter:</span>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#850cec] focus:border-transparent text-white text-sm"
            >
              <option value="all">All Leagues</option>
              <option value="general">General Fixtures</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name} ({fixtures.filter(f => f.leagueId?.toString() === league.id.toString() && f.status === 'scheduled').length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-[#850cec] font-semibold">
              {scheduledFixtures.length === 0 ? 0 : indexOfFirstFixture + 1}-{Math.min(indexOfLastFixture, scheduledFixtures.length)}
            </span> of{' '}
            <span className="text-purple-400 font-semibold">{scheduledFixtures.length}</span> fixtures
          </p>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {currentFixtures.map(fixture => (
            <div key={fixture.id} className="bg-gray-700 rounded-2xl p-6 border-2 border-gray-600 hover:border-[#850cec] transition duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className="bg-[#850cec] text-white px-3 py-1 rounded-full text-sm font-bold">
                    {getLeagueName(fixture)}
                  </span>
                  <span className="bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                    Round {fixture.round}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(fixture.date).toLocaleDateString()} • {fixture.time}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${getTeamColor(fixture.homeTeam)}`}>
                      {getInitials(fixture.homeTeam)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{fixture.homeTeam}</div>
                      <div className="text-gray-400 text-xs">Home</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mx-4">
                  <div className="text-xl font-black text-gray-400 mb-1">VS</div>
                  <div className="text-xs text-gray-500 bg-gray-600 px-2 py-1 rounded">
                    🏟️ {fixture.venue}
                  </div>
                </div>
                
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div>
                      <div className="font-bold text-white text-sm">{fixture.awayTeam}</div>
                      <div className="text-gray-400 text-xs">Away</div>
                    </div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${getTeamColor(fixture.awayTeam)}`}>
                      {getInitials(fixture.awayTeam)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="text-center mt-4">
                <button
                  onClick={() => setScoreUpdate({
                    fixtureId: fixture.id,
                    homeScore: '',
                    awayScore: ''
                  })}
                  className="bg-[#850cec] hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-300"
                >
                  Update This Match
                </button>
              </div>
            </div>
          ))}
          
          {scheduledFixtures.length === 0 && (
            <div className="text-center py-12 bg-gray-700 rounded-2xl border-2 border-dashed border-gray-600">
              <div className="text-6xl mb-4">📭</div>
              <h4 className="text-xl font-bold text-gray-400 mb-2">No Scheduled Matches</h4>
              <p className="text-gray-500">
                {selectedLeague === 'all' 
                  ? 'All matches have been completed.'
                  : `No scheduled matches found in ${selectedLeague === 'general' ? 'general fixtures' : 'this league'}.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg font-semibold transition duration-300 ${
                currentPage === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-[#850cec]'
              }`}
            >
              ←
            </button>

            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-2 rounded-lg font-semibold transition duration-300 ${
                  currentPage === number
                    ? 'bg-[#850cec] text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg font-semibold transition duration-300 ${
                currentPage === totalPages
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-[#850cec]'
              }`}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateScores;