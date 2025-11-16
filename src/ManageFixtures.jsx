// components/ManageFixtures.jsx
import React, { useState, useEffect } from 'react';

const ManageFixtures = ({ fixtures, onUpdate, showMessage }) => {
  const API_BASE = "https://football-web-bd.onrender.com";
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
  const [isGeneratePlayoffOpen, setIsGeneratePlayoffOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [standings, setStandings] = useState([]);
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
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'playoff'
  
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    round: 1,
    leagueId: ''
  });

  const [generatePlayoffData, setGeneratePlayoffData] = useState({
    leagueId: '',
    startDate: '',
    venue: 'Main Arena',
    stage: 'single',
    teamsCount: 4 // 4, 8
  });

  // Fetch users, leagues, and standings
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

    const fetchStandings = async () => {
      try {
        const response = await fetch(`${API_BASE}/standings`);
        if (response.ok) {
          const standingsData = await response.json();
          setStandings(standingsData);
        } else {
          // If standings endpoint doesn't exist, create mock standings from users
          const mockStandings = users.map(user => ({
            teamName: user.teamName,
            points: user.points || 0,
            goalDifference: user.goalDifference || 0,
            goalsFor: user.goalsFor || 0,
            played: user.played || 0
          }));
          setStandings(mockStandings);
        }
      } catch (error) {
        console.error('Failed to fetch standings, using user data:', error);
        // Create standings from users data as fallback
        const userStandings = users.map(user => ({
          teamName: user.teamName,
          points: user.points || 0,
          goalDifference: user.goalDifference || 0,
          goalsFor: user.goalsFor || 0,
          played: user.played || 0,
          leagueId: generatePlayoffData.leagueId
        }));
        setStandings(userStandings);
      }
    };
    
    fetchUsers();
    fetchLeagues();
    fetchStandings();
  }, [users, generatePlayoffData.leagueId]);

  // Filter fixtures based on selected filters and active tab
  const filteredFixtures = fixtures.filter(fixture => {
    // Tab filter - check for playoffType field to determine if it's a playoff
    const isPlayoff = fixture.playoffType && fixture.playoffType !== '';
    const tabMatch = activeTab === 'regular' ? !isPlayoff : isPlayoff;
    
    // League filter
    const leagueMatch = selectedLeague === 'all' || 
      (selectedLeague === 'general' ? !fixture.leagueId : fixture.leagueId === selectedLeague);
    
    // Status filter
    const statusMatch = statusFilter === 'all' || fixture.status === statusFilter;
    
    // Date filter
    const dateMatch = !dateFilter || fixture.date === dateFilter;
    
    // Search filter
    const searchMatch = !searchTerm || 
      fixture.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fixture.venue.toLowerCase().includes(searchTerm.toLowerCase());

    return tabMatch && leagueMatch && statusMatch && dateMatch && searchMatch;
  });

  // Separate playoff fixtures for statistics
  const playoffFixtures = fixtures.filter(f => f.playoffType && f.playoffType !== '');
  const regularFixtures = fixtures.filter(f => !f.playoffType || f.playoffType === '');

  const completedFixtures = filteredFixtures.filter(f => f.status === 'completed');
  const scheduledFixtures = filteredFixtures.filter(f => f.status === 'scheduled');
  const liveFixtures = filteredFixtures.filter(f => f.status === 'live');

  // Filter teams based on input for regular fixtures
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

  // Get standings for a specific league
  const getLeagueStandings = (leagueId) => {
    if (!leagueId) return [];
    
    // If we have standings from API, use them
    if (standings.length > 0 && standings[0].leagueId) {
      const leagueStandings = standings.filter(standing => 
        standing.leagueId === leagueId
      );
      
      // Sort by points, goal difference, goals for
      return leagueStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    } else {
      // Fallback: use users data to create standings
      const league = leagues.find(l => l.id === leagueId);
      if (!league || !league.teams) return [];
      
      const userStandings = users
        .filter(user => league.teams.includes(user.teamName))
        .map(user => ({
          teamName: user.teamName,
          points: user.points || 0,
          goalDifference: user.goalDifference || 0,
          goalsFor: user.goalsFor || 0,
          played: user.played || 0
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });
      
      return userStandings;
    }
  };

  // Generate playoff fixtures based on standings
  const generatePlayoffFixtures = async (e) => {
    e.preventDefault();
    
    if (!generatePlayoffData.leagueId) {
      showMessage('error', 'Please select a league');
      return;
    }

    if (!generatePlayoffData.startDate) {
      showMessage('error', 'Please select a start date');
      return;
    }

    const leagueStandings = getLeagueStandings(generatePlayoffData.leagueId);
    
    if (leagueStandings.length < generatePlayoffData.teamsCount) {
      showMessage('error', `Not enough teams in the league. Need ${generatePlayoffData.teamsCount} teams but only ${leagueStandings.length} available.`);
      return;
    }

    const topTeams = leagueStandings.slice(0, generatePlayoffData.teamsCount);
    const playoffFixtures = [];

    // Generate fixtures based on team count
    if (generatePlayoffData.teamsCount == 4) {
      // Semi-finals: 1st vs 4th, 2nd vs 3rd
      playoffFixtures.push({
        homeTeam: topTeams[0].teamName,
        awayTeam: topTeams[3].teamName,
        playoffType: 'semifinal',
        stage: generatePlayoffData.stage,
        description: 'Semi Final 1: 1st vs 4th'
      });
      playoffFixtures.push({
        homeTeam: topTeams[1].teamName,
        awayTeam: topTeams[2].teamName,
        playoffType: 'semifinal',
        stage: generatePlayoffData.stage,
        description: 'Semi Final 2: 2nd vs 3rd'
      });
      
      // Final
      playoffFixtures.push({
        homeTeam: 'TBD', // Winner of Semi Final 1
        awayTeam: 'TBD', // Winner of Semi Final 2
        playoffType: 'final',
        stage: generatePlayoffData.stage,
        description: 'Final: Winner SF1 vs Winner SF2'
      });
    } else if (generatePlayoffData.teamsCount == 8) {
      // Quarter-finals
      playoffFixtures.push({
        homeTeam: topTeams[0].teamName,
        awayTeam: topTeams[7].teamName,
        playoffType: 'quarterfinal',
        stage: generatePlayoffData.stage,
        description: 'Quarter Final 1: 1st vs 8th'
      });
      playoffFixtures.push({
        homeTeam: topTeams[1].teamName,
        awayTeam: topTeams[6].teamName,
        playoffType: 'quarterfinal',
        stage: generatePlayoffData.stage,
        description: 'Quarter Final 2: 2nd vs 7th'
      });
      playoffFixtures.push({
        homeTeam: topTeams[2].teamName,
        awayTeam: topTeams[5].teamName,
        playoffType: 'quarterfinal',
        stage: generatePlayoffData.stage,
        description: 'Quarter Final 3: 3rd vs 6th'
      });
      playoffFixtures.push({
        homeTeam: topTeams[3].teamName,
        awayTeam: topTeams[4].teamName,
        playoffType: 'quarterfinal',
        stage: generatePlayoffData.stage,
        description: 'Quarter Final 4: 4th vs 5th'
      });
      
      // Semi-finals
      playoffFixtures.push({
        homeTeam: 'TBD', // Winner of QF1
        awayTeam: 'TBD', // Winner of QF4
        playoffType: 'semifinal',
        stage: generatePlayoffData.stage,
        description: 'Semi Final 1: Winner QF1 vs Winner QF4'
      });
      playoffFixtures.push({
        homeTeam: 'TBD', // Winner of QF2
        awayTeam: 'TBD', // Winner of QF3
        playoffType: 'semifinal',
        stage: generatePlayoffData.stage,
        description: 'Semi Final 2: Winner QF2 vs Winner QF3'
      });
      
      // Final
      playoffFixtures.push({
        homeTeam: 'TBD', // Winner of SF1
        awayTeam: 'TBD', // Winner of SF2
        playoffType: 'final',
        stage: generatePlayoffData.stage,
        description: 'Final: Winner SF1 vs Winner SF2'
      });
    }

    try {
      // Create dates for each round
      const startDate = new Date(generatePlayoffData.startDate);
      
      // Create all playoff fixtures
      for (let i = 0; i < playoffFixtures.length; i++) {
        const fixture = playoffFixtures[i];
        
        // Calculate date based on round
        let fixtureDate = new Date(startDate);
        if (fixture.playoffType === 'quarterfinal') {
          // Quarter finals on start date
          fixtureDate = new Date(startDate);
        } else if (fixture.playoffType === 'semifinal') {
          // Semi finals 1 week after start
          fixtureDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (fixture.playoffType === 'final') {
          // Final 2 weeks after start
          fixtureDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        }

        const fixtureData = {
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          date: fixtureDate.toISOString().split('T')[0],
          time: '20:00',
          venue: generatePlayoffData.venue,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
          playoffType: fixture.playoffType,
          stage: generatePlayoffData.stage,
          round: 0,
          leagueId: generatePlayoffData.leagueId,
          description: fixture.description
        };

        const response = await fetch(`${API_BASE}/fixtures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fixtureData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create fixture: ${fixture.description}`);
        }
      }

      showMessage('success', `Playoff bracket for ${generatePlayoffData.teamsCount} teams generated successfully!`);
      setIsGeneratePlayoffOpen(false);
      setGeneratePlayoffData({
        leagueId: '',
        startDate: '',
        venue: 'Main Arena',
        stage: 'single',
        teamsCount: 4
      });
      onUpdate();
    } catch (error) {
      console.error('Error generating playoff fixtures:', error);
      showMessage('error', `Failed to generate playoff fixtures: ${error.message}`);
    }
  };

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
  }, [selectedLeague, statusFilter, dateFilter, searchTerm, activeTab]);

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

  const handleGeneratePlayoffChange = (e) => {
    setGeneratePlayoffData({
      ...generatePlayoffData,
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

  // Get playoff type badge color
  const getPlayoffBadgeColor = (playoffType) => {
    switch (playoffType) {
      case 'final': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'semifinal': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'quarterfinal': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get playoff type display name
  const getPlayoffDisplayName = (playoffType) => {
    switch (playoffType) {
      case 'quarterfinal': return 'Quarter Final';
      case 'semifinal': return 'Semi Final';
      case 'final': return 'Final';
      default: return playoffType;
    }
  };

  // Check if fixture is playoff
  const isPlayoffFixture = (fixture) => {
    return fixture.playoffType && fixture.playoffType !== '';
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
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsGeneratePlayoffOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg shadow-green-600/30"
            >
              🏆 Generate Playoff Bracket
            </button>
            <button
              onClick={() => setIsAddFixtureOpen(true)}
              className="bg-gradient-to-r from-[#850cec] to-purple-600 hover:from-purple-700 hover:to-[#850cec] text-white font-bold py-3 px-6 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg shadow-[#850cec]/30"
            >
              ➕ Schedule Regular Match
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-700 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('regular')}
            className={`px-6 py-3 rounded-lg font-semibold transition duration-300 ${
              activeTab === 'regular'
                ? 'bg-[#850cec] text-white shadow-lg shadow-[#850cec]/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            Regular Fixtures
          </button>
          <button
            onClick={() => setActiveTab('playoff')}
            className={`px-6 py-3 rounded-lg font-semibold transition duration-300 ${
              activeTab === 'playoff'
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            Playoff Matches
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
            <div className="text-gray-400 text-sm">
              {activeTab === 'regular' ? 'Regular Matches' : 'Playoff Matches'}
            </div>
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

      {/* Generate Playoff Bracket Modal */}
      {isGeneratePlayoffOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">🏆 Generate Playoff Bracket</h3>
              <button
                onClick={() => setIsGeneratePlayoffOpen(false)}
                className="text-gray-400 hover:text-white text-2xl transition duration-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={generatePlayoffFixtures} className="space-y-4">
              {/* League Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Select League *
                </label>
                <select
                  name="leagueId"
                  value={generatePlayoffData.leagueId}
                  onChange={handleGeneratePlayoffChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                >
                  <option value="">Select a league</option>
                  {leagues.map(league => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teams Count */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Playoff Teams *
                </label>
                <select
                  name="teamsCount"
                  value={generatePlayoffData.teamsCount}
                  onChange={handleGeneratePlayoffChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                >
                  <option value="4">Top 4 Teams</option>
                  <option value="8">Top 8 Teams</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  {generatePlayoffData.teamsCount === '4' 
                    ? 'Semi-finals + Final' 
                    : 'Quarter-finals + Semi-finals + Final'
                  }
                </p>
              </div>

              {/* Stage Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Match Format *
                </label>
                <select
                  name="stage"
                  value={generatePlayoffData.stage}
                  onChange={handleGeneratePlayoffChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                >
                  <option value="single">Single Match</option>
                  <option value="two-leg">Two-Leg Tie</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={generatePlayoffData.startDate}
                  onChange={handleGeneratePlayoffChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={generatePlayoffData.venue}
                  onChange={handleGeneratePlayoffChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                  placeholder="Enter match venue"
                />
              </div>

              {/* Standings Preview */}
              {generatePlayoffData.leagueId && (
                <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                  <h4 className="font-semibold text-white mb-3">Current Top {generatePlayoffData.teamsCount} Teams</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getLeagueStandings(generatePlayoffData.leagueId)
                      .slice(0, parseInt(generatePlayoffData.teamsCount))
                      .map((team, index) => (
                        <div key={team.teamName} className="flex justify-between items-center text-sm">
                          <span className="text-white">
                            {index + 1}. {team.teamName}
                          </span>
                          <span className="text-gray-400">
                            {team.points}PTS (Played: {team.played})
                          </span>
                        </div>
                      ))
                    }
                    {getLeagueStandings(generatePlayoffData.leagueId).length === 0 && (
                      <p className="text-gray-400 text-sm">No teams found in this league</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsGeneratePlayoffOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition duration-300"
                >
                  Generate Bracket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Regular Fixture Modal */}
      {isAddFixtureOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Schedule Regular Match</h3>
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
          <span className="text-purple-400 font-semibold">{filteredFixtures.length}</span> {activeTab === 'regular' ? 'fixtures' : 'playoff matches'}
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
        {currentFixtures.map(fixture => {
          const isPlayoff = isPlayoffFixture(fixture);
          return (
            <div key={fixture.id} className={`bg-gray-800 rounded-2xl p-6 border-2 ${isPlayoff ? 'border-yellow-600 hover:border-yellow-500' : 'border-gray-700 hover:border-[#850cec]'} transition duration-300 group`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadgeColor(fixture.status)}`}>
                    {getStatusIcon(fixture.status)} {fixture.status.toUpperCase()}
                  </span>
                  {isPlayoff ? (
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPlayoffBadgeColor(fixture.playoffType)}`}>
                      🏆 {getPlayoffDisplayName(fixture.playoffType)}
                    </span>
                  ) : (
                    <span className="bg-[#850cec]/20 text-[#850cec] px-3 py-1 rounded-full text-sm font-semibold border border-[#850cec]/30">
                      {getLeagueName(fixture)}
                    </span>
                  )}
                  {!isPlayoff && (
                    <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                      Round {fixture.round}
                    </span>
                  )}
                  {isPlayoff && fixture.stage === 'two-leg' && (
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-semibold border border-blue-500/30">
                      Two-Leg Tie
                    </span>
                  )}
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
          );
        })}
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
          <div className="text-6xl mb-4">
            {activeTab === 'regular' ? '📋' : '🏆'}
          </div>
          <h4 className="text-2xl font-bold text-gray-400 mb-2">
            {activeTab === 'regular' ? 'No Fixtures Found' : 'No Playoff Matches Found'}
          </h4>
          <p className="text-gray-500">
            {searchTerm || selectedLeague !== 'all' || statusFilter !== 'all' || dateFilter
              ? 'Try adjusting your filters to see more results.'
              : activeTab === 'regular' 
                ? 'No fixtures scheduled yet. Schedule your first match using the button above.'
                : 'No playoff matches scheduled yet. Generate a playoff bracket using the button above.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageFixtures;