// components/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import ManageUsers from "./ManageUsers";
import UpdateScores from "./UpdateScores";
import ManageFixtures from "./ManageFixtures";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
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
      const [usersRes, fixturesRes] = await Promise.all([
        fetch("http://localhost:3001/users"),
        fetch("http://localhost:3001/fixtures"),
      ]);

      if (!usersRes.ok || !fixturesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const usersData = await usersRes.json();
      const fixturesData = await fixturesRes.json();

      setUsers(usersData);
      setFixtures(fixturesData);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- fetch data on component mount ----
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    {
      id: "users",
      label: "Manage Users",
      icon: "👥",
      color: "from-blue-500 to-purple-500",
    },
    {
      id: "scores",
      label: "Update Scores",
      icon: "⚽",
      color: "from-green-500 to-blue-500",
    },
    {
      id: "fixtures",
      label: "Manage Fixtures",
      icon: "📅",
      color: "from-orange-500 to-red-500",
    },
  ];

  // ---- Loading screen ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16">
        <div className="max-w-7xl mx-auto py-12 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main UI ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your eFootball competition, update scores, and oversee player
            statistics
          </p>

          <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Live Competition</span>
            </div>
            <span>•</span>
            <span>{users.length} Players</span>
            <span>•</span>
            <span>
              {fixtures.filter((f) => f.status === "scheduled").length} Upcoming
              Matches
            </span>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-8 p-4 rounded-xl border-l-4 ${
              message.type === "success"
                ? "bg-green-50 border-green-400 text-green-700"
                : "bg-red-50 border-red-400 text-red-700"
            } shadow-sm`}
          >
            <div className="flex items-center">
              <div
                className={`flex-shrink-0 w-5 h-5 ${
                  message.type === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {message.type === "success" ? "✓" : "⚠"}
              </div>
              <div className="ml-3">
                <p className="font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden border border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-8 py-5 font-semibold text-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;