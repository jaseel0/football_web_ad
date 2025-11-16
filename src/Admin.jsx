// components/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import ManageUsers from "./ManageUsers";
import UpdateScores from "./UpdateScores";
import ManageFixtures from "./ManageFixtures";
import ManageLeagues from "./ManageLeagues";

const AdminPanel = () => {
  const API_BASE = "http://localhost:3001";
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ---- showMessage helper with cleanup ----
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });

    const timeout = setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // ---- fetchData function ----
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, fixturesRes, leaguesRes] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/fixtures`),
        fetch(`${API_BASE}/leagues`),
      ]);

      if (!usersRes.ok || !fixturesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const usersData = await usersRes.json();
      const fixturesData = await fixturesRes.json();
      const leaguesData = leaguesRes.ok ? await leaguesRes.json() : [];

      setUsers(usersData);
      setFixtures(fixturesData);
      setLeagues(leaguesData);
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // ---- fetch data on component mount ----
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    {
      id: "users",
      label: "Manage Users",
      icon: "👥",
      color: "from-[#850cec] to-purple-500",
    },
    {
      id: "scores",
      label: "Update Scores",
      icon: "⚽",
      color: "from-green-500 to-[#850cec]",
    },
    {
      id: "fixtures",
      label: "Manage Fixtures",
      icon: "📅",
      color: "from-orange-500 to-[#850cec]",
    },
    {
      id: "leagues",
      label: "Manage Leagues",
      icon: "🏆",
      color: "from-purple-500 to-[#850cec]",
    },
  ];

  // ---- Loading screen ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 pt-16">
        <div className="max-w-7xl mx-auto py-12 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#850cec]"></div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Stats Cards ----
  const stats = [
    {
      label: "Total Players",
      value: users.length,
      icon: "👥",
      color: "from-[#850cec] to-purple-500"
    },
    {
      label: "Upcoming Matches",
      value: fixtures.filter((f) => f.status === "scheduled").length,
      icon: "📅",
      color: "from-green-500 to-[#850cec]"
    },
    {
      label: "Completed Matches",
      value: fixtures.filter((f) => f.status === "completed").length,
      icon: "✅",
      color: "from-blue-500 to-[#850cec]"
    },
    {
      label: "Active Leagues",
      value: leagues.length,
      icon: "🏆",
      color: "from-purple-500 to-[#850cec]"
    }
  ];

  // ---- Main UI ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 pt-16">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#850cec] to-purple-500 bg-clip-text text-transparent mb-3">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Manage your eFootball competition, update scores, and oversee player statistics
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700 hover:border-[#850cec] transition duration-300 transform hover:scale-105"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-[#850cec] mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-8 p-4 rounded-xl border-l-4 ${
              message.type === "success"
                ? "bg-green-500/10 border-green-400 text-green-400"
                : message.type === "error"
                ? "bg-red-500/10 border-red-400 text-red-400"
                : "bg-blue-500/10 border-blue-400 text-blue-400"
            } shadow-lg backdrop-blur-sm`}
          >
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-5 h-5 ${
                  message.type === "success"
                    ? "text-green-400"
                    : message.type === "error"
                    ? "text-red-400"
                    : "text-blue-400"
                }`}
              >
                {message.type === "success" ? "✓" : message.type === "error" ? "⚠" : "ℹ"}
              </div>
              <div className="ml-3">
                <p className="font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-8 py-5 font-semibold text-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "users" && (
              <ManageUsers
                users={users}
                fixtures={fixtures}
                onUpdate={fetchData}
                showMessage={showMessage}
              />
            )}
            {activeTab === "scores" && (
              <UpdateScores
                users={users}
                fixtures={fixtures}
                onUpdate={fetchData}
                showMessage={showMessage}
              />
            )}
            {activeTab === "fixtures" && (
              <ManageFixtures
                fixtures={fixtures}
                onUpdate={fetchData}
                showMessage={showMessage}
              />
            )}
            {activeTab === "leagues" && (
              <ManageLeagues
                users={users}
                fixtures={fixtures}
                onUpdate={fetchData}
                showMessage={showMessage}
              />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">🚀 Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => {
                // Refresh all data
                fetchData();
                showMessage("success", "Data refreshed successfully!");
              }}
              className="bg-gray-700 hover:bg-[#850cec] text-white py-3 px-4 rounded-xl transition duration-300 text-sm font-semibold"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => {
                // Export data functionality
                showMessage("info", "Export feature coming soon!");
              }}
              className="bg-gray-700 hover:bg-green-600 text-white py-3 px-4 rounded-xl transition duration-300 text-sm font-semibold"
            >
              📊 Export Data
            </button>
            <button
              onClick={() => {
                // Backup functionality
                showMessage("info", "Backup feature coming soon!");
              }}
              className="bg-gray-700 hover:bg-blue-600 text-white py-3 px-4 rounded-xl transition duration-300 text-sm font-semibold"
            >
              💾 Backup System
            </button>
            <button
              onClick={() => {
                // System status
                showMessage("info", "System is running smoothly!");
              }}
              className="bg-gray-700 hover:bg-purple-600 text-white py-3 px-4 rounded-xl transition duration-300 text-sm font-semibold"
            >
              📈 System Status
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Admin Panel • eFootball Management System • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;