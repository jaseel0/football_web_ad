// components/UpdateScores.jsx
import React, { useState } from 'react';

const UpdateScores = ({ users, fixtures, onUpdate, showMessage }) => {
  const [scoreUpdate, setScoreUpdate] = useState({
    fixtureId: '',
    homeScore: '',
    awayScore: ''
  });

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
      const fixtureResponse = await fetch(`http://localhost:3001/fixtures/${scoreUpdate.fixtureId}`, {
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

      const fixture = fixtures.find(f => f.id === parseInt(scoreUpdate.fixtureId));
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

    await fetch(`http://localhost:3001/users/${homeUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(homeUpdates),
    });

    await fetch(`http://localhost:3001/users/${awayUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(awayUpdates),
    });
  };

  const calculateUserUpdates = (user, goalsFor, goalsAgainst, isWin, isDraw) => {
    const newForm = [isWin ? 'W' : isDraw ? 'D' : 'L', ...user.form.slice(0, 4)];
    
    return {
      played: user.played + 1,
      won: user.won + (isWin ? 1 : 0),
      drawn: user.drawn + (isDraw ? 1 : 0),
      lost: user.lost + (!isWin && !isDraw ? 1 : 0),
      goalsFor: user.goalsFor + goalsFor,
      goalsAgainst: user.goalsAgainst + goalsAgainst,
      goalDifference: (user.goalsFor + goalsFor) - (user.goalsAgainst + goalsAgainst),
      points: user.points + (isWin ? 3 : isDraw ? 1 : 0),
      form: newForm
    };
  };

  const scheduledFixtures = fixtures.filter(f => f.status === 'scheduled');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Update Score Form */}
      <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-8 border border-green-100 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-green-600 text-lg">⚽</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Update Match Score</h3>
            <p className="text-gray-600">Record match results</p>
          </div>
        </div>

        <form onSubmit={handleUpdateScore} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Fixture <span className="text-red-500">*</span>
              </label>
              <select
                value={scoreUpdate.fixtureId}
                onChange={(e) => setScoreUpdate({...scoreUpdate, fixtureId: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition duration-300 appearance-none bg-white"
                required
              >
                <option value="" className="text-gray-400">Choose a scheduled match...</option>
                {scheduledFixtures.map(fixture => (
                  <option key={fixture.id} value={fixture.id} className="text-gray-700">
                    Round {fixture.round}: {fixture.homeTeam} vs {fixture.awayTeam}
                  </option>
                ))}
              </select>
            </div>
            
            {scoreUpdate.fixtureId && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                <div className="text-center mb-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Selected Match
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                      Home Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={scoreUpdate.homeScore}
                      onChange={(e) => setScoreUpdate({...scoreUpdate, homeScore: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-center text-lg font-bold transition duration-300"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                      Away Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={scoreUpdate.awayScore}
                      onChange={(e) => setScoreUpdate({...scoreUpdate, awayScore: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 text-center text-lg font-bold transition duration-300"
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
                ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            🎯 Update Match Result
          </button>
        </form>
      </div>

      {/* Scheduled Fixtures */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <span className="text-orange-600 text-lg">📅</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Scheduled Fixtures</h3>
            <p className="text-gray-600">
              {scheduledFixtures.length} upcoming matches
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {scheduledFixtures.map(fixture => (
            <div key={fixture.id} className="bg-white rounded-2xl p-6 border-2 border-orange-100 hover:border-orange-300 shadow-sm hover:shadow-md transition duration-300">
              <div className="text-center mb-4">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Round {fixture.round}
                </span>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <div className="font-bold text-gray-900 text-lg">{fixture.homeTeam}</div>
                  <div className="text-orange-500 text-sm font-semibold">Home</div>
                </div>
                
                <div className="text-center mx-6">
                  <div className="text-3xl font-black text-gray-400 mb-1">VS</div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {new Date(fixture.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{fixture.time}</div>
                </div>
                
                <div className="text-center flex-1">
                  <div className="font-bold text-gray-900 text-lg">{fixture.awayTeam}</div>
                  <div className="text-blue-500 text-sm font-semibold">Away</div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 bg-gray-50 py-2 rounded-lg">
                🏟️ {fixture.venue}
              </div>
            </div>
          ))}
          
          {scheduledFixtures.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📭</div>
              <h4 className="text-xl font-bold text-gray-600 mb-2">No Scheduled Matches</h4>
              <p className="text-gray-500">All matches have been completed or scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateScores;