// components/ManageFixtures.jsx
import React, { useState } from 'react';

const ManageFixtures = ({ fixtures, onUpdate, showMessage }) => {
  const [isAddFixtureOpen, setIsAddFixtureOpen] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    venue: '',
    round: 1
  });

  const completedFixtures = fixtures.filter(f => f.status === 'completed');
  const scheduledFixtures = fixtures.filter(f => f.status === 'scheduled');

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
    
    try {
      const response = await fetch('http://localhost:3001/fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          homeScore: null,
          awayScore: null,
          status: 'scheduled'
        }),
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
          round: 1
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

  return (
    <div className="space-y-8">
      {/* Add Fixture Button */}
      <div className="text-center">
        <button
          onClick={() => setIsAddFixtureOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-2xl transition duration-300 transform hover:scale-105 shadow-lg mb-2"
        >
          ➕ Add New Fixture
        </button>
        <p className="text-gray-600 text-sm">Add new scheduled matches to the tournament</p>
      </div>

      {/* Add Fixture Modal */}
      {isAddFixtureOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Fixture</h3>
              <button
                onClick={() => setIsAddFixtureOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddFixture} className="space-y-4">
              <div>
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
                  placeholder="Enter home team name"
                />
              </div>

              <div>
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
                  placeholder="Enter away team name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
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
                    Time *
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
                  placeholder="Enter venue name"
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
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition duration-300"
                >
                  Add Fixture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold">Total Matches</p>
              <p className="text-3xl font-bold text-gray-900">{fixtures.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{completedFixtures.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-semibold">Scheduled</p>
              <p className="text-3xl font-bold text-gray-900">{scheduledFixtures.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-orange-600 text-xl">⏰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Fixtures */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-green-600 text-lg">✅</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Completed Matches</h3>
            <p className="text-gray-600">Match results and statistics</p>
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
            <p className="text-gray-500">Match results will appear here once games are completed.</p>
          </div>
        )}
      </div>

      {/* Scheduled Fixtures */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-blue-600 text-lg">⏰</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Upcoming Matches</h3>
            <p className="text-gray-600">Scheduled fixtures awaiting results</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scheduledFixtures.map(fixture => (
            <div key={fixture.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-300 transition duration-300">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Round {fixture.round}
                </span>
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
            <h4 className="text-xl font-bold text-gray-600 mb-2">All Matches Completed</h4>
            <p className="text-gray-500">No scheduled matches remaining. Add new fixtures using the button above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFixtures;